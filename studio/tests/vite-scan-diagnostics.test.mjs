import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { analyzeViteScanLog } from '../../tools/vite-scan-diagnostics/analyze.mjs';

const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../../tools/vite-scan-diagnostics/analyze.mjs');
const warning = (stamp='2026-10-25T05:12:06.0784355Z') => [
  stamp + ' \x1b[31m(!) Failed to run dependency scan. Skipping dependency pre-bundling.\x1b[0m',
  stamp + '   Failed to scan for dependencies from entries:',
  stamp + '   /home/runner/work/KAIRO/KAIRO/studio/index.html',
  stamp + '   /home/runner/work/KAIRO/KAIRO/studio/src/signing/preview.html',
  stamp + '   [ERROR] The server is being restarted or closed. Request is outdated [plugin vite:dep-scan]',
  stamp + '     at throwClosedServerError (file:///home/runner/work/KAIRO/KAIRO/studio/node_modules/vite/dist/node/chunks/config.js:28810:32)',
].join('\n');

test('a clean or unrelated CI log is not misclassified as a Vite dependency failure', () => {
  assert.deepEqual(analyzeViteScanLog('808 tests passed\nVite build success'), {
    schemaVersion: 1, warningCount: 0, classification: 'clean', first: null,
  });
  assert.equal(analyzeViteScanLog('ERROR: unrelated test failed').warningCount, 0);
});

test('strips GitHub timestamps/ANSI and retains only relative preview entry paths', () => {
  const result = analyzeViteScanLog(warning());
  assert.equal(result.warningCount, 1);
  assert.equal(result.classification, 'closed-server-lifecycle-suspected');
  assert.equal(result.first.firstStackFunction, 'throwClosedServerError');
  assert.equal(result.first.firstCause, 'The server is being restarted or closed. Request is outdated');
  assert.deepEqual(result.first.entries, ['studio/index.html', 'studio/src/signing/preview.html']);
  assert.equal(JSON.stringify(result).includes('/home/runner'), false);
});

test('counts repeated warnings without mistaking every esbuild stack frame for a new failure', () => {
  const result = analyzeViteScanLog(warning() + '\n' + warning('2026-10-25T05:13:00.0000000Z'));
  assert.equal(result.warningCount, 2);
  assert.equal(result.first.entries.length, 2);
});

test('unrecognized Vite scan errors remain visible without inventing a closed-server cause', () => {
  const result = analyzeViteScanLog('(!) Failed to run dependency scan.\n[ERROR] Failed to resolve import foo');
  assert.equal(result.warningCount, 1);
  assert.equal(result.classification, 'other-scan-error');
  assert.equal(result.first.firstCause, 'Other Vite dependency-scan error (inspect original CI log)');
});

test('rejects invalid and oversized logs before unbounded processing', () => {
  assert.throws(() => analyzeViteScanLog(null), TypeError);
  assert.throws(() => analyzeViteScanLog('🧪'.repeat(5_000_000)), RangeError);
});

test('CLI reads piped logs, emits JSON and preserves diagnostic exit semantics', () => {
  const result = spawnSync(process.execPath, [cli], { input: warning(), encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).warningCount, 1);
  const bad = spawnSync(process.execPath, [cli, '--invalid'], { encoding: 'utf8', timeout: 5000 });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Usage/);
});
