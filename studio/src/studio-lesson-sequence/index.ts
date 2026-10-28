export type CapabilityStatus = 'implemented' | 'manual';
export type StudioSourceRef = { id: string; title?: string; url: string; locator: string; licenseStatus: string; checkedAt: string };
export type StudioLessonStep = { id: string; title: string; explanation: string; sourceRefIds: string[]; learnerAction: string; studioCapability: string | null; capabilityStatus: CapabilityStatus };
export type StudioLessonPack = { schemaVersion: number; id: string; title: string; objective: string; prerequisites: string[]; sourceRefs: StudioSourceRef[]; steps: StudioLessonStep[]; limitations?: string[] };
export type StudioSequenceStep = { id: string; title: string; explanation: string; prompt: string; sourceRefs: StudioSourceRef[]; capabilityStatus: CapabilityStatus; readingFallback: string };
export type StudioSequence = { title: string; objective: string; prerequisites: string[]; steps: StudioSequenceStep[]; warnings: string[] };
const MAX_STEPS = 20, MAX_SOURCES = 40, MAX_TEXT = 4000;
const text = (value: unknown, label: string, max = MAX_TEXT): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} must be non-empty text of at most ${max} characters`);
  return value;
};
const safeUrl = (value: unknown): string => {
  const raw = text(value, 'source URL', 2048);
  let url: URL; try { url = new URL(raw); } catch { throw new Error('source URL must be an absolute HTTPS URL'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('source URL must be a safe HTTPS URL');
  return raw;
};
const unique = (value: unknown, label: string): string => text(value, label, 160);
export function buildStudioSequence(pack: StudioLessonPack): StudioSequence {
  if (!pack || typeof pack !== 'object' || pack.schemaVersion !== 1) throw new Error('Unsupported studio lesson pack schema');
  text(pack.id, 'pack id', 160); const title = text(pack.title, 'title'); const objective = text(pack.objective, 'objective');
  if (!Array.isArray(pack.prerequisites) || pack.prerequisites.length > 20) throw new Error('prerequisites must be an array of at most 20 items');
  const prerequisites = pack.prerequisites.map((p, i) => text(p, `prerequisite ${i + 1}`));
  if (!Array.isArray(pack.sourceRefs) || pack.sourceRefs.length < 1 || pack.sourceRefs.length > MAX_SOURCES) throw new Error(`sourceRefs must contain 1 to ${MAX_SOURCES} entries`);
  const refs = new Map<string, StudioSourceRef>();
  for (const [i, ref] of pack.sourceRefs.entries()) {
    if (!ref || typeof ref !== 'object') throw new Error(`sourceRefs[${i}] is invalid`);
    const id = unique(ref.id, `sourceRefs[${i}].id`); if (refs.has(id)) throw new Error(`Duplicate source reference id: ${id}`);
    refs.set(id, { id, ...(ref.title === undefined ? {} : { title: text(ref.title, `source ${id} title`) }), url: safeUrl(ref.url), locator: text(ref.locator, `source ${id} locator`), licenseStatus: text(ref.licenseStatus, `source ${id} licence caveat`), checkedAt: text(ref.checkedAt, `source ${id} checkedAt`, 80) });
  }
  if (!Array.isArray(pack.steps) || pack.steps.length < 1 || pack.steps.length > MAX_STEPS) throw new Error(`steps must contain 1 to ${MAX_STEPS} entries`);
  const seen = new Set<string>();
  const steps = pack.steps.map((step, i): StudioSequenceStep => {
    if (!step || typeof step !== 'object') throw new Error(`steps[${i}] is invalid`);
    const id = unique(step.id, `steps[${i}].id`); if (seen.has(id)) throw new Error(`Duplicate step id: ${id}`); seen.add(id);
    if (step.capabilityStatus !== 'implemented' && step.capabilityStatus !== 'manual') throw new Error(`Unsupported capabilityStatus for ${id}`);
    if (step.studioCapability !== null && step.studioCapability !== undefined) text(step.studioCapability, `${id} studioCapability`);
    if (!Array.isArray(step.sourceRefIds) || step.sourceRefIds.length < 1 || step.sourceRefIds.length > MAX_SOURCES) throw new Error(`${id} must cite at least one bounded source reference`);
    const sourceIds = new Set<string>();
    const sourceRefs = step.sourceRefIds.map((sourceId, j) => { const key = unique(sourceId, `${id} sourceRefIds[${j}]`); if (sourceIds.has(key)) throw new Error(`${id} repeats source reference ${key}`); sourceIds.add(key); const ref = refs.get(key); if (!ref) throw new Error(`${id} cites missing source reference ${key}`); return { ...ref }; });
    const explanation = text(step.explanation, `${id} explanation`); const learnerAction = text(step.learnerAction, `${id} learnerAction`);
    return { id, title: text(step.title, `${id} title`), explanation, prompt: learnerAction, sourceRefs, capabilityStatus: step.capabilityStatus, readingFallback: learnerAction };
  });
  const warnings = ['Pack capability declarations describe intended functionality and are not independent verification that a simulation is available.'];
  if (Array.isArray(pack.limitations)) for (const [i, warning] of pack.limitations.entries()) warnings.push(text(warning, `limitation ${i + 1}`));
  return { title, objective, prerequisites: [...prerequisites], steps, warnings };
}
