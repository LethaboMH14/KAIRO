import { VERSION, initialCase, records, transition, type Action, type CaseState, type EvidenceKey } from '../practice/model.ts';
import type { CaseEvent, CaseRecord, Profile } from '../profile/model.ts';

export const ARTIFACT_VERSION = 'practice-artifact-v1';
export const UNVERIFIED_STATUS = 'local self-directed practice, unverified' as const;
const MAX_EVENTS = 200;
const MAX_TIME = 40;
const MAX_TEXT = 500;
const validTime = (v: unknown): v is string => {
  if (typeof v !== 'string' || v.length > MAX_TIME) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(v);
  if (!m) return false;
  const [, ys, mos, ds, hs, mis, ss, , zone] = m;
  const y = Number(ys), mo = Number(mos), d = Number(ds), h = Number(hs), mi = Number(mis), s = Number(ss);
  if (mo < 1 || mo > 12 || h > 23 || mi > 59 || s > 59) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d < 1 || d > days[mo - 1]) return false;
  if (zone !== 'Z') {
    const [zh, zm] = zone.slice(1).split(':').map(Number);
    if (zh > 23 || zm > 59) return false;
  }
  return Number.isFinite(Date.parse(v));
};

export type PracticeArtifact = {
  artifactVersion: typeof ARTIFACT_VERSION;
  status: typeof UNVERIFIED_STATUS;
  source: 'browser-local profile';
  scenarioVersion: typeof VERSION;
  runId: string;
  lessonId: string | null;
  title: string;
  completedAt: string;
  rubric: { label: string; attempts: number; firstTry: boolean; met: boolean }[];
  attempts: { at: string; kind: string; value: string; correct?: boolean }[];
  contributorReflection: string;
  limitations: string[];
};

function isRecord(value: unknown): value is CaseRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return r.version === VERSION && typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 100 &&
    (r.lessonId === null || typeof r.lessonId === 'string' && r.lessonId.length <= 100) &&
    typeof r.title === 'string' && r.title.length > 0 && r.title.length <= 200 &&
    typeof r.completedAt === 'string' && validTime(r.completedAt) && typeof r.reflection === 'string' &&
    r.reflection.length >= 30 && r.reflection.length <= 1000 && Array.isArray(r.events) &&
    r.events.length <= MAX_EVENTS && r.events.every((e: unknown) => {
      if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
      const event = e as Record<string, unknown>;
      return typeof event.kind === 'string' && event.kind.length <= 80 && typeof event.value === 'string' && event.value.length <= MAX_TEXT &&
        validTime(event.at) && (event.correct === undefined || typeof event.correct === 'boolean');
    });
}

function actionFor(e: CaseEvent): Action | null {
  if (e.kind === 'Inspected record') {
    const key = (Object.keys(records) as EvidenceKey[]).find(k => records[k].title === e.value);
    return key ? { type: 'inspect', key } : null;
  }
  if (e.kind === 'Expected stock') {
    if (!/^-?(?:\d+)(?:\.\d+)?$/.test(e.value)) return null;
    const value = Number(e.value);
    return Number.isFinite(value) ? { type: 'calculate', value } : null;
  }
  if (e.kind === 'Reconciliation') {
    const match = /^Difference (-?(?:\d+)(?:\.\d+)?); explanation (damage|theft|delivery|unknown)$/.exec(e.value);
    return match ? { type: 'reconcile', difference: Number(match[1]), cause: match[2] } : null;
  }
  if (e.kind === 'Workplace decision' && ['record', 'accuse', 'ignore'].includes(e.value)) return { type: 'decide', value: e.value };
  if (e.kind === 'Reflection saved') return { type: 'reflect', value: e.value };
  return null;
}

