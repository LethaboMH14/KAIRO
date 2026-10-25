import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Exact reviewed commits, not just syntactically 40-character action refs.
// Adding a publisher or changing a commit requires a separate security review.
const approvedActions = new Map([
  ['actions/checkout', '11d5960a326750d5838078e36cf38b85af677262'],
  ['actions/setup-node', '49933ea5288caeca8642d1e84afbd3f7d6820020'],
  ['actions/setup-python', 'a26af69be951a213d495a4c3e4e4022e16d87065'],
]);
const workflows = fileURLToPath(new URL('../../.github/workflows/', import.meta.url));

function auditWorkflow(name, yaml) {
  const findings = [];
  if (/^\s*pull_request_target\s*:/m.test(yaml)) {
    findings.push(name + ': pull_request_target requires a separately reviewed security design');
  }
  if (/^\s*permissions\s*:\s*write-all(?:\s|$)/m.test(yaml)) {
    findings.push(name + ': blanket write-all permissions are forbidden');
  }
  const lines = yaml.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!/^\s*(?:-\s*)?uses\s*:/.test(line)) continue;
    const match = /^\s*(?:-\s*)?uses\s*:\s*(?:"([^"]+)"|'([^']+)'|([^\s#]+))\s*(?:#.*)?$/.exec(line);
    if (!match) {
      findings.push(name + ':' + (index + 1) + ': unparseable action reference');
      continue;
    }
    const ref = match[1] || match[2] || match[3];
    const parsed = /^([^@\s]+)@([0-9a-f]{40})$/.exec(ref);
    if (!parsed) {
      findings.push(name + ':' + (index + 1) + ': mutable, local or malformed action reference: ' + ref);
      continue;
    }
    const expected = approvedActions.get(parsed[1]);
    if (!expected) {
      findings.push(name + ':' + (index + 1) + ': publisher/action has not been reviewed: ' + parsed[1]);
    } else if (parsed[2] !== expected) {
      findings.push(name + ':' + (index + 1) + ': action SHA differs from reviewed pin: ' + parsed[1]);
    }
  }
  return findings;
}

test('every default-branch workflow has reviewed immutable action pins', () => {
  const names = readdirSync(workflows).filter(name => /\.ya?ml$/.test(name)).sort();
  assert.ok(names.length > 0, 'No workflows were found: check the repository-relative path');
  for (const name of names) {
    const yaml = readFileSync(join(workflows, name), 'utf8');
    assert.deepEqual(auditWorkflow(name, yaml), [], 'Workflow security review required: ' + name);
  }
});

test('future workflow action additions fail closed until exact commits are reviewed', () => {
  const good = 'steps:\n  - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # reviewed\n';
  assert.deepEqual(auditWorkflow('fixture.yml', good), []);
  for (const ref of [
    'actions/checkout@v4',
    'actions/checkout@main',
    'actions/checkout@' + 'a'.repeat(40),
    'openai/codex-action@' + 'b'.repeat(40),
    './.github/actions/local',
    'actions/checkout@$' + '{{ inputs.ref }}',
  ]) {
    assert.ok(auditWorkflow('fixture.yml', 'steps:\n  - uses: ' + ref + '\n').length > 0, ref);
  }
});

test('high-risk triggers, blanket permissions and opaque action expressions are rejected', () => {
  const risky = 'on:\n  pull_request_target:\npermissions: write-all\njobs:\n  test:\n    steps:\n      - uses: $' + '{{ github.event.action }}\n';
  const findings = auditWorkflow('fixture.yml', risky).join('\n');
  assert.match(findings, /pull_request_target/);
  assert.match(findings, /write-all/);
  assert.match(findings, /action reference/);
  assert.ok(auditWorkflow('fixture.yml', 'steps:\n  - uses: "actions/checkout@v4" trailing\n').length > 0);
});
