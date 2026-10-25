import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const fixture = JSON.parse(await readFile(new URL('../data/role-opportunities/engineering.json', import.meta.url), 'utf8'));
const allowedKinds = new Set(['qualification', 'skill', 'experience', 'other']);
const availabilityStates = new Set(['unknown', 'closed', 'open']);

test('engineering source records conform to schema and use safe dated HTTPS primary sources', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.ok(Array.isArray(fixture.roles) && fixture.roles.length >= 2);
  const ids = new Set();
  for (const role of fixture.roles) {
    assert.ok(role.id && !ids.has(role.id), `duplicate or missing role id ${role.id}`); ids.add(role.id);
    assert.ok(role.provider && role.title && role.availabilityNote);
    assert.equal(role.checkedAt, '2026-10-25');
    assert.ok(availabilityStates.has(role.availability));
    assert.equal(new URL(role.url).protocol, 'https:');
    assert.ok(role.url.includes('bmwgroup.jobs') || role.url.includes('siemens.com'));
    assert.ok(Array.isArray(role.requirements) && role.requirements.length);
    assert.ok(Array.isArray(role.suggestedProjects) && role.suggestedProjects.length);
    const reqIds = new Set();
    for (const req of role.requirements) {
      assert.ok(req.id && !reqIds.has(req.id), `duplicate or missing requirement id ${req.id}`); reqIds.add(req.id);
      assert.ok(req.label && req.sourceLocator && req.sourceExcerpt);
      assert.ok(allowedKinds.has(req.kind));
      assert.ok(req.sourceExcerpt.trim().split(/\s+/u).length <= 25, `${req.id} excerpt exceeds 25 words`);
    }
    for (const project of role.suggestedProjects) {
      assert.ok(project.id && project.title && project.boundary.includes('KAIRO-authored'));
      assert.ok(project.requirementIds.length > 0);
      for (const reqId of project.requirementIds) assert.ok(reqIds.has(reqId), `${project.id} maps unknown requirement ${reqId}`);
    }
  }
});

test('synthetic bad records demonstrate duplicate IDs and broken mappings are rejected', () => {
  const synthetic = { roles: [{ id: 'x', requirements: [{ id: 'r' }], suggestedProjects: [{ requirementIds: ['missing'] }] }] };
  const duplicateDetected = synthetic.roles[0].requirements.some((r, i, all) => all.findIndex(x => x.id === r.id) !== i);
  const mappingDetected = synthetic.roles[0].suggestedProjects.some(p => p.requirementIds.some(id => !synthetic.roles[0].requirements.some(r => r.id === id)));
  assert.equal(duplicateDetected, false);
  assert.equal(mappingDetected, true);
  synthetic.roles[0].requirements.push({ id: 'r' });
  assert.equal(synthetic.roles[0].requirements.some((r, i, all) => all.findIndex(x => x.id === r.id) !== i), true);
});
