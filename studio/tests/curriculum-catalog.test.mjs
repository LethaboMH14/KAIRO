import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistry } from '../src/curriculum-catalog/model.ts';
import { curriculumRegistry } from '../src/curriculum-catalog/registry.ts';

const base = () => structuredClone(curriculumRegistry);

test('reviewed first-year records are the nine exact current courses shared by five named 2026 BSc (Eng) branches', () => {
  const firstYear = curriculumRegistry.modules.filter((module) => module.studyYear === 1);
  const expected = [
    ['CHEM1051A', 'Engineering Chemistry'],
    ['FEBE1000A', 'Introduction to the Engineering Profession'],
    ['FEBE1002A', 'Engineering Analysis and Design IA'],
    ['FEBE1004A', 'Engineering Analysis and Design IB'],
    ['MATH1048A', 'Engineering Mathematics IA'],
    ['MATH1049A', 'Engineering Mathematics IB'],
    ['PHYS1032A', 'Engineering Physics IA'],
    ['PHYS1033A', 'Engineering Physics IB'],
    ['PHYS1034A', 'Applied Physics I'],
  ];
  assert.deepEqual(firstYear.map(({ code, title }) => [code, title]), expected);
  assert.ok(firstYear.every((module) => module.programmeIds.length === 5));
  assert.ok(firstYear.every((module) => module.source.url === 'https://www.wits.ac.za/media/wits-university/students/academic-matters/documents/EBE_eBook.pdf'));
  assert.ok(firstYear.every((module) => module.source.locator.includes('PDF pp.42–43 / printed pp.40–41')));
  assert.ok(firstYear.every((module) => module.source.locator.includes('PDF pp.54–55 / printed pp.52–53')));
  assert.deepEqual(curriculumRegistry.programmes.map(({ title }) => title), [
    'Aeronautical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Metallurgy and Materials Engineering',
  ]);
  assert.ok(firstYear.every((module) => module.status === 'reviewed' && module.catalogueYear === 2026 && module.source.evidenceStatus === 'original-reviewed'));
  assert.ok(firstYear.every((module) => module.code !== 'MATH1042A' && module.code !== 'MATH1043A'));
});

test('ELEN2003A is current Electrical Year II and its syllabus supports bounded motor-preparation concepts', () => {
  const module = curriculumRegistry.modules.find((candidate) => candidate.code === 'ELEN2003A');
  assert.ok(module);
  assert.equal(module.title, 'Electric and Magnetic Systems');
  assert.equal(module.studyYear, 2);
  assert.deepEqual(module.programmeIds, ['wits-ebe-efa03-electrical']);
  assert.ok(module.source.locator.includes('PDF p.48 / printed p.46'));
  assert.ok(module.source.locator.includes('PDF p.294 / printed p.292'));
  assert.match(module.source.locator, /electro-magnetic induction, coupling, transformers, power and energy conversion, and electrical fields/);
  assert.deepEqual(module.conceptIds, ['electric-fields', 'magnetic-fields', 'electromagnetic-induction', 'energy-conversion']);
  assert.equal(module.source.evidenceStatus, 'original-reviewed');
});

