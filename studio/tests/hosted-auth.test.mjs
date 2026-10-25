import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Readable } from 'node:stream';
import { createIdentityGuard } from '../server/hosted-auth/guard.mjs';

const projectId = 'kairo-test-project';
const token = 'synthetic.token.value';
const validClaims = () => {
  const now = Math.floor(Date.now() / 1000);
  return { uid: 'learner:uid-1', sub: 'learner:uid-1', aud: projectId, iss: `https://securetoken.google.com/${projectId}`, iat: now - 5, exp: now + 300 };
};

async function request({ claims = validClaims(), verifierError, config = { projectId, verifyToken: async value => { assert.equal(value, token); if (verifierError) throw verifierError; return claims; } }, headers = {}, body = {} } = {}) {
  const app = express();
  app.use(express.json());
  app.post('/protected', createIdentityGuard(config), (req, res) => res.json({ identity: req.kairoIdentity, body: req.body, query: req.query }));
  const payload = Buffer.from(JSON.stringify({ uid: 'body-attacker', ...body }));
  const req = Readable.from([payload]);
  Object.assign(req, {
    method: 'POST', url: '/protected?uid=query-attacker',
    headers: { 'content-type': 'application/json', 'content-length': String(payload.length), authorization: `Bearer ${token}`, ...headers },
    socket: { encrypted: false, remoteAddress: '127.0.0.1' },
  });
  const output = { status: 200, body: null };
  const res = {
    locals: {}, headers: {}, headersSent: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    getHeader(name) { return this.headers[name.toLowerCase()]; },
    removeHeader(name) { delete this.headers[name.toLowerCase()]; },
    status(code) { output.status = code; return this; },
    set(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    get(name) { return this.headers[name.toLowerCase()]; },
    json(value) { output.body = value; this.headersSent = true; finish(); return this; },
    end() { this.headersSent = true; finish(); return this; },
  };
  let done;
  const finished = new Promise(resolve => { done = resolve; });
  const finish = () => done();
  app(req, res);
  await finished;
  return output;
}

test('valid verified claims attach only frozen token UID; body and query identity are ignored', async () => {
  const result = await request();
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.identity, { uid: 'learner:uid-1' });
  assert.equal(result.body.body.uid, 'body-attacker');
});

test('cross-project, expired, missing and conflicting identity claims all fail closed', async () => {
  const cases = [
    { aud: 'other-project' },
    { exp: Math.floor(Date.now() / 1000) - 1 },
    { uid: undefined },
    { sub: 'different-user' },
  ];
  for (const changes of cases) assert.equal((await request({ claims: { ...validClaims(), ...changes } })).status, 401);
});

test('malformed authorization, verifier failure and invalid configuration never expose details', async () => {
  assert.equal((await request({ headers: { authorization: 'Bearer nope extra' } })).status, 401);
  const failed = await request({ verifierError: new Error('private verifier detail') });
  assert.equal(failed.status, 401);
  assert.equal(JSON.stringify(failed.body).includes('private verifier detail'), false);
  const misconfigured = await request({ config: { projectId: '', verifyToken: async () => validClaims() } });
  assert.equal(misconfigured.status, 503);
  assert.equal(JSON.stringify(misconfigured.body).includes(token), false);
});

test('claim shape checks reject bad issuer, unsafe timestamps and control characters', async () => {
  const cases = [
    { iss: 'https://securetoken.google.com/other' },
    { iat: Math.floor(Date.now() / 1000) + 120 },
    { exp: 'later' },
    { uid: 'bad\nuid', sub: 'bad\nuid' },
  ];
  for (const changes of cases) assert.equal((await request({ claims: { ...validClaims(), ...changes } })).status, 401);
});
