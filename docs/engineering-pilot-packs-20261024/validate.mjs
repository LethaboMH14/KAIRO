import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const files = ['motor-field-speed.json', 'centrifugal-pump-pressure-flow.json'];
const topKeys = ['schemaVersion', 'id', 'title', 'objective', 'prerequisites', 'sourceRefs', 'steps', 'practice', 'evidencePrompt', 'limitations'];
const sourceKeys = ['id', 'url', 'locator', 'licenseStatus', 'checkedAt'];
const stepKeys = ['id', 'title', 'explanation', 'sourceRefIds', 'learnerAction', 'studioCapability', 'capabilityStatus'];
const practiceKeys = ['question', 'expectedReasoning', 'sourceRefIds', 'scope'];

function keysEqual(value, expected) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}
function nonempty(v) { return typeof v === 'string' && v.trim().length > 0; }
function validate(pack) {
  const errors = [];
  if (!keysEqual(pack, topKeys)) errors.push('top-level keys must exactly match schema version 1');
  if (pack.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  for (const key of ['id', 'title', 'objective', 'evidencePrompt']) if (!nonempty(pack[key])) errors.push(`${key} must be nonempty`);
  for (const key of ['prerequisites', 'limitations']) {
    if (!Array.isArray(pack[key]) || pack[key].some(x => !nonempty(x))) errors.push(`${key} must be an array of nonempty strings`);
  }
  if (!Array.isArray(pack.sourceRefs) || pack.sourceRefs.length === 0) errors.push('sourceRefs must be nonempty');
  if (!Array.isArray(pack.steps) || pack.steps.length === 0) errors.push('steps must be nonempty');
  if (!Array.isArray(pack.practice) || pack.practice.length === 0) errors.push('practice must be nonempty');

  const refIds = new Set();
  for (const [i, ref] of (pack.sourceRefs ?? []).entries()) {
    if (!keysEqual(ref, sourceKeys)) errors.push(`sourceRefs[${i}] keys must match the published schema`);
    for (const key of sourceKeys) if (!nonempty(ref?.[key])) errors.push(`sourceRefs[${i}].${key} must be nonempty`);
    if (ref?.id && refIds.has(ref.id)) errors.push(`duplicate source ref id ${ref.id}`);
    if (ref?.id) refIds.add(ref.id);
    if (ref?.url && !/^(https:\/\/|file:)/.test(ref.url)) errors.push(`sourceRefs[${i}].url must be HTTPS (or a documented local file reference)`);
    if (ref?.checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(ref.checkedAt)) errors.push(`sourceRefs[${i}].checkedAt must be YYYY-MM-DD`);
  }
  const allIds = new Set();
  function checkId(id, where) {
    if (!nonempty(id)) errors.push(`${where}.id must be nonempty`);
    else if (allIds.has(id)) errors.push(`duplicate content id ${id}`);
    else allIds.add(id);
  }
  function checkRefs(ids, where) {
    if (!Array.isArray(ids) || ids.length === 0) { errors.push(`${where}.sourceRefIds must be nonempty`); return; }
    for (const id of ids) if (!refIds.has(id)) errors.push(`${where} refers to unknown source ${id}`);
  }
  for (const [i, step] of (pack.steps ?? []).entries()) {
    const where = `steps[${i}]`;
    if (!keysEqual(step, stepKeys)) errors.push(`${where} keys must match the published schema`);
    checkId(step?.id, where);
    for (const key of ['title', 'explanation', 'learnerAction']) if (!nonempty(step?.[key])) errors.push(`${where}.${key} must be nonempty`);
    if (!(step?.studioCapability === null || nonempty(step?.studioCapability))) errors.push(`${where}.studioCapability must be null or nonempty`);
    if (!['implemented', 'manual', 'planned'].includes(step?.capabilityStatus)) errors.push(`${where}.capabilityStatus is invalid`);
    if (step?.capabilityStatus === 'implemented' && !nonempty(step?.studioCapability)) errors.push(`${where} implemented action needs a capability description`);
    checkRefs(step?.sourceRefIds, where);
  }
  for (const [i, practice] of (pack.practice ?? []).entries()) {
    const where = `practice[${i}]`;
    if (!keysEqual(practice, practiceKeys)) errors.push(`${where} keys must match the published schema`);
    for (const key of practiceKeys) if (key !== 'sourceRefIds' && !nonempty(practice?.[key])) errors.push(`${where}.${key} must be nonempty`);
    checkRefs(practice?.sourceRefIds, where);
  }
  return errors;
}

const packs = [];
for (const file of files) {
  const pack = JSON.parse(await readFile(path.join(here, file), 'utf8'));
  const errors = validate(pack);
  assert.deepEqual(errors, [], `${file}: ${errors.join('; ')}`);
  packs.push({ file, pack });
}

// Exercise rejection paths as well as the real JSON: broken references and
// unsupported capability states must not silently validate.
const good = packs[0].pack;
const brokenReference = structuredClone(good);
brokenReference.steps[0].sourceRefIds = ['missing-ref'];
assert.ok(validate(brokenReference).some(e => e.includes('unknown source missing-ref')));
const invalidStatus = structuredClone(good);
invalidStatus.steps[0].capabilityStatus = 'available';
assert.ok(validate(invalidStatus).some(e => e.includes('capabilityStatus is invalid')));
const extraField = structuredClone(good);
extraField.unpublishedBridge = true;
assert.ok(validate(extraField).some(e => e.includes('top-level keys must exactly match')));

const supportTable = await readFile(path.join(here, 'FEATURE-SUPPORTEDNESS.md'), 'utf8');
for (const status of ['implemented', 'manual', 'planned']) assert.ok(supportTable.includes(status), `feature table must include ${status} support status`);
assert.ok(supportTable.includes('not mounted in the app'), 'feature table must disclose the Pump Lab mounting limitation');
for (const sourcePath of [
  'studio/src/engineering/EngineeringStudio.tsx',
  'studio/src/engineering/fieldMath.ts',
  'studio/src/engineering/teaching.ts',
  'studio/src/engineering/motorContent.ts',
  'studio/src/pump-lab/PumpLab.tsx',
  'studio/src/pump-lab/physics.ts',
  'docs/pump-lab/MODEL.md',
  'docs/pump-lab/README.md'
]) {
  await readFile(path.join(root, sourcePath), 'utf8');
}

const evidence = {
  checkedAt: new Date().toISOString(),
  command: 'node docs/engineering-pilot-packs-20261024/validate.mjs',
  result: 'pass',
  packCount: packs.length,
  stepCount: packs.reduce((n, x) => n + x.pack.steps.length, 0),
  practiceCount: packs.reduce((n, x) => n + x.pack.practice.length, 0),
  sourceRefCount: packs.reduce((n, x) => n + x.pack.sourceRefs.length, 0),
  currentCodeFilesReadOnlyReviewed: [
    'studio/src/engineering/EngineeringStudio.tsx',
    'studio/src/engineering/fieldMath.ts',
    'studio/src/engineering/teaching.ts',
    'studio/src/engineering/motorContent.ts',
    'studio/src/pump-lab/PumpLab.tsx',
    'studio/src/pump-lab/physics.ts',
    'docs/pump-lab/MODEL.md',
    'docs/pump-lab/README.md'
  ],
  negativeChecks: [
    'reject unknown source reference',
    'reject capability status outside published enum',
    'reject extra top-level capability/bridge field',
    'feature table includes implemented/manual/planned statuses and Pump Lab mount limit',
    'all listed current-code review files exist'
  ],
  limits: [
    'Structural checks do not independently prove the accuracy of engineering claims; cited references and current-code mapping remain for root/human review.',
    'No browser, route, device, screen-reader, learner, or engineering specialist acceptance was performed.'
  ]
};
await writeFile(path.join(here, 'validation-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`PASS: ${packs.length} packs, ${evidence.stepCount} steps, ${evidence.practiceCount} practice items, ${evidence.sourceRefCount} source refs; 3 negative checks`);
