import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateMetrics, validateFixture, validatePack } from "./validator.mjs";

const fixtures = JSON.parse(await readFile(new URL("./fixtures.json", import.meta.url), "utf8"));

test("starter pack validates and contains only synthetic, not-run, null hypotheses", () => {
  assert.deepEqual(validatePack(fixtures), { valid: true, errors: [] });
  assert.ok(fixtures.every(f => f.synthetic && f.status === "not-run" && f.hypothesisText === null && !f.humanReviewed));
});

test("strict schema rejects unknown fields, malformed pairs, and duplicate identifiers", () => {
  assert.ok(validateFixture({ ...fixtures[0], surprise: true }).errors.some(e => e.reason === "unknown-field"));
  assert.ok(validateFixture({ ...fixtures[0], terminology: [{ source: "a", preferred: 3 }] }).errors.some(e => e.reason === "expected-bounded-strings"));
  assert.ok(validatePack([fixtures[0], { ...fixtures[1], id: fixtures[0].id }]).errors.some(e => e.reason === "duplicate-id"));
});

test("starter contract rejects non-synthetic and SASL-available records", () => {
  assert.ok(validateFixture({ ...fixtures[0], synthetic: false }).errors.some(e => e.reason === "starter-fixtures-must-be-synthetic"));
  assert.ok(validateFixture({ ...fixtures[4], capability: "listening" }).errors.some(e => e.reason === "sasl-must-remain-unavailable"));
});

test("WER counts whitespace tokens without stripping punctuation", () => {
  const m = calculateMetrics("Turn valve, slowly", "Turn valve slowly");
  assert.equal(m.wer, 1 / 3);
  assert.equal(m.mechanicalOnly, true);
  assert.equal(m.establishesAccuracy, false);
});

test("NFC normalization and code-point CER handle composed characters", () => {
  assert.equal(calculateMetrics("café", "cafe\u0301").cer, 0);
  assert.equal(calculateMetrics("🙂x", "🙂y").cer, 0.5);
});

test("empty references and missing hypotheses stay explicitly non-computable", () => {
  assert.deepEqual(calculateMetrics("  ", "anything"), { mechanicalOnly: true, establishesAccuracy: false, status: "not-computable", reason: "empty-reference", wer: null, cer: null });
  assert.equal(calculateMetrics("words", null).reason, "missing-hypothesis");
  assert.equal(calculateMetrics("", "").wer, null);
});
