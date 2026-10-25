import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const requirement = (overrides = {}) => ({
  id: 'role-req-1',
  label: 'Explain a practical problem and show how you would test your solution.',
  sourceTitle: 'Example employer role requirements',
  sourceUrl: 'https://careers.example.org/roles/analyst',
  checkedAt: '2026-10-24',
  evidenceStatus: 'missing',
  evidenceLabel: null,
  nextActionLabel: 'Practise writing a testable solution',
  ...overrides,
});

const props = (overrides = {}) => ({
  roleTitle: 'Fictional analyst role',
  requirements: [requirement()],
  onChooseRequirement: () => {},
  ...overrides,
});

function setupSsr() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  return Promise.all([
    import('react'),
    import('react-dom/server'),
    import('vite'),
    import('@vitejs/plugin-react'),
  ]).then(async ([ReactModule, ReactDomServer, Vite, Plugin]) => {
    const server = await Vite.createServer({
      root,
      configFile: false,
      plugins: [Plugin.default()],
      server: { middlewareMode: true },
      appType: 'custom',
    });
    try {
      const module = await server.ssrLoadModule('/src/evidence-gap-ui/EvidenceGapPanel.tsx');
      return {
        React: ReactModule.default,
        renderToStaticMarkup: ReactDomServer.renderToStaticMarkup,
        ...module,
      };
    } finally {
      await server.close();
    }
  });
}

test('the real React SSR output keeps source, date, evidence state and KAIRO identity visible', async () => {
  const { React, renderToStaticMarkup, default: Panel } = await setupSsr();
  const html = renderToStaticMarkup(React.createElement(Panel, props()));
  assert.match(html, /KAIRO/);
  assert.match(html, /Fictional analyst role/);
  assert.match(html, /Example employer role requirements/);
  assert.match(html, /Checked 24 Oct 2026/);
  assert.match(html, /No evidence linked/);
  assert.match(html, /does not mean you lack this skill/);
  assert.match(html, /Practise writing a testable solution/);
  assert.match(html, /href="https:\/\/careers\.example\.org\/roles\/analyst"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /not proof of competence, mastery, job readiness, or a hiring outcome/);
  assert.doesNotMatch(html, /employability percentage|hiring score|FNB partner/i);
});

test('linked and needs-review states keep their evidence meaning separate', async () => {
  const { React, renderToStaticMarkup, default: Panel } = await setupSsr();
  const html = renderToStaticMarkup(React.createElement(Panel, props({
    requirements: [
      requirement({ id: 'linked', evidenceStatus: 'linked', evidenceLabel: 'My pump lab notes' }),
      requirement({ id: 'review', evidenceStatus: 'needs-review', evidenceLabel: 'Portfolio note · recheck source' }),
    ],
  })));
  assert.match(html, /Evidence linked/);
  assert.match(html, /My pump lab notes/);
  assert.match(html, /Evidence needs review/);
  assert.match(html, /Portfolio note · recheck source/);
  assert.match(html, /not independently assessed/);
});

test('the component action gate calls only for unique rows with safe dated sources', async () => {
  const { createRequirementActionHandler } = await setupSsr();
  const rows = [
    requirement({ id: 'ok' }),
    requirement({ id: 'bad-link', sourceUrl: 'javascript:alert(1)' }),
    requirement({ id: 'bad-date', checkedAt: '2026-02-30' }),
    requirement({ id: 'future', checkedAt: '2999-01-01' }),
    requirement({ id: 'duplicate' }),
    requirement({ id: 'duplicate' }),
  ];
  const calls = [];
  const choose = createRequirementActionHandler(rows, (id) => calls.push(id));
  assert.equal(choose('ok'), true);
  assert.equal(choose('bad-link'), false);
  assert.equal(choose('bad-date'), false);
  assert.equal(choose('future'), false);
  assert.equal(choose('duplicate'), false);
  assert.equal(choose('missing-row'), false);
  assert.deepEqual(calls, ['ok']);
});

test('invalid sources and duplicate IDs render a reason and no actionable button', async () => {
  const { React, renderToStaticMarkup, default: Panel } = await setupSsr();
  const html = renderToStaticMarkup(React.createElement(Panel, props({
    requirements: [
      requirement({ id: 'unsafe', sourceUrl: 'http://careers.example.org/role' }),
      requirement({ id: 'bad-date', checkedAt: '2026-02-30' }),
      requirement({ id: 'repeat' }),
      requirement({ id: 'repeat' }),
    ],
  })));
  assert.match(html, /Source link unavailable/);
  assert.match(html, /source link and source title are required/);
  assert.match(html, /source checked date is missing or invalid/);
  assert.match(html, /repeated ID/);
  assert.equal([...html.matchAll(/<button[^>]*disabled=""/g)].length, 4);
});

test('source URL and checked-date guards reject unsafe and malformed inputs', async () => {
  const { isSafeEvidenceSourceUrl, isValidEvidenceDate } = await setupSsr();
  for (const value of [
    'http://careers.example.org/role',
    '//careers.example.org/role',
    'https://user:pass@careers.example.org/role',
    'https://127.0.0.1/role',
    'https://localhost/role',
    'https://careers.example.org:8443/role',
    'javascript:alert(1)',
  ]) assert.equal(isSafeEvidenceSourceUrl(value), false, value);
  assert.equal(isSafeEvidenceSourceUrl('https://careers.example.org/role'), true);
  assert.equal(isSafeEvidenceSourceUrl('https://careers.example.org:443/role'), true);

  assert.equal(isValidEvidenceDate('2026-10-24', '2026-10-25'), true);
  assert.equal(isValidEvidenceDate('2026-02-30', '2026-10-25'), false);
  assert.equal(isValidEvidenceDate('2026-10-26', '2026-10-25'), false);
  assert.equal(isValidEvidenceDate('2026-10-24T09:30:00Z', '2026-10-25'), true);
  assert.equal(isValidEvidenceDate('2026-10-24T09:30:61Z', '2026-10-25'), false);
});

test('empty and oversized lists explain why there is no row to choose', async () => {
  const { React, renderToStaticMarkup, default: Panel } = await setupSsr();
  const empty = renderToStaticMarkup(React.createElement(Panel, props({ roleTitle: '', requirements: [] })));
  assert.match(empty, /Role learning pathway/);
  assert.match(empty, /No sourced requirements are available yet/);

  const oversized = renderToStaticMarkup(React.createElement(Panel, props({
    requirements: Array.from({ length: 101 }, (_, index) => requirement({ id: `r-${index}` })),
  })));
  assert.match(oversized, /too many requirements to show safely/);
  assert.doesNotMatch(oversized, /role-req-1/);

  const unavailable = renderToStaticMarkup(React.createElement(Panel, props({ requirements: null })));
  assert.match(unavailable, /Role requirements are unavailable/);
});

test('React escapes supplied role, requirement and evidence text and headings stay distinct', async () => {
  const { React, renderToStaticMarkup, default: Panel } = await setupSsr();
  const shared = props({
    roleTitle: '<script>alert("role")</script>',
    requirements: [requirement({
      label: '<img src=x onerror=alert(1)>',
      evidenceStatus: 'linked',
      evidenceLabel: '<script>alert("evidence")</script>',
    })],
  });
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Panel, shared),
    React.createElement(Panel, shared),
  ));
  const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.match(html, /&lt;script&gt;alert\(&quot;role&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&quot;evidence&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|<img src=x/);
});
