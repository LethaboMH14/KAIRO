import test from 'node:test';
import assert from 'node:assert/strict';
import { audit, parseArgs, publicPrincipalSummary, readOnlyCommands, summarize } from './preflight.mjs';

const args = ['--live','--project','kairo-project1','--region','africa-south1','--service','kairo-app'];

test('offline default performs zero subprocess or network calls', () => {
  let calls = 0;
  const r = audit(parseArgs([]), () => { calls++; throw new Error('must not call'); });
  assert.equal(calls, 0);
  assert.equal(r.cloudState, 'not-checked');
});

test('live requires scoped and valid identifiers', () => {
  assert.throws(() => parseArgs(['--live']), /requires/);
  assert.throws(() => parseArgs([...args,'--bucket','gs://mybucket']), /Invalid/);
  assert.throws(() => parseArgs([...args,'--queue','jobs']), /together/);
  assert.throws(() => parseArgs([...args,'--service','--verbosity=debug']), /Missing/);
  assert.throws(() => parseArgs(['--live','--project',';rm -rf /','--region','africa-south1','--service','kairo-app']), /Invalid/);
  assert.throws(() => parseArgs([...args,'--no-user-output-enabled']), /Unknown/);
});

test('commands have strict read-only verbs and never launch a shell', () => {
  const c = parseArgs([...args,'--queue','imports','--tasks-location','europe-west1','--bucket','kairo-bucket']);
  const cmds = readOnlyCommands(c);
  assert.equal(cmds.length, 7);
  assert.deepEqual(cmds.map(x=>x.slice(0,3).join(' ')), [
    'auth list --filter=status:ACTIVE','run services describe','run services get-iam-policy',
    'firestore databases describe','storage buckets describe','storage buckets get-iam-policy','tasks queues describe'
  ]);
  assert.equal(cmds.flat().some(t => /(?:apply|create|update|delete|deploy|set-iam-policy)/.test(t)), false);
});

test('service/bucket policy detects public principal without exposing members', () => {
  assert.equal(publicPrincipalSummary({bindings:[{role:'roles/run.invoker',members:['allUsers','serviceAccount:private@example.net']}]}), 'present');
  assert.equal(publicPrincipalSummary({bindings:[{role:'roles/run.invoker',members:['user:private@example.net']}]}), 'not-found-in-returned-policy');
  assert.equal(publicPrincipalSummary({}), 'unknown');
  assert.deepEqual(Object.keys(summarize('runIam',{bindings:[{members:['user:private@example.net']}]})), ['publicPrincipal','note']);
});

test('live auth denial stops before reading any remote service or user data', () => {
  let calls=0;
  const r=audit(parseArgs(args), () => { calls++; return {error:'unavailable-or-permission-denied'}; });
  assert.equal(calls,1);
  assert.equal(r.cloudState,'not-checked');
});

test('successful fixture only prints explicitly selected safe fields', () => {
  const fake = [
    {data:[{status:'ACTIVE',account:'secret-user@example.net'}]},
    {data:{status:{latestReadyRevisionName:'kairo-app-00007-snn',traffic:[{percent:100}]},metadata:{annotations:{'run.googleapis.com/ingress':'all',secret:'dont-leak'}}}},
    {data:{bindings:[{role:'roles/run.invoker',members:['allUsers','secret-user@example.net']}]}},
    {data:{locationId:'africa-south1',pointInTimeRecoveryEnablement:'DISABLED',privateKey:'dont-leak'}},
  ];
  let i=0;
  const r=audit(parseArgs(args), () => fake[i++]);
  assert.equal(i,4);
  assert.equal(r.checks.runIam.publicPrincipal,'present');
  assert.equal(r.checks.run.readyRevision,'kairo-app-00007-snn');
  assert.doesNotMatch(JSON.stringify(r), /secret-user|dont-leak/);
});

test('failed metadata check remains not-verified rather than claiming safe', () => {
  const f = [{data:[{status:'ACTIVE'}]},{error:'unavailable-or-permission-denied'}, {error:'unavailable-or-permission-denied'}, {error:'unavailable-or-permission-denied'}];
  let i=0; const r=audit(parseArgs(args),()=>f[i++]);
  assert.equal(r.checks.runIam.status,'not-verified');
  assert.equal(r.checks.firestore.status,'not-verified');
});
