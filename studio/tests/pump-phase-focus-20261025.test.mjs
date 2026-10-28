import test from 'node:test';
import assert from 'node:assert/strict';
import { focusAfterPumpPhaseChange } from '../src/studio-scenarios/pump-phase-focus-20261025/focus.mjs';

function harness() {
  const doc = { body: {}, activeElement: null };
  doc.activeElement = doc.body;
  const make = () => {
    const attrs = new Map();
    return {
      isConnected: true, disabled: false, hiddenAncestor: false, focusCalls: 0,
      getAttribute(name) { return attrs.get(name) ?? null; },
      hasAttribute(name) { return attrs.has(name); },
      setAttribute(name, value) { attrs.set(name, value); },
      closest() { return this.hiddenAncestor ? {} : null; },
      focus() { this.focusCalls++; doc.activeElement = this; },
    };
  };
  const radio = make(), textarea = make(), heading = make(), submit = make();
  const targets = new Map([
    ['input[type="radio"]', radio], ['textarea', textarea], ['h2', heading],
  ]);
  const root = {
    ownerDocument: doc,
    contains(el) { return [radio, textarea, heading, submit].includes(el); },
    querySelector(selector) { return targets.get(selector) ?? null; },
  };
  return { root, doc, radio, textarea, heading, submit, targets };
}

test('predict → explain moves focus to the revealed explanation input', () => {
  const h = harness();
  h.doc.activeElement = h.submit;
  assert.equal(focusAfterPumpPhaseChange(h.root, 'predict', 'explain'), true);
  assert.equal(h.doc.activeElement, h.textarea);
  assert.equal(h.textarea.focusCalls, 1);
});

test('explain → independent prediction moves focus to the first radio', () => {
  const h = harness();
  h.doc.activeElement = h.doc.body; // prior submit unmounted
  assert.equal(focusAfterPumpPhaseChange(h.root, 'explain', 'predict'), true);
  assert.equal(h.doc.activeElement, h.radio);
});

test('completion and restore to done focus the heading without a new Tab stop', () => {
  for (const prior of ['explain', 'predict']) {
    const h = harness();
    assert.equal(focusAfterPumpPhaseChange(h.root, prior, 'done'), true);
    assert.equal(h.doc.activeElement, h.heading);
    assert.equal(h.heading.getAttribute('tabindex'), '-1');
  }
});

test('does not overwrite an existing heading tabindex', () => {
  const h = harness();
  h.heading.setAttribute('tabindex', '0');
  assert.equal(focusAfterPumpPhaseChange(h.root, 'explain', 'done'), true);
  assert.equal(h.heading.getAttribute('tabindex'), '0');
});

test('no focus change on same phase or unknown phase', () => {
  const h = harness();
  for (const [before, after] of [['predict', 'predict'], ['done', 'done'], ['unknown', 'predict'], ['predict', 'unknown']]) {
    assert.equal(focusAfterPumpPhaseChange(h.root, before, after), false);
  }
  assert.equal(h.doc.activeElement, h.doc.body);
});

test('does not steal focus from outside the task', () => {
  const h = harness();
  const outside = {};
  h.doc.activeElement = outside;
  assert.equal(focusAfterPumpPhaseChange(h.root, 'predict', 'explain'), false);
  assert.equal(h.doc.activeElement, outside);
});

test('rejects missing, disconnected, disabled and hidden targets', () => {
  for (const defect of ['missing', 'disconnected', 'disabled', 'aria-disabled', 'hidden']) {
    const h = harness();
    if (defect === 'missing') h.targets.delete('textarea');
    if (defect === 'disconnected') h.textarea.isConnected = false;
    if (defect === 'disabled') h.textarea.disabled = true;
    if (defect === 'aria-disabled') h.textarea.setAttribute('aria-disabled', 'true');
    if (defect === 'hidden') h.textarea.hiddenAncestor = true;
    assert.equal(focusAfterPumpPhaseChange(h.root, 'predict', 'explain'), false, defect);
    assert.equal(h.doc.activeElement, h.doc.body, defect);
  }
});

test('handles absent root and root without DOM capabilities', () => {
  assert.equal(focusAfterPumpPhaseChange(null, 'predict', 'explain'), false);
  assert.equal(focusAfterPumpPhaseChange({}, 'predict', 'explain'), false);
});