export function summarizeCase(record: unknown): PracticeArtifact | null {
  if (!isRecord(record)) return null;
  const raw = record as CaseRecord;
  let state: CaseState = initialCase(raw.id, raw.lessonId);
  let previousTime = -Infinity;
  for (const stored of raw.events) {
    const eventTime = Date.parse(stored.at);
    if (eventTime < previousTime) return null;
    previousTime = eventTime;
    const action = actionFor(stored);
    if (!action) return null;
    const replayAction = action.type === 'reflect' ? { type: 'reflect' as const, value: raw.reflection } : action;
    const next = transition(state, replayAction, stored.at);
    const emitted = next.events.at(-1);
    if (next.events.length !== state.events.length + 1 || !emitted || emitted.kind !== stored.kind || emitted.value !== stored.value || emitted.at !== stored.at) return null;
    // The transition's derived check is authoritative; a supplied flag must match it.
    if (stored.correct !== emitted.correct) return null;
    if (action.type === 'reflect' && emitted.value !== stored.value) return null;
    state = next;
  }
  if (state.phase !== 'complete' || !state.completedAt || state.completedAt !== raw.completedAt || state.reflection !== raw.reflection) return null;
  if (Date.parse(raw.completedAt) < previousTime) return null;
  const checks = ['Expected stock', 'Reconciliation', 'Workplace decision'];
  const rubric = checks.map(label => {
    const attempts = state.events.filter(e => e.kind === label);
    return { label, attempts: attempts.length, firstTry: attempts[0]?.correct === true, met: attempts.at(-1)?.correct === true };
  });
  if (rubric.some(row => !row.met)) return null;
  return {
    artifactVersion: ARTIFACT_VERSION, status: UNVERIFIED_STATUS, source: 'browser-local profile',
    scenarioVersion: VERSION, runId: raw.id, lessonId: raw.lessonId, title: raw.title,
    completedAt: raw.completedAt,
    rubric,
    attempts: state.events.map(e => ({ at: e.at, kind: e.kind, value: e.value, ...(e.correct === undefined ? {} : { correct: e.correct }) })),
    contributorReflection: raw.reflection,
    limitations: ['This is local self-directed practice, unverified; history and timestamps can be edited on this device.', 'The scenario records attempts and retries but does not record help exposure; help exposure is unknown.', 'Rubric checks reflect replayed scenario rules, not independent assessment, workplace competence, or accreditation.']
  };
}

export function collectArtifacts(profile: unknown): PracticeArtifact[] {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return [];
  const p = profile as Partial<Profile>;
  if (p.version !== 1 || !Array.isArray(p.cases) || p.cases.length > 20) return [];
  return p.cases.flatMap(record => { const artifact = summarizeCase(record); return artifact ? [artifact] : []; });
}

function escapeMarkdown(value: string): string { return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\r', '').replaceAll('\n', ' '); }
export function artifactMarkdown(artifact: PracticeArtifact): string {
  return `# ${escapeMarkdown(artifact.title)}\n\nStatus: ${artifact.status}\nSource: ${artifact.source}\nArtifact version: ${artifact.artifactVersion}\nScenario version: ${artifact.scenarioVersion}\nRun ID: ${escapeMarkdown(artifact.runId)}\nLinked lesson: ${artifact.lessonId ? escapeMarkdown(artifact.lessonId) : 'Standalone'}\nCompleted at: ${artifact.completedAt}\n\n## Rubric checks\n\n| Check | Attempts | First try | Latest met |\n| --- | ---: | --- | --- |\n${artifact.rubric.map(r => `| ${escapeMarkdown(r.label)} | ${r.attempts} | ${r.firstTry ? 'Yes' : 'No'} | ${r.met ? 'Yes' : 'No'} |`).join('\n')}\n\n## Recorded practice trail\n\n${artifact.attempts.map(a => `- ${a.at}: ${escapeMarkdown(a.kind)}: ${escapeMarkdown(a.value)}${a.correct === undefined ? '' : a.correct ? ' (scenario check met)' : ' (retry needed)'}`).join('\n')}\n\n## Contributor reflection\n\n${escapeMarkdown(artifact.contributorReflection)}\n\n## Limitations\n\n${artifact.limitations.map(x => `- ${x}`).join('\n')}\n`;
}
