#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT_ORIGIN = 'https://offline-inspection.invalid';
const ROOT_PATTERN = /(?:\bfrom\s*|\bimport\s*)["']([^"']+\.js)["']/g;

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function tokenize(source) {
  const out = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && source[i + 1] === '/') { i += 2; while (i < source.length && source[i] !== '\n') i++; continue; }
    if (c === '/' && source[i + 1] === '*') { i += 2; while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") {
      const quote = c; const start = i++;
      while (i < source.length) { if (source[i] === '\\') { i += 2; continue; } if (source[i++] === quote) break; }
      out.push({ type: 'string', value: source.slice(start + 1, Math.max(start + 1, i - 1)) }); continue;
    }
    if (c === '`') { i++; while (i < source.length) { if (source[i] === '\\') { i += 2; continue; } if (source[i++] === '`') break; } out.push({ type: 'template', value: '' }); continue; }
    if (/[A-Za-z_$]/.test(c)) { const start = i++; while (i < source.length && /[\w$]/.test(source[i])) i++; out.push({ type: 'id', value: source.slice(start, i) }); continue; }
    out.push({ type: 'punct', value: c }); i++;
  }
  return out;
}

export function staticJsImports(source) {
  return scanStaticJs(source).imports;
}

export function scanStaticJs(source) {
  const tokens = tokenize(source), imports = [], unsupported = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'id' || (t.value !== 'import' && t.value !== 'export')) continue;
    let j = i + 1;
    if (t.value === 'import') {
      if (tokens[j]?.value === '(' || tokens[j]?.value === '.') continue;
      if (tokens[j]?.type === 'string') { imports.push(tokens[j].value); continue; }
    }
    // Search this declaration for `from "specifier"`; stop at a semicolon or a new statement.
    const limit = Math.min(tokens.length, j + 200);
    let found = false, ended = false;
    for (; j < limit; j++) {
      if (tokens[j].value === ';' || (j > i + 1 && tokens[j].type === 'id' && ['import', 'export', 'const', 'let', 'var', 'function', 'class'].includes(tokens[j].value))) break;
      if (tokens[j].type === 'id' && tokens[j].value === 'from' && tokens[j + 1]?.type === 'string') { imports.push(tokens[j + 1].value); found = true; break; }
    }
    ended = j < limit || j >= tokens.length;
    if (!found && !ended) unsupported.push({ token: i, reason: 'static import/export declaration exceeds the 200-token inspection bound' });
    else if (!found) unsupported.push({ token: i, reason: 'static import/export declaration is not recognized by the bounded scanner' });
  }
  return { imports, unsupported };
}

