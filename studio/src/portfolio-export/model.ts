import { summarizeCase, type PracticeArtifact } from '../evidence/model.ts';
import { exportRun, type WorkSimExport } from '../worksim/model.ts';

export const PORTFOLIO_VERSION = 'kairo-portfolio-export-v1' as const;
const MAX_ITEMS = 20;
const MAX_BYTES = 250_000;

export type PortfolioItem =
  | { evidenceType: 'local-practice'; artifact: PracticeArtifact }
  | { evidenceType: 'synthetic-exercise'; artifact: WorkSimExport };
export type PortfolioExport = {
  formatVersion: typeof PORTFOLIO_VERSION;
  validation: 'replay-consistency-checked; local self-report remains unverified';
  createdAt: string;
  items: PortfolioItem[];
  rejected: { practiceCases: number[]; worksimRuns: number[] };
  limits: string[];
};
const trustedSnapshots = new WeakMap<object, string>();

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
}
function snapshot(portfolio: PortfolioExport): string {
  const expected = trustedSnapshots.get(portfolio);
  let current: string;
  try { current = JSON.stringify(portfolio); } catch { throw new Error('Portfolio export is malformed.'); }
  if (!expected || current !== expected || portfolio.formatVersion !== PORTFOLIO_VERSION) throw new Error('Portfolio must be an unchanged replay-validated export.');
  return current;
}

export function buildPortfolioExport(input: unknown): PortfolioExport | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['practiceCases', 'worksimRuns'].includes(key)) ||
      !Array.isArray(value.practiceCases) || !Array.isArray(value.worksimRuns) ||
      value.practiceCases.length > MAX_ITEMS || value.worksimRuns.length > MAX_ITEMS ||
      value.practiceCases.length + value.worksimRuns.length > MAX_ITEMS) return null;
  try { if (new TextEncoder().encode(JSON.stringify(input)).byteLength > MAX_BYTES) return null; }
  catch { return null; }
  const items: PortfolioItem[] = [];
  const rejected = { practiceCases: [] as number[], worksimRuns: [] as number[] };
  value.practiceCases.forEach((record, index) => {
    const artifact = summarizeCase(record);
    if (artifact) items.push({ evidenceType: 'local-practice', artifact });
    else rejected.practiceCases.push(index);
  });
  value.worksimRuns.forEach((record, index) => {
    const artifact = exportRun(record);
    if (artifact) items.push({ evidenceType: 'synthetic-exercise', artifact });
    else rejected.worksimRuns.push(index);
  });
  const result: PortfolioExport = {
    formatVersion: PORTFOLIO_VERSION,
    validation: 'replay-consistency-checked; local self-report remains unverified',
    createdAt: new Date().toISOString(), items, rejected,
    limits: [
      'Replay checks consistency with authored scenario rules; source records and timestamps remain user-editable.',
      'All skills, reflections, assistance exposure, and contributions are self-reported and unverified.',
      'Synthetic exercise records are invented training data and do not represent real employer work or customers.',
      'No employer certification, hiring recommendation, ATS score, or accreditation is provided.',
    ],
  };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_BYTES) return null;
  freezeDeep(result);
  trustedSnapshots.set(result, JSON.stringify(result));
  return result;
}

export function portfolioJson(portfolio: PortfolioExport): string {
  snapshot(portfolio);
  const json = JSON.stringify(portfolio, null, 2);
  if (new TextEncoder().encode(json).byteLength > MAX_BYTES) throw new Error('Portfolio export exceeds the size limit.');
  return json;
}

