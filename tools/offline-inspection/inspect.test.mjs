import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { inspectDist, scanStaticJs, staticJsImports } from './inspect.mjs';

async function fixture(t, { html = '<script type="module" src="/assets/main.js"></script><link rel="stylesheet" href="/assets/app.css">', files = {} } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kairo-offline-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), html);
  for (const [name, body] of Object.entries(files)) await writeFile(path.join(root, name), body);
  return root;
}

test('static imports include compact from, export-from and side-effect forms but skip dynamic import', () => {
  const imports = staticJsImports(`import{a}from'./dep.js';export{b}from"./reexport.js";import'./side.js';import('./lazy.js');const text="import './string.js'"; // import './comment.js'`);
  assert.deepEqual(imports, ['./dep.js', './reexport.js', './side.js']);
});

test('closure resolves static JS dependencies and reports external CSS resources and runtime-regex differences', async t => {
  const root = await fixture(t, { files: {
    'assets/main.js': `import{a}from'./dep.js';export{b}from"./reexport.js";import'./side.js';import('./lazy.js');`,
    'assets/dep.js': 'export const a=1;', 'assets/reexport.js': 'export const b=2;', 'assets/side.js': 'globalThis.side=true;',
    'assets/app.css': `@font-face{font-family:x;src:url(https://fonts.example/font.woff2)}.hero{background:url('https://cdn.example/image.webp')}`,
  } });
  const report = await inspectDist(root);
  assert.equal(report.assets.count, 5);
  assert.ok(report.assets.paths.includes('/assets/dep.js'));
  assert.ok(report.assets.paths.includes('/assets/reexport.js'));
  assert.ok(report.assets.paths.includes('/assets/side.js'));
  assert.ok(!report.assets.paths.includes('/assets/lazy.js'));
  assert.equal(report.externalResources.length, 2);
  assert.ok(report.runtimeRegexMismatch.discoveredButRegexMissed.length === 0);
  assert.equal(report.apiPathsInCacheSet.length, 0);
});

test('missing static dependency is reported instead of silently marked cached', async t => {
  const root = await fixture(t, { files: { 'assets/main.js': `import './not-built.js';`, 'assets/app.css': '' } });
  const report = await inspectDist(root);
  assert.deepEqual(report.missing.map(item => item.path), ['/assets/not-built.js']);
  assert.equal(report.runtimeRegexMismatch.discoveredButRegexMissed.length, 0);
});

test('same-origin API asset references are flagged in the proposed cache set', async t => {
  const root = await fixture(t, { html: '<script src="/api/offline.js"></script>' });
  const report = await inspectDist(root);
  assert.deepEqual(report.apiPathsInCacheSet, ['/api/offline.js']);
  assert.ok(report.assets.paths.includes('/api/offline.js'));
});

test('CLI inspection is read-only and reports bounded asset/index byte totals', async t => {
  const root = await fixture(t, { files: { 'assets/main.js': 'export const a=1;' } });
  const before = await readFile(path.join(root, 'index.html'));
  const report = await inspectDist(root);
  assert.equal(report.currentBuildConfirmed, false);
  assert.equal(report.assets.totalBytes, report.indexBytes + report.assets.bytes);
  assert.deepEqual(await readFile(path.join(root, 'index.html')), before);
});

test('outside symlink is reported unsafe and its target text is never scanned', async t => {
  const root = await fixture(t, { files: { 'assets/main.js': `import './escape.js';`, 'assets/app.css': '' } });
  const outside = await mkdtemp(path.join(os.tmpdir(), 'kairo-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(path.join(outside, 'target.js'), `import './distinctive-secret-edge.js';\nimport 'https://secret-resource.invalid/pixel';`);
  try {
    await symlink(path.join(outside, 'target.js'), path.join(root, 'assets', 'escape.js'));
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      // Windows may deny both file symlinks and junctions. Simulate realpath's
      // symlink resolution while retaining the real filesystem for all reads.
      const outsideMain = path.join(outside, 'main.js');
      await writeFile(outsideMain, `import './distinctive-secret-edge.js';\nimport 'https://secret-resource.invalid/pixel';`);
      const candidate = path.join(root, 'assets', 'main.js');
      let outsideRead = false;
      const report = await inspectDist(root, {
        realpath: async input => path.resolve(input) === path.resolve(candidate) ? outsideMain : fs.realpath(input),
        readFile: async (...args) => { if (path.resolve(String(args[0])) === path.resolve(outsideMain)) outsideRead = true; return fs.readFile(...args); },
      });
      assert.ok(report.unsafe.some(item => item.path === '/assets/main.js' && item.reason.includes('symlink')));
      assert.equal(outsideRead, false);
      assert.ok(!report.runtimeRegexMismatch.discoveredButRegexMissed.some(edge => edge.includes('distinctive-secret-edge')));
      assert.ok(!report.externalResources.some(item => item.url.includes('secret-resource.invalid')));
      return;
    }
    throw error;
  }
  const report = await inspectDist(root);
  assert.ok(report.unsafe.some(item => item.path === '/assets/escape.js' && item.reason.includes('symlink')));
  assert.ok(!report.assets.paths.includes('/assets/escape.js'));
  assert.ok(!report.runtimeRegexMismatch.discoveredButRegexMissed.some(edge => edge.includes('distinctive-secret-edge')));
  assert.ok(!report.externalResources.some(item => item.url.includes('secret-resource.invalid')));
});

test('malformed encoded asset paths are reported without crashing', async t => {
  const root = await fixture(t, { html: '<script src="/assets/%E0.js"></script>' });
  const report = await inspectDist(root);
  assert.ok(report.unsafe.some(item => item.reason.includes('percent-encoding')));
});

test('bounded scanner reports unsupported long declarations instead of claiming full discovery', () => {
  const declaration = `import { ${Array.from({ length: 230 }, (_, index) => `name${index}`).join(', ')} } from './late.js';`;
  const scan = scanStaticJs(declaration);
  assert.deepEqual(scan.imports, []);
  assert.equal(scan.unsupported.length, 1);
  assert.match(scan.unsupported[0].reason, /200-token inspection bound/);
});
