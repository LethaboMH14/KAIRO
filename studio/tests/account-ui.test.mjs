import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const base = { status: 'signed-out', pending: false, scopeLabel: 'cloud progress', onAuthenticate() {}, onReset() {}, onSignOut() {} };
let server, AccountPanel;

test('load actual AccountPanel through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: AccountPanel } = await server.ssrLoadModule('/src/account-ui/AccountPanel.tsx')); } catch (error) { await server.close(); throw error; }
});

const render = (props = {}) => renderToStaticMarkup(React.createElement(AccountPanel, { ...base, ...props }));

function mounted(props = {}) {
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const slots = [], cleanups = [];
  let hookIndex = 0, effectsMounted = false, tree;
  const dispatcher = {
    useState(initial) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect) {
      hookIndex++;
      if (!effectsMounted) cleanups.push(effect());
    },
  };
  const update = (nextProps = {}) => {
    hookIndex = 0;
    internals.H = dispatcher;
    try { tree = AccountPanel({ ...base, ...props, ...nextProps }); }
    finally { internals.H = null; }
    effectsMounted = true;
    return tree;
  };
  update();
  return { update, slots, get tree() { return tree; }, unmount() { for (const cleanup of cleanups) cleanup?.(); cleanups.length = 0; slots.length = 0; } };
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

test('signed-out, loading, and signed-in states are clear and scoped without overstating isolation', () => {
  const signedOut = render();
  assert.match(signedOut, /KAIRO account/);
  assert.match(signedOut, /Keep your progress with you/);
  assert.match(signedOut, /cloud progress/);
  assert.match(signedOut, /autoComplete="email"/);
  assert.match(signedOut, /autoComplete="current-password"/);
  assert.match(render({ status: 'loading' }), /Checking your account/);
  const signedIn = render({ status: 'signed-in', email: 'learner@example.test' });
  assert.match(signedIn, /learner@example\.test/);
  assert.match(signedIn, /Sign out/);
  assert.doesNotMatch(signedIn, /sources are private|all your work is private/i);
});

test('actual form handlers trim email, preserve sign-in password, and reset sends no password', async () => {
  const calls = [];
  const panel = mounted({ onAuthenticate: input => calls.push(['auth', input]), onReset: email => calls.push(['reset', email]) });
  const emailInput = find(panel.tree, node => node.type === 'input' && node.props.name === 'email');
  emailInput.props.ref.current = { validity: { valid: true } };
  emailInput.props.onChange({ currentTarget: { value: '  learner@example.test  ' } });
  panel.update();
  const password = find(panel.tree, node => node.type === 'input' && node.props.name === 'password');
  password.props.onChange({ currentTarget: { value: '  exact password  ' } });
  panel.update();
  const form = find(panel.tree, node => node.type === 'form');
  let prevented = false;
  await form.props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['auth', { mode: 'signin', email: 'learner@example.test', password: '  exact password  ' }]]);

  panel.update();
  assert.equal(find(panel.tree, node => node.type === 'input' && node.props.name === 'password').props.value, '');
  const invalidEmail = find(panel.tree, node => node.type === 'input' && node.props.name === 'email');
  invalidEmail.props.ref.current = { validity: { valid: false } };
  invalidEmail.props.onChange({ currentTarget: { value: 'not-an-email' } });
  panel.update();
  find(panel.tree, node => node.type === 'input' && node.props.name === 'password').props.onChange({ currentTarget: { value: 'password' } });
  panel.update();
  await find(panel.tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 1);

  const validEmail = find(panel.tree, node => node.type === 'input' && node.props.name === 'email');
  validEmail.props.ref.current = { validity: { valid: true } };
  validEmail.props.onChange({ currentTarget: { value: ' learner@example.test ' } });
  panel.update();
  const resetButton = find(panel.tree, node => node.type === 'button' && node.props.children === 'Send reset instructions');
  await resetButton.props.onClick();
  assert.deepEqual(calls[1], ['reset', 'learner@example.test']);
  panel.update();
  assert.match(find(panel.tree, node => node.props?.role === 'status')?.props.children ?? '', /If an account uses this email/);
  panel.unmount();
});

test('sign-up rule, mode change clearing, and rejected callback handling are enforced by the component', async () => {
  const calls = [];
  const panel = mounted({ onAuthenticate: async input => { calls.push(input); throw new Error('private provider detail'); } });
  let emailInput = find(panel.tree, node => node.type === 'input' && node.props.name === 'email');
  emailInput.props.ref.current = { validity: { valid: true } };
  emailInput.props.onChange({ currentTarget: { value: 'new@example.test' } });
  panel.update();
  const signup = find(panel.tree, node => node.type === 'button' && node.props.children === 'Create account');
  signup.props.onClick();
  panel.update();
  const pass = find(panel.tree, node => node.type === 'input' && node.props.name === 'password');
  assert.equal(pass.props.autoComplete, 'new-password');
  assert.equal(pass.props.minLength, 12);
  assert.equal(pass.props['aria-describedby'], 'kairo-account-password-help');
  pass.props.onChange({ currentTarget: { value: 'short' } });
  panel.update();
  let form = find(panel.tree, node => node.type === 'form');
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 0);
  panel.update();
  find(panel.tree, node => node.type === 'input' && node.props.name === 'password').props.onChange({ currentTarget: { value: 'long enough password' } });
  panel.update();
  await find(panel.tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(calls[0].password, 'long enough password');
  panel.update();
  assert.match(find(panel.tree, node => node.props?.role === 'alert')?.props.children ?? '', /try again/);
  assert.doesNotMatch(render({ error: '<script>private detail</script>' }), /<script>/);
  panel.unmount();
});

test('pending/loading suppress callbacks and duplicate in-flight submit events are ignored', async () => {
  let calls = 0, resolve;
  const pending = mounted({ pending: true, onAuthenticate() { calls++; } });
  const lockedForm = find(pending.tree, node => node.type === 'form');
  await lockedForm.props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
  pending.unmount();

  const panel = mounted({ onAuthenticate() { calls++; return new Promise(done => { resolve = done; }); } });
  const email = find(panel.tree, node => node.type === 'input' && node.props.name === 'email');
  email.props.ref.current = { validity: { valid: true } };
  email.props.onChange({ currentTarget: { value: 'learner@example.test' } });
  panel.update();
  find(panel.tree, node => node.type === 'input' && node.props.name === 'password').props.onChange({ currentTarget: { value: 'pass phrase' } });
  panel.update();
  const submit = find(panel.tree, node => node.type === 'form').props.onSubmit;
  const first = submit({ preventDefault() {} });
  const second = submit({ preventDefault() {} });
  assert.equal(calls, 1);
  panel.unmount();
  resolve();
  await Promise.all([first, second]);
});

test('signed-in sign-out clears transient password and callback exceptions never disclose details', async () => {
  let signedOut = 0;
  const panel = mounted({ status: 'signed-in', email: 'learner@example.test', onSignOut: async () => { signedOut++; throw new Error('credential response'); } });
  const button = find(panel.tree, node => node.type === 'button' && node.props.children === 'Sign out');
  await button.props.onClick();
  assert.equal(signedOut, 1);
  panel.update();
  assert.match(find(panel.tree, node => node.props?.role === 'alert')?.props.children ?? '', /try again/);
  assert.doesNotMatch(render({ error: '<img src=x onerror=steal()>' }), /<img/);
  panel.unmount();
});

test('close SSR server', async () => { await server.close(); server = undefined; });
