import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const kinds = ['translation', 'listening', 'sasl'];
const availabilities = ['available', 'draft', 'unavailable'];
const states = kinds.flatMap(kind => availabilities.flatMap(availability => [false, true].flatMap(humanReviewed => [false, true].map(busy => ({
  kind, availability, humanReviewed, busy,
})))));

async function withNotice(run) {
  const server = await createServer({
    root: studioRoot,
    configFile: false,
    plugins: [reactPlugin()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  try {
    const module = await server.ssrLoadModule('/src/language-capability-ui/LanguageCapabilityNotice.tsx');
    await run(module.default, module.createLanguageCapabilityActions);
  } finally {
    await server.close();
  }
}

const propsFor = state => ({
  languageLabel: 'isiZulu',
  ...state,
  onUseOriginal() {},
  onEditTranscript() {},
});

test('actual SSR renders all 36 language, availability, review and busy combinations accessibly', async () => {
  await withNotice(Notice => {
    assert.equal(states.length, 36);
    for (const state of states) {
      const html = renderToStaticMarkup(React.createElement(Notice, propsFor(state)));
      assert.match(html, /KAIRO language support/);
      assert.match(html, /Selected language/);
      assert.match(html, /isiZulu/);
      assert.match(html, new RegExp(`<dd>${state.availability[0].toUpperCase() + state.availability.slice(1)}<\\/dd>`));
      assert.match(html, /aria-labelledby="language-capability-title-[^"]+"/);
      assert.match(html, /aria-describedby="language-capability-copy-[^"]+"/);
      assert.match(html, /Language selection does not prove accuracy/);
      assert.equal((html.match(/>Edit transcript</g) || []).length, state.kind === 'listening' ? 1 : 0);

      if (state.kind === 'sasl' && state.availability === 'unavailable') {
        assert.match(html, /SASL translation is unavailable/);
        assert.match(html, /Hand tracking is not sign-language translation/);
      }
      if (state.kind === 'sasl' && state.availability !== 'unavailable' && !state.humanReviewed) {
        assert.match(html, /not ready to rely on as translation/i);
        assert.match(html, /Human review is required/);
        assert.doesNotMatch(html, /translation ready/i);
      }
      if (state.humanReviewed && state.availability !== 'unavailable') {
        assert.match(html, /a human review is recorded/i);
        assert.match(html, /does not establish model accuracy/i);
      }

      const originalButton = html.match(/<button type="button"([^>]*)>\s*Read the original text/);
      assert.ok(originalButton, 'original reading action is always present');
      assert.equal(originalButton[1].includes('disabled=""'), state.busy);
      if (state.kind === 'listening') {
        const transcriptButton = html.match(/<button type="button" class="language-capability__secondary"([^>]*)>\s*Edit transcript/);
        assert.ok(transcriptButton, 'listening exposes transcript editing');
        assert.equal(transcriptButton[1].includes('disabled=""'), state.busy);
      }
      assert.equal(html.includes('Language actions are paused'), state.busy);
    }
  });
});

test('actual SSR escapes an untrusted language label', async () => {
  await withNotice(Notice => {
    const html = renderToStaticMarkup(React.createElement(Notice, propsFor({
      kind: 'translation', availability: 'draft', humanReviewed: false, busy: false,
      languageLabel: '<img src=x onerror=alert(1)>',
    })));
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img\b/i);
  });
});

test('actual repeated SSR instances receive unique, correctly linked heading IDs', async () => {
  await withNotice(Notice => {
    const first = propsFor({ kind: 'translation', availability: 'draft', humanReviewed: false, busy: false });
    const second = propsFor({ kind: 'listening', availability: 'available', humanReviewed: true, busy: false });
    const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(Notice, first), React.createElement(Notice, second)));
    const ids = [...html.matchAll(/id="(language-capability-title-[^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    for (const id of ids) assert.match(html, new RegExp(`aria-labelledby="${id}"`));
  });
});

test('component action callbacks are guarded for every state combination', async () => {
  await withNotice((_Notice, createActions) => {
    for (const state of states) {
      let originalCalls = 0;
      let transcriptCalls = 0;
      const actions = createActions(state.kind, state.busy, {
        onUseOriginal() { originalCalls += 1; },
        onEditTranscript() { transcriptCalls += 1; },
      });
      actions.useOriginal();
      actions.editTranscript();
      assert.equal(originalCalls, state.busy ? 0 : 1, `original action guard for ${JSON.stringify(state)}`);
      assert.equal(transcriptCalls, state.kind === 'listening' && !state.busy ? 1 : 0, `transcript guard for ${JSON.stringify(state)}`);
    }
  });
});
