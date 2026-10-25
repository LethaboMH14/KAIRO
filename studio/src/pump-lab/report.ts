// PUMP LAB export: a maintenance-style observation report and a draft evidence item.
// Both are built only from the session record. Neither claims a real inspection, a
// credential or equipment validation; help used and simulated status are always included.

import { CASES, CAUSES, REPAIRS, PARTS } from './cases.ts';
import { CHANNEL_INFO } from './instruments.ts';
import { LIMITS, MODEL_STATUS, MODEL_VERSION } from './physics.ts';
import { LOCAL_STATUS, RUBRIC_VERSION, assess, serialize, statementText, type Assessment, type PumpLabState } from './session.ts';

export const REPORT_SCHEMA = 'kairo-pump-lab-report/1' as const;
export const EVIDENCE_SCHEMA = 'kairo-evidence-item/pump-lab-draft-1' as const;
export const DISCLOSURE = 'Illustrative simulation. The numbers come from a simplified teaching model, not a real pump, and no real maintenance was done. This is a practice record, not a certificate or a verified competency.' as const;

export const LIMITATIONS: readonly string[] = [
  'Steady-state model: each reading is the balance point of a quadratic pump curve and a quadratic system curve at that moment.',
  'Coefficients are illustrative round numbers, not measured from any pump, and have not had a qualified engineering content review.',
  'Instrument noise is simulated, bounded and repeatable from the session seed.',
  'Flow particles and glow are drawn from the model state; they are not computational fluid dynamics.',
  'Repairs change a named state in the case; they do not teach or certify how to carry out maintenance safely.',
];

export type PumpLabReport = {
  schema: typeof REPORT_SCHEMA;
  status: typeof LOCAL_STATUS;
  disclosure: typeof DISCLOSURE;
  model: { version: string; status: string; seed: number; sessionId: string };
  case: { id: string; title: string; operatorReport: string };
  outcome: 'finished' | 'in-progress';
  targets: { flowLps: number; maxDischargeKpa: number; motorRatedKw: number; minNpshMarginM: number };
  assistance: { level: Assessment['assistance']; hintsOpened: { level: number; atClockS: number }[]; openedPartsBeforeSupportedExplanation: boolean; explanationAttempts: number };
  predictions: { id: string; predictedLps: number; speedRpm: number; valvePct: number; measuredLps: number | null; errorLps: number | null }[];
  readings: { id: string; condition: 'before repair' | 'after repair'; clockS: number; values: Record<string, number | boolean>; limits: { label: string; value: number; limit: number; unit: string; status: string }[] }[];
  comparisons: { id: string; lines: string[] }[];
  sectionComparisons: string[];
  openedParts: { part: string; condition: string; observation: string }[];
  explanations: { id: string; conclusion: string; outcome: string; evidenceIds: string[]; note: string; feedback: string[] }[];
  repairs: { action: string; changedCaseState: boolean; note: string }[];
  rubric: { label: string; met: boolean }[];
  limitations: readonly string[];
};

