import { useId } from 'react';
import './evidence-gap-panel.css';

export type EvidenceStatus = 'linked' | 'missing' | 'needs-review';

export type EvidenceRequirement = {
  id: string;
  label: string;
  sourceTitle: string;
  sourceUrl: string;
  checkedAt: string;
  evidenceStatus: EvidenceStatus;
  evidenceLabel: string | null;
  nextActionLabel: string | null;
};

export type EvidenceGapPanelProps = {
  roleTitle: string;
  requirements: EvidenceRequirement[];
  onChooseRequirement: (id: string) => void;
};

const MAX_REQUIREMENTS = 100;
const validText = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 100 &&
  value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
const unavailableRequirement: EvidenceRequirement = {
  id: '', label: '', sourceTitle: '', sourceUrl: '', checkedAt: '',
  evidenceStatus: 'missing', evidenceLabel: null, nextActionLabel: null,
};

/** Accept a real UTC calendar date or canonical UTC instant, never a guessed display date. */
export function isValidEvidenceDate(value: unknown, todayUtc = new Date().toISOString().slice(0, 10)) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)) {
    return false;
  }

  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(parsedDay.valueOf()) || parsedDay.toISOString().slice(0, 10) !== day) return false;
  if (day > todayUtc) return false;

  if (value.length > 10) {
    const instant = new Date(value);
    if (!Number.isFinite(instant.valueOf())) return false;
    const canonical = value.includes('.')
      ? instant.toISOString()
      : instant.toISOString().replace('.000Z', 'Z');
    if (canonical !== value) return false;
  }
  return true;
}

/** Allow explicit public HTTPS sources; reject local, credentialed, IP and unusual-port URLs. */
export function isSafeEvidenceSourceUrl(value: unknown) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const localSuffix = /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/;
    const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    return url.protocol === 'https:' &&
      !url.username && !url.password && (!url.port || url.port === '443') &&
      host.includes('.') && !host.startsWith('[') && !ipv4.test(host) &&
      !localSuffix.test(host) && host !== 'localhost';
  } catch {
    return false;
  }
}

function sourceProblem(requirement: EvidenceRequirement, duplicateId: boolean) {
  if (!validId(requirement?.id) || !validText(requirement?.label, 500) ||
      !['linked', 'missing', 'needs-review'].includes(requirement?.evidenceStatus)) {
    return 'Requirement details are incomplete, so this learning step is unavailable.';
  }
  if (duplicateId) return 'This requirement has a repeated ID, so its learning step is disabled.';
  if (!validText(requirement.sourceTitle, 240) || !isSafeEvidenceSourceUrl(requirement.sourceUrl)) {
    return 'A safe source link and source title are required before choosing this step.';
  }
  if (!isValidEvidenceDate(requirement.checkedAt)) {
    return 'The source checked date is missing or invalid, so this step is unavailable.';
  }
  return null;
}

/** The UI uses this gate directly; callers cannot choose rows with ambiguous or unsafe provenance. */
export function createRequirementActionHandler(
  requirements: EvidenceRequirement[],
  onChooseRequirement: (id: string) => void,
) {
  const counts = new Map<string, number>();
  for (const requirement of requirements) {
    if (validId(requirement?.id)) counts.set(requirement.id, (counts.get(requirement.id) ?? 0) + 1);
  }

  return (id: string) => {
    const requirement = requirements.find((candidate) => candidate?.id === id);
    if (!requirement || sourceProblem(requirement, (counts.get(id) ?? 0) > 1)) return false;
    onChooseRequirement(id);
    return true;
  };
}

