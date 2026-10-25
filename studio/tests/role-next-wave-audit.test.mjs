import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { makeRoleLink, roleGapRows } from '../src/role-gap-host/model.ts';
import { createCvDraft } from '../src/cv-draft/model.ts';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const fixture = JSON.parse(readFileSync(new URL('../data/role-opportunities/engineering.json', import.meta.url), 'utf8'));
const bmwRole = fixture.roles.find(role => role.id === 'bmw-sa-engineering-graduate-development');
const artifact = { runId: 'synthetic-role-audit-run', scenarioVersion: 'synthetic-v1', title: 'Synthetic engineering practice' };
let server, EvidenceGapPanel, RolePathways, CvWorkspace;

before(async () => {
  server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  ({ default: EvidenceGapPanel } = await server.ssrLoadModule('/src/evidence-gap-ui/EvidenceGapPanel.tsx'));
  ({ default: RolePathways } = await server.ssrLoadModule('/src/pathways/RolePathways.tsx'));
  ({ default: CvWorkspace } = await server.ssrLoadModule('/src/cv-workspace/CvWorkspace.tsx'));
});

after(async () => { await server?.close(); });

test('audit baseline: role source excerpts are stored but dropped before the actual requirement panel', () => {
  const rows = roleGapRows(bmwRole, [], []);
  const sourceExcerpt = bmwRole.requirements[0].sourceExcerpt;
  const html = renderToStaticMarkup(React.createElement(EvidenceGapPanel, { roleTitle: bmwRole.title, requirements: rows, onChooseRequirement() {} }));

  assert.equal(sourceExcerpt, 'a degree in Engineering');
  assert.equal(Object.hasOwn(rows[0], 'sourceExcerpt'), false);
  assert.match(html, /A degree in Engineering is listed as eligible/);
  assert.match(html, /BMW Group South Africa — Our Graduate Development Programme \/ Who can apply\?/);
  assert.doesNotMatch(html, new RegExp(sourceExcerpt));
});

test('audit baseline: a saved skill link stays marked linked after source review is withdrawn', () => {
  const skill = bmwRole.requirements.find(requirement => requirement.kind === 'skill');
  const link = makeRoleLink(bmwRole, skill.id, [artifact], artifact.runId, '2026-10-25T00:00:00.000Z');
  const sourceNowUnreviewed = { ...bmwRole, requirementsReviewed: false };
  const row = roleGapRows(sourceNowUnreviewed, [link], [artifact]).find(requirement => requirement.id === skill.id);

  assert.equal(sourceNowUnreviewed.requirementsReviewed, false);
  assert.equal(row.evidenceStatus, 'linked');
  assert.match(row.evidenceLabel, /not verified competence/);
});

test('audit baseline: /pathways renders the engineering role bridge beside a separate historical FNB rubric', () => {
  const html = renderToStaticMarkup(React.createElement(RolePathways));
  assert.match(html, /Graduate Development Programme \(engineering pathway\)/);
  assert.match(html, /Explore banking graduate work/);
  assert.match(html, /Historical advert · closed/);
  assert.match(html, /stated deadline 2026-08-31/);
  assert.match(html, /Not an FNB score, ATS result, hiring probability or independent skill verification/);
});

test('CV target requirements stay separate from applicant facts and are not transferred into plain-text CV claims', () => {
  const draft = createCvDraft({
    facts: [{ id: 'synthetic-confirmed-fact', section: 'projects', text: 'Built a synthetic motor calculation exercise.', providedBy: 'applicant', confirmation: 'confirmed' }],
    targetRoleRequirements: { label: 'BMW Graduate Development Programme', requirements: ['a degree in Engineering'] },
  });
  const html = renderToStaticMarkup(React.createElement(CvWorkspace));

  assert.equal(draft.targetRoleRequirements.source, 'applicant-supplied-not-verified');
  assert.equal(draft.targetRoleRequirements.includedInDraft, false);
  assert.doesNotMatch(draft.draftText, /a degree in Engineering/);
  assert.match(html, /href="\/pathways">Explore roles/);
  assert.match(html, /Paste requirements from an advert to compare yourself/);
  assert.doesNotMatch(html, /BMW Graduate Development Programme/);
});
