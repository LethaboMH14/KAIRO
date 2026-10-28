const LANGUAGES = new Set(["en-ZA", "zu-ZA", "st-ZA", "sfs"]);
const INPUT_MODES = new Set(["typed-text", "audio-reference", "signed-video-reference"]);
const CAPABILITIES = new Set(["listening", "terminology", "transcript-correction", "sasl-unavailable"]);
const FIELDS = new Set([
  "id", "language", "inputMode", "consent", "referenceText", "hypothesisText",
  "terminology", "humanReviewed", "synthetic", "capability", "status",
]);
const MAX_TEXT = 20_000;
const MAX_PAIRS = 100;

export function validateFixture(value) {
  const errors = [];
  const issue = (field, reason) => errors.push({ field, reason });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: [{ field: "$", reason: "expected-object" }] };
  }
  for (const key of Object.keys(value)) if (!FIELDS.has(key)) issue(key, "unknown-field");
  if (typeof value.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value.id)) issue("id", "invalid-id");
  if (!LANGUAGES.has(value.language)) issue("language", "unsupported-fixture-language");
  if (!INPUT_MODES.has(value.inputMode)) issue("inputMode", "invalid-input-mode");
  if (typeof value.consent !== "boolean") issue("consent", "expected-boolean");
  if (typeof value.humanReviewed !== "boolean") issue("humanReviewed", "expected-boolean");
  if (value.synthetic !== true) issue("synthetic", "starter-fixtures-must-be-synthetic");
  if (!CAPABILITIES.has(value.capability)) issue("capability", "invalid-capability");
  if (value.status !== "not-run") issue("status", "starter-fixtures-must-be-not-run");
  if (typeof value.referenceText !== "string" || value.referenceText.length > MAX_TEXT) issue("referenceText", "expected-bounded-string");
  if (value.hypothesisText !== null && (typeof value.hypothesisText !== "string" || value.hypothesisText.length > MAX_TEXT)) issue("hypothesisText", "expected-null-or-bounded-string");
  if (!Array.isArray(value.terminology) || value.terminology.length > MAX_PAIRS) issue("terminology", "expected-bounded-array");
  else value.terminology.forEach((pair, index) => {
    if (!pair || typeof pair !== "object" || Array.isArray(pair) || Object.keys(pair).sort().join(",") !== "preferred,source") issue(`terminology[${index}]`, "expected-source-preferred-pair");
    else if (typeof pair.source !== "string" || pair.source.length > 200 || typeof pair.preferred !== "string" || pair.preferred.length > 200) issue(`terminology[${index}]`, "expected-bounded-strings");
  });
  if (value.language === "sfs" && value.capability !== "sasl-unavailable") issue("capability", "sasl-must-remain-unavailable");
  if (value.capability === "sasl-unavailable" && value.language !== "sfs") issue("language", "sasl-unavailable-requires-sfs");
  return { valid: errors.length === 0, errors };
}

export function validatePack(fixtures) {
  if (!Array.isArray(fixtures)) return { valid: false, errors: [{ field: "$", reason: "expected-array" }] };
  const errors = [];
  const ids = new Set();
  fixtures.forEach((fixture, index) => {
    const result = validateFixture(fixture);
    result.errors.forEach(error => errors.push({ ...error, fixture: index }));
    if (fixture && typeof fixture.id === "string") {
      if (ids.has(fixture.id)) errors.push({ fixture: index, field: "id", reason: "duplicate-id" });
      ids.add(fixture.id);
    }
  });
  return { valid: errors.length === 0, errors };
}

function normalized(text) {
  return text.normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("und");
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

export function calculateMetrics(referenceText, hypothesisText) {
  const base = { mechanicalOnly: true, establishesAccuracy: false };
  if (hypothesisText === null || hypothesisText === undefined) return { ...base, status: "not-computable", reason: "missing-hypothesis", wer: null, cer: null };
  if (typeof referenceText !== "string" || typeof hypothesisText !== "string") throw new TypeError("reference and hypothesis must be strings or hypothesis null");
  const reference = normalized(referenceText);
  const hypothesis = normalized(hypothesisText);
  const refTokens = reference === "" ? [] : reference.split(" ");
  const hypTokens = hypothesis === "" ? [] : hypothesis.split(" ");
  const refChars = Array.from(reference);
  if (refTokens.length === 0 || refChars.length === 0) return { ...base, status: "not-computable", reason: "empty-reference", wer: null, cer: null };
  return {
    ...base,
    status: "computed",
    wer: distance(refTokens, hypTokens) / refTokens.length,
    cer: distance(refChars, Array.from(hypothesis)) / refChars.length,
  };
}
