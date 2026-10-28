import { readFile, readdir, stat } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { dirname, extname, join, relative, resolve } from 'node:path';

const stageRoot = resolve(process.argv[2] || join(import.meta.dirname, 'stage'));
const studioRoot = join(stageRoot, 'studio');
const packageJson = JSON.parse(await readFile(join(studioRoot, 'package.json'), 'utf8'));
const declaredPackages = new Set(Object.keys({
  ...packageJson.dependencies,
  ...packageJson.optionalDependencies,
  ...packageJson.devDependencies,
}));
const sourceRoots = [join(studioRoot, 'server'), join(studioRoot, 'src')];
const moduleExtensions = new Set(['.mjs', '.js', '.cjs', '.mts', '.ts', '.cts', '.tsx']);
const checked = new Set();
const closureFiles = new Set();
const unresolved = [];
const undeclared = [];

async function listModules(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await listModules(target));
    else if (entry.isFile() && moduleExtensions.has(extname(entry.name))) result.push(target);
  }
  return result;
}

function sourceSpecifiers(text) {
  const found = new Set();
  const patterns = [
    /^\s*(?:import|export)\s+(?:type\s+)?(?:[^'";\n]+?\s+from\s*)?(['"])([^'"]+)\1/gm,
    /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.add(match[2]);
  return [...found];
}

async function resolveLocal(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = extname(base)
    ? [base]
    : [base, ...['.mjs','.js','.cjs','.mts','.ts','.cts','.tsx','.json','.css'].map((extension) => base + extension), ...['index.mjs','index.js','index.ts','index.tsx'].map((name) => join(base, name))];
  for (const candidate of candidates) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* try next explicit resolution */ }
  }
  return null;
}

function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

for (const root of sourceRoots) {
  for (const file of await listModules(root)) {
    const text = await readFile(file, 'utf8');
    for (const specifier of sourceSpecifiers(text)) {
      if (specifier.startsWith('node:') || builtinModules.includes(specifier)) continue;
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const resolved = await resolveLocal(file, specifier);
        if (!resolved) unresolved.push(`${relative(stageRoot, file)} -> ${specifier}`);
      } else if (!declaredPackages.has(packageName(specifier))) {
        undeclared.push(`${relative(stageRoot, file)} -> ${specifier}`);
      }
    }
    checked.add(relative(stageRoot, file));
  }
}

const entryFiles = [
  'studio/server/learner-entry.mjs',
  'studio/server/extraction-coverage/index.mjs',
  'studio/server/listening-core/transcription.mjs',
  'studio/server/opportunities/index.mjs',
  'studio/src/extraction-coverage-ui/ExtractionCoverage.tsx',
  'studio/src/opportunities/Opportunities.tsx',
  'studio/src/listening-core/TranscriptReview.tsx',
];
const pending = entryFiles.map((item) => join(stageRoot, item));
while (pending.length) {
  const file = pending.pop();
  if (closureFiles.has(file)) continue;
  try { if (!(await stat(file)).isFile()) { unresolved.push(`closure entry is not a file: ${relative(stageRoot, file)}`); continue; } }
  catch { unresolved.push(`closure entry is missing: ${relative(stageRoot, file)}`); continue; }
  closureFiles.add(file);
  const text = await readFile(file, 'utf8');
  for (const specifier of sourceSpecifiers(text)) {
    if (specifier.startsWith('node:') || builtinModules.includes(specifier)) continue;
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const resolved = await resolveLocal(file, specifier);
      if (!resolved) unresolved.push(`${relative(stageRoot, file)} -> ${specifier}`);
      else pending.push(resolved);
    } else if (!declaredPackages.has(packageName(specifier))) {
      undeclared.push(`${relative(stageRoot, file)} -> ${specifier}`);
    }
  }
}

const entry = await readFile(join(studioRoot, 'dist', 'index.html'), 'utf8');
const clientRefs = [...entry.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((value) => value.startsWith('/'));
for (const ref of clientRefs) {
  const file = resolve(studioRoot, 'dist', ref.slice(1));
  try { if (!(await stat(file)).isFile()) unresolved.push(`studio/dist/index.html -> ${ref}`); }
  catch { unresolved.push(`studio/dist/index.html -> ${ref}`); }
}
const runtimeRequired = [
  'studio/server/learner-entry.mjs',
  'studio/server/ai-runtime/service.mjs',
  'studio/server/opportunities/index.mjs',
  'studio/server/extraction-coverage/index.mjs',
  'studio/server/listening-core/transcription.mjs',
  'studio/src/evidence-selection-core/model.ts',
  'studio/src/lesson-draft-core/model.ts',
  'studio/src/learner-pattern-events/index.ts',
  'studio/data/student-spaces/engineering.json',
  'studio/data/student-spaces/informatics.json',
  'tools/material_ingestion/extract.py',
  'data/opportunities-20261025/source-evidence.json',
  'data/public/opportunities/fnb-current-review.json',
  'data/public/opportunities/rmb-preparation-matrix.json',
];
for (const relativePath of runtimeRequired) {
  try { if (!(await stat(join(stageRoot, relativePath))).isFile()) unresolved.push(`required runtime file: ${relativePath}`); }
  catch { unresolved.push(`required runtime file: ${relativePath}`); }
}

if (unresolved.length || undeclared.length) {
  for (const issue of unresolved) console.error(`UNRESOLVED ${issue}`);
  for (const issue of undeclared) console.error(`UNDECLARED PACKAGE ${issue}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, checkedModuleFiles: checked.size, hostedAndFeatureClosureFiles: closureFiles.size, checkedClientReferences: clientRefs.length, nodeMajor: Number(process.versions.node.split('.')[0]), typescriptImportPolicy: 'Node 24 type stripping; build/runtime validation must remain explicit' }, null, 2));
}