function formatDate(value: string) {
  if (!isValidEvidenceDate(value)) return 'Date unavailable';
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function EvidenceState({ requirement }: { requirement: EvidenceRequirement }) {
  if (requirement.evidenceStatus === 'linked') {
    return (
      <div className="keg-state keg-state-linked">
        <strong>Evidence linked</strong>
        <p>{validText(requirement.evidenceLabel, 300)
          ? requirement.evidenceLabel
          : 'A learner record is linked. It has not been independently assessed.'}</p>
        {validText(requirement.evidenceLabel, 300) &&
          <p>Linked record only; it has not been independently assessed.</p>}
      </div>
    );
  }

  if (requirement.evidenceStatus === 'needs-review') {
    return (
      <div className="keg-state keg-state-review">
        <strong>Evidence needs review</strong>
        {validText(requirement.evidenceLabel, 300)
          ? <p>{requirement.evidenceLabel}</p>
          : <p>Check the linked record before using it in your next step.</p>}
      </div>
    );
  }

  return (
    <div className="keg-state keg-state-missing">
      <strong>No evidence linked</strong>
      <p>This only means no record is linked here. It does not mean you lack this skill.</p>
    </div>
  );
}

function RequirementRow({
  requirement,
  duplicateId,
  onChoose,
}: {
  requirement: EvidenceRequirement;
  duplicateId: boolean;
  onChoose: (id: string) => boolean;
}) {
  const actionReasonId = `${useId()}-action-reason`;
  const problem = sourceProblem(requirement, duplicateId);
  const safeUrl = isSafeEvidenceSourceUrl(requirement.sourceUrl) ? requirement.sourceUrl : null;

  return (
    <li className="keg-requirement">
      <div className="keg-requirement-main">
        <h3>{validText(requirement.label, 500) ? requirement.label : 'Requirement details unavailable'}</h3>
        <EvidenceState requirement={requirement} />
      </div>
      <div className="keg-requirement-source">
        <p className="keg-source-heading">Source</p>
        <p className="keg-source-title">{validText(requirement.sourceTitle, 240)
          ? requirement.sourceTitle
          : 'Source title unavailable'}</p>
        <p className="keg-source-date">Checked {formatDate(requirement.checkedAt)}</p>
        {safeUrl
          ? <a href={safeUrl} target="_blank" rel="noopener noreferrer">View original requirement</a>
          : <p className="keg-source-unavailable">Source link unavailable</p>}
      </div>
      <div className="keg-action">
        <button
          type="button"
          disabled={Boolean(problem)}
          aria-describedby={problem ? actionReasonId : undefined}
          onClick={() => { if (!problem) onChoose(requirement.id); }}
        >
          {validText(requirement.nextActionLabel, 160)
            ? requirement.nextActionLabel
            : 'Choose a learning step'}
        </button>
        {problem && <p className="keg-action-reason" id={actionReasonId} role="note">{problem}</p>}
      </div>
    </li>
  );
}

/** Stateless source-to-evidence presentation. The host owns mapping and all persisted actions. */
export default function EvidenceGapPanel({
  roleTitle,
  requirements,
  onChooseRequirement,
}: EvidenceGapPanelProps) {
  const headingId = `${useId()}-evidence-gap-heading`;
  const hasRequirementArray = Array.isArray(requirements);
  const suppliedRequirements = hasRequirementArray ? requirements : [];
  const usableRequirements = suppliedRequirements.length <= MAX_REQUIREMENTS
    ? suppliedRequirements.map((item) => item && typeof item === 'object'
      ? item as EvidenceRequirement
      : unavailableRequirement)
    : [];
  const counts = new Map<string, number>();
  for (const requirement of usableRequirements) {
    if (validId(requirement?.id)) counts.set(requirement.id, (counts.get(requirement.id) ?? 0) + 1);
  }
  const choose = createRequirementActionHandler(usableRequirements, onChooseRequirement);

  return (
    <section className="kairo-evidence-gap" aria-labelledby={headingId}>
      <header className="keg-header">
        <div className="keg-mark" aria-hidden="true">C</div>
        <div>
          <p className="keg-brand">KAIRO</p>
          <h2 id={headingId}>{validText(roleTitle, 200) ? roleTitle : 'Role learning pathway'}</h2>
        </div>
      </header>

      <p className="keg-intro">See what this role asks for, what work you have linked, and one useful next step.</p>

      {!hasRequirementArray
        ? <p className="keg-empty" role="status">Role requirements are unavailable. No learning step can be chosen.</p>
        : suppliedRequirements.length > MAX_REQUIREMENTS
        ? <p className="keg-empty" role="status">There are too many requirements to show safely. Narrow the source list first.</p>
        : usableRequirements.length === 0
          ? <p className="keg-empty" role="status">No sourced requirements are available yet. Add a checked role source to begin.</p>
          : <ol className="keg-list">
              {usableRequirements.map((requirement, index) => (
                <RequirementRow
                  key={`${requirement?.id ?? 'invalid'}-${index}`}
                  requirement={requirement}
                  duplicateId={validId(requirement?.id) && counts.get(requirement.id)! > 1}
                  onChoose={choose}
                />
              ))}
            </ol>}

      <p className="keg-limit">A linked record is not proof of competence, mastery, job readiness, or a hiring outcome.</p>
    </section>
  );
}
