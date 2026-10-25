export type CurriculumModule = {
  id: string;
  institutionId: string;
  catalogueYear: number | null;
  code: string | null;
  title: string;
  studyYear: number;
  programmeIds: string[];
  conceptIds: string[];
  source: {
    url: string;
    locator: string;
    checkedAt: string;
    evidenceStatus: 'original-reviewed' | 'discovery-only';
  };
  status: 'reviewed' | 'needs-review';
};

export type Programme = {
  id: string;
  institutionId: string;
  title: string;
  qualification: string;
  sourceUrl: string;
};

export type CurriculumRegistry = {
  programmes: Programme[];
  modules: CurriculumModule[];
  discoveryLeads: Array<{
    id: string;
    title: string;
    url: string;
    status: 'discovery-only';
    note: string;
  }>;
};

const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.trim() === value;

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const isUtcTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return false;
  const canonical = parsed.toISOString();
  return value.includes('.') ? canonical === value : canonical.replace('.000Z', 'Z') === value;
};

export function validateRegistry(value: unknown): CurriculumRegistry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Registry must be an object.');
  }

  const registry = value as CurriculumRegistry;
  if (!Array.isArray(registry.programmes) || !Array.isArray(registry.modules) || !Array.isArray(registry.discoveryLeads)) {
    throw new Error('Registry collections are required.');
  }

  const programmeIds = new Set<string>();
  for (const programme of registry.programmes) {
    if (
      !programme ||
      !nonempty(programme.id) ||
      programmeIds.has(programme.id) ||
      !nonempty(programme.institutionId) ||
      !nonempty(programme.title) ||
      !nonempty(programme.qualification) ||
      !isHttpsUrl(programme.sourceUrl)
    ) {
      throw new Error('Invalid programme metadata or source URL.');
    }
    programmeIds.add(programme.id);
  }

  const moduleIds = new Set<string>();
  const identities = new Set<string>();
  for (const module of registry.modules) {
    if (
      !module ||
      !nonempty(module.id) ||
      moduleIds.has(module.id) ||
      !nonempty(module.institutionId) ||
      !(module.catalogueYear === null || (Number.isInteger(module.catalogueYear) && module.catalogueYear >= 1900 && module.catalogueYear <= 2200)) ||
      !(module.code === null || nonempty(module.code)) ||
      !nonempty(module.title) ||
      !Number.isInteger(module.studyYear) ||
      module.studyYear < 1 ||
      module.studyYear > 10 ||
      !Array.isArray(module.programmeIds) ||
      module.programmeIds.length === 0 ||
      module.programmeIds.some((id) => !nonempty(id) || !programmeIds.has(id)) ||
      new Set(module.programmeIds).size !== module.programmeIds.length ||
      module.programmeIds.some((id) => !registry.programmes.some((p) => p.id === id && p.institutionId === module.institutionId)) ||
      !Array.isArray(module.conceptIds) ||
      module.conceptIds.some((id) => !nonempty(id)) ||
      !module.source ||
      !isHttpsUrl(module.source.url) ||
      !nonempty(module.source.locator) ||
      !isUtcTimestamp(module.source.checkedAt) ||
      !['original-reviewed', 'discovery-only'].includes(module.source.evidenceStatus) ||
      !['reviewed', 'needs-review'].includes(module.status)
    ) {
      throw new Error('Invalid curriculum module metadata.');
    }

    if (
      module.status === 'reviewed' &&
      (module.code === null || module.catalogueYear === null || module.source.evidenceStatus !== 'original-reviewed')
    ) {
      throw new Error('Reviewed modules require an exact code, catalogue year and original syllabus evidence.');
    }

    if (module.code !== null && module.catalogueYear !== null) {
      const identity = `${module.institutionId}\0${module.catalogueYear}\0${module.code}`;
      if (identities.has(identity)) {
        throw new Error('Duplicate institution/year/course-code identity. Reuse the authoritative module record.');
      }
      identities.add(identity);
    }
    moduleIds.add(module.id);
  }

  const leadIds = new Set<string>();
  for (const lead of registry.discoveryLeads) {
    if (
      !lead ||
      !nonempty(lead.id) ||
      leadIds.has(lead.id) ||
      !nonempty(lead.title) ||
      !isHttpsUrl(lead.url) ||
      lead.status !== 'discovery-only' ||
      !nonempty(lead.note)
    ) {
      throw new Error('Invalid discovery lead.');
    }
    leadIds.add(lead.id);
  }

  return structuredClone(registry);
}