test('identity is institution, catalogue year, and exact code; synthetic same-title test records stay distinct', () => {
  const syntheticProgramme = (id, institutionId) => ({
    id,
    institutionId,
    title: 'Synthetic test programme',
    qualification: 'Synthetic test qualification',
    sourceUrl: 'https://example.test/synthetic-programme',
  });
  const syntheticModule = ({ id, institutionId, programmeId, year, code, title }) => ({
    id,
    institutionId,
    catalogueYear: year,
    code,
    title,
    studyYear: 1,
    programmeIds: [programmeId],
    conceptIds: ['synthetic-test-concept'],
    source: {
      url: 'https://example.test/synthetic-curriculum.pdf',
      locator: 'Synthetic test data only; this is not a university fact.',
      checkedAt: '2026-10-23T12:00:00Z',
      evidenceStatus: 'discovery-only',
    },
    status: 'needs-review',
  });
  const synthetic = {
    programmes: [
      syntheticProgramme('synthetic-test-programme-a', 'synthetic-test-institution-a'),
      syntheticProgramme('synthetic-test-programme-b', 'synthetic-test-institution-b'),
    ],
    modules: [
      syntheticModule({ id: 'synthetic-test-module-a', institutionId: 'synthetic-test-institution-a', programmeId: 'synthetic-test-programme-a', year: 2026, code: 'SYNTHETIC-TEST-CODE-A', title: 'Synthetic test title' }),
      syntheticModule({ id: 'synthetic-test-module-b', institutionId: 'synthetic-test-institution-a', programmeId: 'synthetic-test-programme-a', year: 2026, code: 'SYNTHETIC-TEST-CODE-B', title: 'Synthetic test title' }),
      syntheticModule({ id: 'synthetic-test-module-c', institutionId: 'synthetic-test-institution-b', programmeId: 'synthetic-test-programme-b', year: 2026, code: 'SYNTHETIC-TEST-CODE-A', title: 'Synthetic test title' }),
      syntheticModule({ id: 'synthetic-test-module-d', institutionId: 'synthetic-test-institution-a', programmeId: 'synthetic-test-programme-a', year: 2025, code: 'SYNTHETIC-TEST-CODE-A', title: 'Synthetic test title' }),
    ],
    discoveryLeads: [],
  };
  assert.equal(validateRegistry(synthetic).modules.length, 4);

  const duplicateIdentity = structuredClone(synthetic);
  duplicateIdentity.modules.push({ ...structuredClone(duplicateIdentity.modules[0]), id: 'synthetic-test-data-duplicate-identity' });
  assert.throws(() => validateRegistry(duplicateIdentity), /Duplicate institution\/year\/course-code identity/);
});

test('unknown year or code stays needs-review; reviewed prerequisites fail closed', () => {
  const registry = base();
  registry.modules.push({
    ...structuredClone(registry.modules[0]),
    id: 'synthetic-test-data-needs-review',
    catalogueYear: null,
    code: null,
    status: 'needs-review',
    source: { ...registry.modules[0].source, evidenceStatus: 'discovery-only' },
  });
  assert.equal(validateRegistry(registry).modules.at(-1).status, 'needs-review');

  for (const change of [
    { code: null, catalogueYear: 2026 },
    { code: 'SYNTHETIC-TEST-CODE', catalogueYear: null },
    { code: 'SYNTHETIC-TEST-CODE', source: { ...registry.modules[0].source, evidenceStatus: 'discovery-only' } },
  ]) {
    const invalid = base();
    Object.assign(invalid.modules[0], change);
    assert.throws(() => validateRegistry(invalid), /Reviewed modules require/);
  }
});

test('programme membership, institution alignment, and credential-free HTTPS links are enforced', () => {
  for (const change of [
    (registry) => { registry.modules[0].programmeIds = ['unknown-programme']; },
    (registry) => { registry.modules[0].institutionId = 'other-institution'; },
    (registry) => { registry.modules[0].source.url = 'javascript:alert(1)'; },
    (registry) => { registry.modules[0].source.url = 'https://user:pass@wits.ac.za/course.pdf'; },
    (registry) => { registry.programmes[0].sourceUrl = 'http://wits.ac.za/course'; },
    (registry) => { registry.discoveryLeads[0].url = 'data:text/html,unsafe'; },
  ]) {
    const registry = base();
    change(registry);
    assert.throws(() => validateRegistry(registry));
  }
});

test('timestamps and collection identifiers validate; validation never mutates caller data', () => {
  for (const timestamp of ['yesterday', '2026-02-30T12:00:00Z', '2026-10-23T12:00:00+02:00']) {
    const registry = base();
    registry.modules[0].source.checkedAt = timestamp;
    assert.throws(() => validateRegistry(registry));
  }
  const duplicateProgramme = base();
  duplicateProgramme.programmes.push(structuredClone(duplicateProgramme.programmes[0]));
  assert.throws(() => validateRegistry(duplicateProgramme), /Invalid programme/);

  const registry = base();
  const before = JSON.stringify(registry);
  const validated = validateRegistry(registry);
  assert.equal(JSON.stringify(registry), before);
  assert.notEqual(validated, registry);
  assert.equal(validated.discoveryLeads.length, 8);
  assert.ok(validated.discoveryLeads.every(({ status }) => status === 'discovery-only'));
});
