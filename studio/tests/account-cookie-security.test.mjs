import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import express from 'express';
import { createAccountRouter, sessionGuard } from '../server/account/routes.mjs';

const ORIGIN = 'https://kairo.example.test';
const NOW = Date.UTC(2026, 9, 24, 12, 0, 0);
const EMAIL = 'learner.synthetic@example.test';
const PASSWORD = 'Synthetic-test-password-2026';

function harness({ fetchImpl, authOverrides = {} } = {}) {
  const calls = { verifySessionCookie: [], verifyIdToken: [], createSessionCookie: [], revokeRefreshTokens: [], fetch: [] };
  const auth = {
    async verifySessionCookie(token, checkRevoked) { calls.verifySessionCookie.push([token, checkRevoked]); if (token === 'revoked-token' || token === 'disabled-token') throw new Error('disabled or revoked'); return { uid: 'synthetic-user-42', email: EMAIL }; },
    async verifyIdToken(token, checkRevoked) { calls.verifyIdToken.push([token, checkRevoked]); return { uid: 'synthetic-user-42', email: EMAIL, auth_time: Math.floor(NOW / 1000) }; },
    async createSessionCookie(token, options) { calls.createSessionCookie.push([token, options]); return 'synthetic-session-cookie'; },
    async revokeRefreshTokens(uid) { calls.revokeRefreshTokens.push(uid); },
    ...authOverrides,
  };
  const fetchFn = fetchImpl || (async (url, options) => {
    calls.fetch.push({ url: String(url), options });
    if (String(url).includes('sendOobCode')) return { ok: true, async json() { return {}; } };
    return { ok: true, async json() { return { idToken: 'synthetic-id-token' }; } };
  });
  const app = express();
  app.use('/account', createAccountRouter({ auth, apiKey: 'synthetic-test-key', origin: ORIGIN, secure: true, fetchFn, clock: () => NOW }));
  app.get('/guarded', sessionGuard(auth), (req, res) => res.json({ uid: req.kairoIdentity.uid }));
  const server = createServer(app);
  const sockets = new Set();
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.unref();
    resolve({ auth, calls, base: `http://127.0.0.1:${address.port}`, close: () => { for (const socket of sockets) socket.destroy(); server.close(); } });
  }));
}
async function request(h, path, { method = 'GET', origin = ORIGIN, cookie, body } = {}) {
  const headers = { connection: 'close' };
  if (origin !== null) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';
  return fetch(`${h.base}${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}

const withHarness = fn => async t => { const h = await harness(fn.harness || {}); t.after(h.close); await fn.run(h, t); };

test('actual account router rejects bad and missing origins on mutations', withHarness({ run: async h => {
  for (const origin of ['https://attacker.example.test', null]) {
    const response = await request(h, '/account/authenticate', { method: 'POST', origin, body: { mode: 'signin', email: EMAIL, password: PASSWORD } });
    assert.equal(response.status, 403);
    assert.deepEqual(h.calls.fetch, []);
  }
} }));

test('failed provider authentication returns generic error and exposes no provider details', withHarness({ harness: { fetchImpl: async (url, options) => ({ ok: false, status: 400, async json() { return { error: { message: 'EMAIL_NOT_FOUND private detail' } }; } }) }, run: async h => {
  const response = await request(h, '/account/authenticate', { method: 'POST', body: { mode: 'signin', email: EMAIL, password: PASSWORD } });
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(body.error, 'Sign-in could not finish. Check your details, or use password reset.');
  assert.doesNotMatch(JSON.stringify(body), /EMAIL_NOT_FOUND|private detail|synthetic-id-token/);
} }));

test('successful sign-in puts only an HttpOnly Secure SameSite cookie on the response', withHarness({ run: async h => {
  const response = await request(h, '/account/authenticate', { method: 'POST', body: { mode: 'signin', email: EMAIL, password: PASSWORD } });
  const body = await response.json();
  const cookie = response.headers.get('set-cookie');
  assert.equal(response.status, 200);
  assert.deepEqual(body, { signedIn: true, email: EMAIL });
  assert.doesNotMatch(JSON.stringify(body), /idToken|session-cookie|synthetic-id-token/);
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Strict/); assert.match(cookie, /Path=\//);
  assert.equal(h.calls.createSessionCookie.length, 1);
  assert.equal(h.calls.createSessionCookie[0][1].expiresIn, 432000000);
} }));

test('sign-in rejects an old auth_time before creating a session cookie', withHarness({ harness: { authOverrides: { async verifyIdToken() { return { uid: 'synthetic-user-42', email: EMAIL, auth_time: Math.floor(NOW / 1000) - 301 }; } } }, run: async h => {
  const response = await request(h, '/account/authenticate', { method: 'POST', body: { mode: 'signin', email: EMAIL, password: PASSWORD } });
  assert.equal(response.status, 401);
  assert.equal(h.calls.createSessionCookie.length, 0);
} }));

test('status exposes only the owner hash and asks Admin Auth to check revocation', withHarness({ run: async h => {
  const response = await request(h, '/account/status', { cookie: 'kairo_session=synthetic-session-cookie' });
  const body = await response.json();
  assert.equal(body.status, 'signed-in');
  assert.equal(body.storageKey, createHash('sha256').update('synthetic-user-42').digest('hex'));
  assert.doesNotMatch(JSON.stringify(body), /synthetic-user-42|uid/);
  assert.deepEqual(h.calls.verifySessionCookie, [['synthetic-session-cookie', true]]);
} }));

test('session guard checks revocation and rejects revoked cookies', withHarness({ run: async h => {
  const accepted = await request(h, '/guarded', { cookie: 'kairo_session=good-token' });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { uid: 'synthetic-user-42' });
  const rejected = await request(h, '/guarded', { cookie: 'kairo_session=revoked-token' });
  assert.equal(rejected.status, 401);
  assert.deepEqual(h.calls.verifySessionCookie, [['good-token', true], ['revoked-token', true]]);
} }));

test('password reset response is identical when provider says account exists or does not', async t => {
  const results = [];
  for (const ok of [true, false]) {
    const h = await harness({ fetchImpl: async () => ({ ok, async json() { return {}; } }) });
    t.after(h.close);
    const response = await request(h, '/account/reset', { method: 'POST', body: { email: EMAIL } });
    results.push([response.status, await response.json()]);
  }
  assert.deepEqual(results[0], results[1]);
  assert.match(results[0][1].notice, /If this account can receive a reset email/);
});

test('logout revokes refresh tokens and clears the cookie even when revocation fails', withHarness({ run: async (h, t) => {
  let response = await request(h, '/account/signout', { method: 'POST', cookie: 'kairo_session=good-token' });
  assert.equal(response.status, 200); assert.equal(h.calls.revokeRefreshTokens[0], 'synthetic-user-42');
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/); assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  const failing = await harness({ authOverrides: { async revokeRefreshTokens() { throw new Error('synthetic revoke failure'); } } });
  t.after(failing.close);
  response = await request(failing, '/account/signout', { method: 'POST', cookie: 'kairo_session=good-token' });
  assert.equal(response.status, 503);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.match((await response.json()).error, /This browser signed out/);
} }));