export function buildReport(s: PumpLabState): PumpLabReport {
  const spec = CASES[s.caseId];
  const a = assess(s);
  return {
    schema: REPORT_SCHEMA,
    status: LOCAL_STATUS,
    disclosure: DISCLOSURE,
    model: { version: MODEL_VERSION, status: MODEL_STATUS, seed: s.seed, sessionId: s.sessionId },
    case: { id: spec.id, title: spec.title, operatorReport: spec.report },
    outcome: s.completed ? 'finished' : 'in-progress',
    targets: { flowLps: LIMITS.targetFlowLps, maxDischargeKpa: LIMITS.maxDischargeKpa, motorRatedKw: LIMITS.motorRatedKw, minNpshMarginM: LIMITS.minNpshMarginM },
    assistance: { level: a.assistance, hintsOpened: s.hints.map(h => ({ level: h.level, atClockS: h.atClockS })), openedPartsBeforeSupportedExplanation: a.directInspectionBeforeSupported, explanationAttempts: s.explanations.length },
    predictions: s.predictions.map(p => ({ id: p.id, predictedLps: p.flowLps, speedRpm: p.speedRpm, valvePct: p.valvePct, measuredLps: p.readingId ? s.readings.find(r => r.id === p.readingId)!.measured.flowLps : null, errorLps: p.errorLps })),
    readings: s.readings.map(r => ({
      id: r.id,
      condition: r.epoch === 0 ? 'before repair' : 'after repair',
      clockS: r.clockS,
      values: Object.fromEntries(CHANNEL_INFO.map(c => [`${c.label}${c.unit ? ` (${c.unit})` : ''}`, r.measured[c.key]])),
      limits: r.limits.map(l => ({ label: l.label, value: l.value, limit: l.limit, unit: l.unit, status: l.status })),
    })),
    comparisons: s.comparisons.map(c => ({ id: c.id, lines: c.lines })),
    sectionComparisons: s.inspections.map(i => statementText(i)),
    openedParts: s.teardowns.map(t => ({ part: PARTS[t.part].label, condition: t.epoch === 0 ? 'before repair' : 'after repair', observation: t.text })),
    explanations: s.explanations.map(e => ({ id: e.id, conclusion: CAUSES[e.cause].label, outcome: e.outcome, evidenceIds: e.evidenceIds, note: e.note, feedback: e.feedback })),
    repairs: s.repairs.map(r => ({ action: REPAIRS[r.repair].label, changedCaseState: r.effective, note: r.effective ? REPAIRS[r.repair].effect : 'No effect in this case.' })),
    rubric: a.checks.map(c => ({ label: c.label, met: c.met })),
    limitations: LIMITATIONS,
  };
}

export function reportText(r: PumpLabReport): string {
  const L: string[] = [];
  L.push('PUMP LAB OBSERVATION REPORT');
  L.push(r.disclosure);
  L.push('');
  L.push(`Case: ${r.case.title} (${r.case.id})`);
  L.push(`Operator report: ${r.case.operatorReport}`);
  L.push(`Session ${r.model.sessionId} · seed ${r.model.seed} · ${r.model.version} · status: ${r.status} · ${r.outcome}`);
  L.push(`Targets: ${r.targets.flowLps} L/s; discharge at most ${r.targets.maxDischargeKpa} kPa; motor at most ${r.targets.motorRatedKw} kW; suction margin at least ${r.targets.minNpshMarginM} m.`);
  L.push(`Help used: ${r.assistance.level === 'none' ? 'none' : r.assistance.level === 'hint' ? `hints up to level ${Math.max(...r.assistance.hintsOpened.map(h => h.level))}` : 'worked comparison (hint 3)'}${r.assistance.openedPartsBeforeSupportedExplanation ? '; opened a part before the explanation was supported' : ''}. Explanation attempts: ${r.assistance.explanationAttempts}.`);
  L.push('');
  L.push('Predictions');
  if (!r.predictions.length) L.push('  none');
  for (const p of r.predictions) L.push(`  ${p.id}: predicted ${p.predictedLps.toFixed(1)} L/s at ${p.speedRpm} rpm, valve ${p.valvePct}%${p.measuredLps === null ? ' (no matching reading)' : `; measured ${p.measuredLps.toFixed(1)} L/s, difference ${p.errorLps!.toFixed(1)}`}`);
  L.push('');
  L.push('Readings');
  if (!r.readings.length) L.push('  none');
  for (const x of r.readings) {
    L.push(`  ${x.id} (${x.condition}, t = ${x.clockS} s)`);
    for (const [k, v] of Object.entries(x.values)) L.push(`    ${k}: ${typeof v === 'boolean' ? (v ? 'yes' : 'no') : v}`);
    for (const l of x.limits) L.push(`    ${l.label}: ${l.value} ${l.unit} against ${l.limit} ${l.unit} — ${l.status === 'close' ? 'too close to call' : l.status === 'met' ? 'met' : 'not met'}`);
  }
  L.push('');
  L.push('Sections compared against the datasheet');
  if (!r.sectionComparisons.length) L.push('  none');
  for (const c of r.sectionComparisons) L.push(`  ${c}`);
  L.push('');
  L.push('Reading comparisons');
  if (!r.comparisons.length) L.push('  none');
  for (const c of r.comparisons) for (const line of c.lines) L.push(`  ${c.id}: ${line}`);
  L.push('');
  L.push('Parts opened');
  if (!r.openedParts.length) L.push('  none');
  for (const p of r.openedParts) L.push(`  ${p.part} (${p.condition}): ${p.observation}`);
  L.push('');
  L.push('Explanations');
  if (!r.explanations.length) L.push('  none');
  for (const e of r.explanations) {
    L.push(`  ${e.id}: ${e.conclusion} — ${e.outcome}. Evidence: ${e.evidenceIds.join(', ') || 'none cited'}.`);
    if (e.note) L.push(`    Note: ${e.note}`);
    for (const f of e.feedback) L.push(`    ${f}`);
  }
  L.push('');
  L.push('Repairs (changes to the case state, not real maintenance)');
  if (!r.repairs.length) L.push('  none');
  for (const x of r.repairs) L.push(`  ${x.action}: ${x.changedCaseState ? 'changed the case state' : 'no effect'}. ${x.note}`);
  L.push('');
  L.push('Checks');
  for (const c of r.rubric) L.push(`  [${c.met ? 'x' : ' '}] ${c.label}`);
  L.push('');
  L.push('Limitations');
  for (const x of r.limitations) L.push(`  - ${x}`);
  return L.join('\n');
}

