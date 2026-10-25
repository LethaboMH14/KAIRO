import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
let server, buildStudioSequence, motor, pump;
test('load adapter and real lesson packs through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    ({ buildStudioSequence } = await server.ssrLoadModule('/src/studio-lesson-sequence/index.ts'));
    motor = (await server.ssrLoadModule('/src/studio-teaching-host/packs/motor.json')).default;
    pump = (await server.ssrLoadModule('/src/studio-teaching-host/packs/pump.json')).default;
  } catch (error) { await server.close(); throw error; }
});
test.after(async () => { await server?.close(); });
test('projects motor sources and manual/implemented capability labels without mutation', () => {
  const before = JSON.stringify(motor); const result = buildStudioSequence(motor);
  assert.equal(JSON.stringify(motor), before); assert.equal(result.steps.length, motor.steps.length);
  assert.equal(result.steps[1].capabilityStatus, 'manual'); assert.equal(result.steps[1].prompt, motor.steps[1].learnerAction);
  assert.equal(result.steps[1].readingFallback, motor.steps[1].learnerAction);
  assert.deepEqual(result.steps[0].sourceRefs, motor.sourceRefs); assert.match(result.steps[0].sourceRefs[0].licenseStatus, /no reuse licence confirmed/);
  assert.equal(result.steps[0].sourceRefs[0].checkedAt, '2026-10-24');
});
test('projects pump provenance and carries explicit non-mounted and illustrative limitations', () => {
  const result = buildStudioSequence(pump); assert.deepEqual(result.steps[1].sourceRefs.map(x => x.id), pump.steps[1].sourceRefIds);
  assert.ok(result.warnings.some(x => /not mounted in the app/.test(x))); assert.ok(result.warnings.some(x => /not validated against a real pump/.test(x)));
  assert.ok(result.warnings[0].includes('not independent verification'));
});
test('rejects missing/duplicate refs and duplicate step identities', () => {
  const missing = structuredClone(motor); missing.steps[0].sourceRefIds = ['absent'];
  assert.throws(() => buildStudioSequence(missing), /missing source reference/);
  const duplicateRef = structuredClone(motor); duplicateRef.sourceRefs.push(duplicateRef.sourceRefs[0]);
  assert.throws(() => buildStudioSequence(duplicateRef), /Duplicate source reference id/);
  const duplicateStep = structuredClone(motor); duplicateStep.steps[1].id = duplicateStep.steps[0].id;
  assert.throws(() => buildStudioSequence(duplicateStep), /Duplicate step id/);
});
test('rejects unsafe citation URLs, unsupported status, and overlong content without truncating', () => {
  const unsafe = structuredClone(motor); unsafe.sourceRefs[0].url = 'javascript:alert(1)';
  assert.throws(() => buildStudioSequence(unsafe), /safe HTTPS/);
  const unknown = structuredClone(motor); unknown.steps[0].capabilityStatus = 'available';
  assert.throws(() => buildStudioSequence(unknown), /Unsupported capabilityStatus/);
  const long = structuredClone(motor); long.steps[0].explanation = 'x'.repeat(4001);
  assert.throws(() => buildStudioSequence(long), /at most 4000/);
});
test('rejects a step with no citations rather than implying complete coverage', () => {
  const uncited = structuredClone(pump); uncited.steps[0].sourceRefIds = [];
  assert.throws(() => buildStudioSequence(uncited), /cite at least one/);
});
