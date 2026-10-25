// Builds the classic tracker worker and rewrites src/signing/manifest.json from the files on disk.
//
//   node src/signing/tools/build-assets.mjs           build the worker, hash everything, write the manifest
//   node src/signing/tools/build-assets.mjs --check   rebuild the worker in a temp folder and confirm it is byte-identical
//
// Run from the studio folder. The model and engine files are copied/downloaded by hand once (see docs); this script
// only measures them. Upstream facts below were read from the official download response on 23 October 2026.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';

const studio = resolve(import.meta.dirname, '../../..');
const pub = join(studio, 'public/signing');
const manifestPath = join(studio, 'src/signing/manifest.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const asset = path => { const bytes = readFileSync(join(pub, path)); return { path, sha256: sha(bytes), bytes: bytes.length }; };

async function buildWorker(outDir) {
  await build({
    configFile: false, root: studio, publicDir: false, logLevel: 'warn',
    build: {
      outDir, emptyOutDir: true, minify: 'esbuild', target: 'es2020', sourcemap: false, reportCompressedSize: false,
      lib: { entry: join(studio, 'src/signing/worker.ts'), name: 'KairoTracker', formats: ['iife'], fileName: () => 'tracker.worker.js' },
    },
  });
  return join(outDir, 'tracker.worker.js');
}

const tmp = mkdtempSync(join(tmpdir(), 'kairo-worker-'));
try {
  const built = await buildWorker(tmp);
  if (process.argv.includes('--check')) {
    const fresh = sha(readFileSync(built)), current = sha(readFileSync(join(pub, 'tracker.worker.js')));
    console.log(JSON.stringify({ reproducible: fresh === current, fresh, current }));
    process.exit(fresh === current ? 0 : 1);
  }
  copyFileSync(built, join(pub, 'tracker.worker.js'));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const pkg = JSON.parse(readFileSync(join(studio, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(studio, 'package-lock.json'), 'utf8'));
const entry = lock.packages['node_modules/@mediapipe/tasks-vision'];
const version = pkg.dependencies['@mediapipe/tasks-vision'];
if (entry.version !== version) throw new Error(`lockfile has ${entry.version}, package.json pins ${version}`);

const manifest = {
  contract: 'kairo-signing/0.1',
  mode: 'tracking-only',
  runtime: {
    package: '@mediapipe/tasks-vision', version, npmIntegrity: entry.integrity, license: entry.license,
    wasm: {
      simd: { loader: asset('wasm/vision_wasm_internal.js'), binary: asset('wasm/vision_wasm_internal.wasm') },
      nosimd: { loader: asset('wasm/vision_wasm_nosimd_internal.js'), binary: asset('wasm/vision_wasm_nosimd_internal.wasm') },
    },
  },
  model: {
    id: 'hand_landmarker', variant: 'float16/1', asset: asset('models/hand_landmarker.task'),
    source: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    md5: '15318430ea3851670fe9914116a9cfad', upstreamLastModified: 'Wed, 26 Apr 2023 03:33:24 GMT', retrieved: '2026-10-23',
    license: 'Apache-2.0 (model card: LICENSED UNDER Apache License, Version 2.0)',
    modelCard: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20(Lite_Full)%20with%20Fairness%20Oct%202021.pdf',
    limits: [
      'Intended for AR, gesture recognition and hand control; "meant for experimental usage".',
      'Out of scope per the card: hands with gloves or occlusions, and any surveillance or identity recognition.',
      'Not tested in "in-the-wild" low-end camera, low light or motion-blur conditions.',
      'Finds hand landmarks only. It is not a sign language model and says nothing about SASL.',
    ],
  },
  worker: { ...asset('tracker.worker.js'), source: 'src/signing/worker.ts' },
  licenseFile: asset('LICENSE-Apache-2.0.txt'),
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ wrote: 'src/signing/manifest.json', worker: manifest.worker, model: manifest.model.asset }, null, 1));