function htmlAssets(html) {
  const refs = [], external = [];
  for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const attrs = [...tag[0].matchAll(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi)];
    for (const [, name, , value] of attrs) {
      if (/^https?:\/\//i.test(value) || value.startsWith('//')) { external.push({ source: 'index.html', kind: name.toLowerCase(), url: value }); continue; }
      if (value.startsWith('/assets/')) refs.push(value);
      else if (value.startsWith('/api/') || value.startsWith('/private/')) refs.push(value);
      else if (value.startsWith('/') && /\.(?:js|css)(?:[?#]|$)/i.test(value)) refs.push(value);
    }
  }
  for (const match of html.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) if (/^(?:https?:)?\/\//i.test(match[2])) external.push({ source: 'index.html', kind: 'url', url: match[2] });
  return { refs: [...new Set(refs)], external };
}

function cssResources(source, asset) {
  const resources = [];
  for (const match of source.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const url = match[2].trim();
    if (/^(?:https?:)?\/\//i.test(url)) resources.push({ source: asset, kind: /font/i.test(match[0]) ? 'font' : 'resource', url });
  }
  for (const match of source.matchAll(/@import\s+(?:url\()?\s*(['"])(.*?)\1/gi)) {
    const url = match[2];
    if (/^(?:https?:)?\/\//i.test(url)) resources.push({ source: asset, kind: 'stylesheet', url });
  }
  return resources;
}

function importTarget(fromAsset, specifier) {
  if (/^(?:[a-z]+:)?\/\//i.test(specifier)) return { external: true, url: specifier };
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return { external: true, url: `bare:${specifier}` };
  const url = new URL(specifier, `${ROOT_ORIGIN}${fromAsset}`);
  return { external: url.origin !== ROOT_ORIGIN, path: `${url.pathname}${url.search}${url.hash}`, url: url.href };
}

export async function inspectDist(distDirectory, filesystem = fs) {
  const root = await filesystem.realpath(path.resolve(distDirectory));
  const indexPath = path.join(root, 'index.html');
  const indexReal = await filesystem.realpath(indexPath);
  if (!inside(root, indexReal)) throw new Error('index.html resolves outside the supplied build directory.');
  const html = await filesystem.readFile(indexReal, 'utf8');
  const links = htmlAssets(html);
  const queue = [...links.refs];
  const visited = new Set(), missing = [], unsafe = [], queryImports = [], externals = [...links.external], apiPaths = [], unsupportedSyntax = [];
  const sourceRefs = new Set(links.refs);
  const checkedText = new Map();
  let assetBytes = 0;
  while (queue.length) {
    const asset = queue.shift();
    if (visited.has(asset)) continue;
    visited.add(asset);
    if (asset.includes('?') || asset.includes('#')) { queryImports.push(asset); continue; }
    if (!asset.startsWith('/assets/')) { if (/^\/(?:api|private)\//.test(asset)) apiPaths.push(asset); else unsafe.push({ from: 'index.html', path: asset, reason: 'outside /assets cache allowlist' }); continue; }
    let decoded;
    try { decoded = decodeURIComponent(new URL(asset, ROOT_ORIGIN).pathname); }
    catch { unsafe.push({ from: 'index.html', path: asset, reason: 'malformed percent-encoding in asset path' }); continue; }
    const candidate = path.resolve(root, `.${decoded}`);
    if (!inside(root, candidate)) { unsafe.push({ from: 'index.html', path: asset, reason: 'path escapes build directory' }); continue; }
    let real;
    try { real = await filesystem.realpath(candidate); } catch (error) { if (error.code === 'ENOENT') { missing.push({ from: 'index.html', path: asset }); continue; } throw error; }
    if (!inside(root, real)) { unsafe.push({ from: 'index.html', path: asset, reason: 'symlink resolves outside build directory' }); continue; }
    const body = await filesystem.readFile(real);
    assetBytes += body.byteLength;
    const text = body.toString('utf8');
    checkedText.set(asset, text);
    if (asset.endsWith('.js')) {
      const scan = scanStaticJs(text);
      unsupportedSyntax.push(...scan.unsupported.map(item => ({ source: asset, ...item })));
      for (const specifier of scan.imports) {
        const target = importTarget(asset, specifier);
        if (target.external) { externals.push({ source: asset, kind: 'javascript-import', url: target.url }); continue; }
        if (target.path.includes('?') || target.path.includes('#')) { queryImports.push({ from: asset, path: target.path }); continue; }
        if (/^\/(?:api|private)\//.test(target.path)) { apiPaths.push(target.path); continue; }
        if (!/^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(target.path)) { unsafe.push({ from: asset, path: target.path, reason: 'static import is outside supported JS asset pattern' }); continue; }
        sourceRefs.add(target.path); queue.push(target.path);
      }
      // Compare independently discovered edges with the deployed runtime's current regex.
      for (const match of text.matchAll(ROOT_PATTERN)) {
        const target = importTarget(asset, match[1]);
        if (!target.external && /^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(target.path)) sourceRefs.add(target.path);
      }
    } else if (asset.endsWith('.css')) {
      externals.push(...cssResources(text, asset));
      for (const match of text.matchAll(/@import\s+(?:url\()?\s*(['"])(.*?)\1/gi)) {
        const target = importTarget(asset, match[2]);
        if (target.external) continue;
        if (target.path.startsWith('/assets/') && target.path.endsWith('.css')) { sourceRefs.add(target.path); queue.push(target.path); }
        else if (/^\/(?:api|private)\//.test(target.path)) apiPaths.push(target.path);
      }
    }
  }
  const runtimeSet = new Set(sourceRefs);
  const unresolved = [...visited].filter(asset => !sourceRefs.has(asset));
  const report = {
    distDirectory: root,
    currentBuildConfirmed: false,
    indexBytes: Buffer.byteLength(html),
    assets: { count: visited.size, bytes: assetBytes, totalBytes: Buffer.byteLength(html) + assetBytes, paths: [...visited].sort() },
    missing: missing.sort((a, b) => a.path.localeCompare(b.path)),
    unsafe: unsafe.sort((a, b) => a.path.localeCompare(b.path)),
    queryOrHashImports: queryImports,
    unsupportedSyntax,
    externalResources: externals,
    apiPathsInCacheSet: [...new Set(apiPaths)],
    runtimeRegexMismatch: { discoveredButRegexMissed: [], regexButNotDiscovered: unresolved },
    note: 'Inspection is static only; dynamic imports are intentionally excluded. Set currentBuildConfirmed only after an external build identity check.',
  };
  // Check every discovered static JS edge against the runtime regex by rescanning visited JS.
  const regexEdges = new Set();
  for (const asset of visited) if (asset.endsWith('.js') && checkedText.has(asset)) {
    const text = checkedText.get(asset);
    for (const match of text.matchAll(ROOT_PATTERN)) {
      const target = importTarget(asset, match[1]);
      if (!target.external && target.path.startsWith('/assets/')) regexEdges.add(`${asset} -> ${target.path}`);
    }
  }
  const discoveredEdges = [];
  for (const asset of visited) if (asset.endsWith('.js') && checkedText.has(asset)) {
    const scan = scanStaticJs(checkedText.get(asset));
    for (const specifier of scan.imports) {
      const target = importTarget(asset, specifier);
      if (!target.external && target.path.startsWith('/assets/')) discoveredEdges.push(`${asset} -> ${target.path}`);
    }
  }
  report.runtimeRegexMismatch = {
    discoveredButRegexMissed: [...new Set(discoveredEdges.filter(edge => !regexEdges.has(edge)))].sort(),
    regexButNotDiscovered: [...regexEdges].filter(edge => !discoveredEdges.includes(edge)).sort(),
  };
  return report;
}

async function main() {
  const dist = process.argv[2];
  if (!dist || process.argv.length > 3) { console.error('Usage: node tools/offline-inspection/inspect.mjs <dist-directory>'); process.exitCode = 2; return; }
  try {
    const report = await inspectDist(dist);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.missing.length || report.unsafe.length || report.queryOrHashImports.length || report.apiPathsInCacheSet.length || report.unsupportedSyntax.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