function esc(value: unknown): string {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
export function portfolioHtml(portfolio: PortfolioExport): string {
  snapshot(portfolio);
  const sections = portfolio.items.map((item, index) => {
    const artifact = item.artifact;
    const support = item.evidenceType === 'synthetic-exercise'
      ? `Assistance exposure: ${item.artifact.assistanceExposure}; reported support: ${item.artifact.reportedAssistance.join(', ') || 'none reported'}; unknown scored attempts: ${item.artifact.unknownAssistanceAttempts}.`
      : 'Help exposure: unknown (not recorded by this case model).';
    const intro = `<p><strong>Evidence type:</strong> ${esc(item.evidenceType === 'synthetic-exercise' ? 'Synthetic exercise' : 'Local practice')}</p><p><strong>Status:</strong> ${esc(artifact.status)}</p><p><strong>Scenario:</strong> ${esc(artifact.scenarioVersion)} · <strong>Run:</strong> ${esc(artifact.runId)} · <strong>Completed:</strong> ${esc(artifact.completedAt)}</p><p>${esc(support)}</p>`;
    const reflection = 'contributorReflection' in artifact ? artifact.contributorReflection : artifact.reflection;
    const linkedLesson = 'lessonId' in artifact ? artifact.lessonId || 'Standalone practice' : 'Not applicable';
    const rubricRows = artifact.rubric.map(row => {
      const label = 'key' in row ? row.key : row.label;
      const latest = 'latestMet' in row ? row.latestMet : row.met;
      return `<tr><th scope="row">${esc(label)}</th><td>${esc(row.attempts)}</td><td>${row.firstTry ? 'Yes' : 'No'}</td><td>${latest ? 'Met' : 'Not met'}</td></tr>`;
    }).join('');
    const attempts = artifact.attempts.map((attempt, attemptIndex) => {
      const outcome = attempt.correct === undefined ? 'Recorded' : attempt.correct ? 'Scenario check met' : 'Retry needed';
      const assistance = 'assistanceExposure' in attempt ? ` Assistance exposure: ${attempt.assistanceExposure}.` : ' Help exposure: unknown.';
      return `<li><strong>Attempt ${attemptIndex + 1}:</strong> ${esc(attempt.kind)} — ${esc(attempt.value)} <span>(${esc(attempt.at)}; ${outcome}.${esc(assistance)})</span></li>`;
    }).join('');
    return `<section aria-labelledby="item-${index}"><h2 id="item-${index}">${esc(artifact.title)}</h2>${intro}<details><summary>Source and run details</summary><dl><dt>Source</dt><dd>${esc(artifact.source)}</dd><dt>Scenario version</dt><dd>${esc(artifact.scenarioVersion)}</dd><dt>Artifact version</dt><dd>${esc(artifact.artifactVersion)}</dd><dt>Run ID</dt><dd>${esc(artifact.runId)}</dd><dt>Linked lesson</dt><dd>${esc(linkedLesson)}</dd></dl></details><h3>Rubric checks</h3><div class="table-wrap"><table><thead><tr><th scope="col">Check</th><th scope="col">Attempts</th><th scope="col">First try</th><th scope="col">Latest</th></tr></thead><tbody>${rubricRows}</tbody></table></div><h3>Recorded attempts</h3><ol>${attempts}</ol><h3>Contributor reflection</h3><p class="reflection">${esc(reflection)}</p><h3>Limitations</h3><ul>${artifact.limitations.map(text => `<li>${esc(text)}</li>`).join('')}</ul></section>`;
  }).join('\n');
  const rejected = `<section><h2>Items not included</h2><p>Invalid inputs were rejected by replay validation. Source array positions are listed for follow-up.</p><p>Practice cases: ${portfolio.rejected.practiceCases.length ? portfolio.rejected.practiceCases.map(esc).join(', ') : 'None'}</p><p>Simulation runs: ${portfolio.rejected.worksimRuns.length ? portfolio.rejected.worksimRuns.map(esc).join(', ') : 'None'}</p></section>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KAIRO practice portfolio</title><style>
    :root{color-scheme:light;font:16px/1.6 system-ui,sans-serif;color:#263d32;background:#f5f0e5}body{max-width:900px;margin:0 auto;padding:2rem}h1,h2,h3{line-height:1.25;color:#263d32}header,section{background:#fffcf5;border:1px solid #d8d0bd;border-radius:12px;padding:1.25rem;margin:1rem 0}header{border-top:6px solid #526044}p,dd{overflow-wrap:anywhere}.reflection{white-space:pre-wrap}.notice{font-weight:650;color:#526044}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.55rem;border-bottom:1px solid #d8d0bd;vertical-align:top}thead{background:#f0eadb}summary{cursor:pointer;font-weight:650;color:#526044}dt{font-weight:700;margin-top:.5rem}li{margin:.35rem 0}a{color:#526044}@media print{body{max-width:none;padding:0;background:white}header,section{break-inside:avoid;border-color:#9a702e;border-radius:0}details{display:block}summary{list-style:none}}
    </style></head><body><header><h1>KAIRO practice portfolio</h1><p class="notice">Self-reported practice, unverified. Replay validation checks consistency with scenario rules; it does not verify identity, real-world work, or competence.</p><p>Export format: ${esc(portfolio.formatVersion)} · Created: ${esc(portfolio.createdAt)}</p><ul>${portfolio.limits.map(text => `<li>${esc(text)}</li>`).join('')}</ul></header>${sections}${rejected}</body></html>`;
  if (new TextEncoder().encode(html).byteLength > MAX_BYTES) throw new Error('Portfolio HTML exceeds the size limit.');
  return html;
}
