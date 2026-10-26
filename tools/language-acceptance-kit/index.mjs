// Evaluation metadata only. Never infers language/model accuracy from a valid manifest.
const languages = new Set(['en-ZA', 'zu-ZA', 'tn-ZA', 'mul', 'sfs', 'und']);
const tasks = new Set(['listening', 'translation', 'terminology', 'transcript-correction', 'fallback', 'sign-language']);
const sourceTypes = new Set(['audio', 'text', 'video']);
const statuses = new Set(['not-run', 'review-pending', 'reviewed']);
const fields = ['caseId', 'languageTag', 'task', 'sourceType', 'expectedCapabilities', 'reviewerRequired', 'evidenceStatus', 'acceptanceChecks'];
const text = value => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 1000;
const list = value => Array.isArray(value) && value.length > 0 && value.length <= 20 && value.every(text) && new Set(value).size === value.length;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateLanguageCases(manifest) {
  const errors = [];
  if (!object(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.cases) || manifest.cases.length < 1 || manifest.cases.length > 100) {
    return {valid: false, errors: ['Expected schemaVersion 1 and 1–100 evaluation cases.'], establishesAccuracy: false};
  }
  if (Object.keys(manifest).some(key => !['schemaVersion', 'cases'].includes(key))) errors.push('Unknown manifest field.');
  const seen = new Set();
  for (const [i, item] of manifest.cases.entries()) {
    const prefix = `Case ${i + 1}: `;
    if (!object(item)) { errors.push(prefix + 'expected object.'); continue; }
    if (fields.some(key => !Object.hasOwn(item, key)) || Object.keys(item).some(key => ![...fields, 'reviewEvidence'].includes(key))) errors.push(prefix + 'missing or unknown field.');
    if (!text(item.caseId) || !/^[a-z0-9-]{1,80}$/.test(item.caseId) || seen.has(item.caseId)) errors.push(prefix + 'invalid or duplicate caseId.');
    seen.add(item.caseId);
    if (!languages.has(item.languageTag)) errors.push(prefix + 'unsupported evaluation language tag.');
    if (!tasks.has(item.task)) errors.push(prefix + 'unknown task.');
    if (!sourceTypes.has(item.sourceType)) errors.push(prefix + 'unknown sourceType.');
    if (!list(item.expectedCapabilities) || !list(item.acceptanceChecks)) errors.push(prefix + 'expected bounded nonempty distinct check lists.');
    if (typeof item.reviewerRequired !== 'boolean' || !statuses.has(item.evidenceStatus)) errors.push(prefix + 'invalid review status.');
    // All language quality cases require review; fallback control behavior alone may be automated.
    if (item.task !== 'fallback' && item.reviewerRequired !== true) errors.push(prefix + 'language quality requires human review.');
    if (item.languageTag === 'sfs' && (item.task !== 'sign-language' || item.sourceType !== 'video' || item.reviewerRequired !== true)) errors.push(prefix + 'SASL requires a signer-reviewed video evaluation.');
    if (item.task === 'sign-language' && item.languageTag !== 'sfs') errors.push(prefix + 'sign-language case must explicitly identify SASL.');
    if (item.evidenceStatus === 'reviewed') {
      const evidence = item.reviewEvidence;
      if (!object(evidence) || !text(evidence.artifact) || !text(evidence.reviewerRole) || !text(evidence.reviewedAt) ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(evidence.reviewedAt) ||
          !Number.isFinite(Date.parse(evidence.reviewedAt)) || new Date(evidence.reviewedAt).toISOString() !== evidence.reviewedAt) errors.push(prefix + 'reviewed status requires dated review evidence.');
      if (item.languageTag === 'sfs' && evidence?.reviewerRole !== 'qualified-sasl-reviewer') errors.push(prefix + 'SASL review metadata must declare a qualified SASL reviewer.');
    } else if (Object.hasOwn(item, 'reviewEvidence')) errors.push(prefix + 'unreviewed cases cannot carry completed-review evidence.');
  }
  return {valid: errors.length === 0, errors, establishesAccuracy: false};
}
