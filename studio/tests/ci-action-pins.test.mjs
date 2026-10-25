import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

// This deliberately audits only the merged CI workflow. Other PR workflows
// must receive their own exact-head supply-chain review before integration.
function actionReferences(yaml) {
  return [...yaml.matchAll(/^\s*(?:-\s*)?uses:\s*['"]?([^\s#'"\r\n]+)['"]?(?:\s*#.*)?$/gm)]
    .map(match => match[1]);
}

const pinnedFirstParty = /^actions\/(?:checkout|setup-node|setup-python)@[0-9a-f]{40}$/;

test('every external action in main CI is pinned to an immutable 40-character commit', () => {
  const refs = actionReferences(workflow);
  const declaredUses = [...workflow.matchAll(/^\s*(?:-\s*)?uses\s*:/gm)];
  assert.equal(refs.length, declaredUses.length, 'Unparseable action reference must fail closed');
  assert.equal(refs.length, 5, 'Expected five action invocations; review new steps explicitly');
  for (const ref of refs) assert.match(ref, pinnedFirstParty, 'Mutable or unreviewed action: ' + ref);
  assert.deepEqual(new Set(refs.map(ref => ref.split('@')[0])),
    new Set(['actions/checkout', 'actions/setup-node', 'actions/setup-python']));
});

test('pin audit catches tags, branches, truncated hashes and new unknown publishers', () => {
  for (const ref of [
    'actions/checkout@v4',
    'actions/setup-node@main',
    'actions/setup-python@' + 'a'.repeat(39),
    'actions/checkout@1234',
    'third-party/build@' + 'a'.repeat(40),
  ]) assert.doesNotMatch(ref, pinnedFirstParty);
  assert.deepEqual(actionReferences('steps:\n  - uses: actions/checkout@v4\n'), ['actions/checkout@v4']);
  assert.deepEqual(actionReferences('jobs:\n  call:\n    uses: third-party/workflow@main\n'), ['third-party/workflow@main']);
});

test('main CI retains pull-request checks and least-privilege read-only token', () => {
  assert.match(workflow, /^\s*pull_request:\s*$/m);
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s+read\s*$/m);
  assert.doesNotMatch(workflow, /^\s*pull_request_target:/m);
  assert.doesNotMatch(workflow, /^\s+(?:contents|issues|pull-requests|actions):\s+write\s*$/m);
});