export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export type PumpLabEvidenceItem = {
  schema: typeof EVIDENCE_SCHEMA;
  itemId: string;
  studio: 'pump-lab';
  caseId: string;
  rubricVersion: typeof RUBRIC_VERSION;
  label: typeof LOCAL_STATUS;
  attempt: { explanationAttempts: number; firstTrySupported: boolean; predictions: number; readings: number };
  answer: { cause: string; evidenceIds: string[]; note: string } | null;
  assistanceUsed: { level: Assessment['assistance']; hintLevels: number[]; openedPartsBeforeSupportedExplanation: boolean };
  provenance: { simulated: true; modelVersion: string; modelStatus: string; seed: number; sessionId: string; actionLogHash: string; sourceManifest: 'assets/pump-lab/manifest.json' };
  feedbackSource: 'deterministic-rule-based';
  reviewStatus: 'not reviewed by a domain expert';
  events: { practiceCompleted: boolean; evidenceGenerated: true; competencyExternallyVerified: false };
};

export function toEvidenceItem(s: PumpLabState): PumpLabEvidenceItem {
  const a = assess(s);
  const supported = s.explanations.find(e => e.outcome === 'supported') ?? null;
  const log = serialize(s);
  return {
    schema: EVIDENCE_SCHEMA,
    itemId: `pump-lab-${s.caseId}-${fnv1a(log)}`,
    studio: 'pump-lab',
    caseId: s.caseId,
    rubricVersion: RUBRIC_VERSION,
    label: LOCAL_STATUS,
    attempt: { explanationAttempts: a.attempts, firstTrySupported: a.firstTrySupported, predictions: s.predictions.length, readings: s.readings.length },
    answer: supported ? { cause: supported.cause, evidenceIds: supported.evidenceIds, note: supported.note } : null,
    assistanceUsed: { level: a.assistance, hintLevels: s.hints.map(h => h.level), openedPartsBeforeSupportedExplanation: a.directInspectionBeforeSupported },
    provenance: { simulated: true, modelVersion: MODEL_VERSION, modelStatus: MODEL_STATUS, seed: s.seed, sessionId: s.sessionId, actionLogHash: fnv1a(log), sourceManifest: 'assets/pump-lab/manifest.json' },
    feedbackSource: 'deterministic-rule-based',
    reviewStatus: 'not reviewed by a domain expert',
    events: { practiceCompleted: s.completed !== null, evidenceGenerated: true, competencyExternallyVerified: false },
  };
}

