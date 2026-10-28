import {parseLessonSelection} from '../owner-retrieval/lesson-contract.mjs';

const malformed = message => new TypeError(`Cannot build a local lesson: ${message}`);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function checkBundle(bundle) {
  if (!isObject(bundle) || !isObject(bundle.request) || bundle.request.schemaVersion !== 2 || bundle.request.mode !== 'local') {
    throw malformed('provide a verified local schema v2 source bundle.');
  }
  let parsed;
  try {
    const request = bundle.request;
    if (request.provider !== null || request.providerConsent?.length !== 0 || request.consent !== false ||
        request.fallback !== undefined || request.requestId !== undefined) {
      throw new TypeError('Local bundle must not carry cloud settings.');
    }
    parsed = parseLessonSelection({sourceRefs: request.sourceRefs, mode: 'local', goal: request.goal});
  } catch {
    throw malformed('the selected source references or local request are invalid.');
  }
  if (parsed.bundleRevision !== bundle.bundleRevision || !Array.isArray(bundle.sourceRefs) ||
      bundle.sourceRefs.length !== parsed.sourceRefs.length ||
      bundle.sourceRefs.some((ref, index) => ref?.sourceId !== parsed.sourceRefs[index].sourceId ||
        ref?.revision !== parsed.sourceRefs[index].revision)) {
    throw malformed('the source references do not match the verified bundle revision.');
  }
  if (!Array.isArray(bundle.evidence) || bundle.evidence.length < 1 || bundle.evidence.length > 12) {
    throw malformed('expected 1–12 retrieved evidence passages.');
  }

  const refs = new Map(parsed.sourceRefs.map(ref => [ref.sourceId, ref.revision]));
  const ids = new Set();
  let characters = 0;
  for (const evidence of bundle.evidence) {
    if (!isObject(evidence) || typeof evidence.id !== 'string' || !evidence.id || evidence.id.length > 150 ||
        ids.has(evidence.id) || typeof evidence.sourceId !== 'string' || !refs.has(evidence.sourceId) ||
        evidence.sourceRevision !== refs.get(evidence.sourceId) || typeof evidence.title !== 'string' ||
        !evidence.title.trim() || evidence.title.length > 120 || typeof evidence.locator !== 'string' ||
        !evidence.locator.trim() || evidence.locator.length > 500 || typeof evidence.quote !== 'string' ||
        !evidence.quote.trim() || !Number.isSafeInteger(evidence.start) || !Number.isSafeInteger(evidence.end) ||
        evidence.start < 0 || evidence.end <= evidence.start || evidence.end - evidence.start !== evidence.quote.length ||
        typeof evidence.edited !== 'boolean') {
      throw malformed('an evidence passage is malformed or has inconsistent source metadata.');
    }
    ids.add(evidence.id);
    characters += evidence.quote.length;
  }
  if (characters > 12000) throw malformed('retrieved evidence exceeds the 12,000-character limit.');

  const evidenced = new Set(bundle.evidence.map(item => item.sourceId));
  const uncovered = parsed.sourceRefs.filter(ref => !evidenced.has(ref.sourceId));
  if (uncovered.length) {
    throw malformed(`no retrieved evidence was selected for source ${uncovered.map(ref => ref.sourceId).join(', ')}; reselect material or revise the study goal.`);
  }

  const selectedSources = bundle.selection?.selectedSources;
  if (!Array.isArray(selectedSources) || selectedSources.length !== parsed.sourceRefs.length ||
      selectedSources.some((item, index) => item?.sourceId !== parsed.sourceRefs[index].sourceId ||
        item?.revision !== parsed.sourceRefs[index].revision) || bundle.selection.selectedCharacters !== characters) {
    throw malformed('retrieval metadata does not cover the selected sources in order.');
  }
  return bundle.evidence;
}

function chapterGroups(evidence) {
  const count = Math.max(2, Math.ceil(evidence.length / 4));
  const groups = Array.from({length: count}, () => []);
  evidence.forEach((item, index) => groups[index % count].push(item));
  if (evidence.length === 1) groups[1].push(evidence[0]);
  return groups;
}

function exactSnippet(quote, limit) {
  const start = quote.search(/\S/u);
  return start < 0 ? '' : quote.slice(start, start + limit).trimEnd();
}

/** Build a deterministic source-recognition lesson from a verified local bundle. */
export function buildLocalBundleLesson(bundle) {
  const evidence = checkBundle(bundle);
  const chapters = chapterGroups(evidence).map((group, index) => ({
    title: `Read the cited passages ${index + 1}`,
    explanation: group.map((item, itemIndex) => {
      const excerpt = item.quote.slice(0, 260);
      return `Exact excerpt ${itemIndex + 1}: “${excerpt}”`;
    }).join('\n\n'),
    example: 'Compare the exact wording in these passages. Locate the words that support what you say; do not treat the exercise as proof that the source is correct.',
    citationIds: group.map(item => item.id),
  }));
  const anchor = evidence[0];
  const supportQuote = exactSnippet(anchor.quote, 240);
  const options = [supportQuote];
  for (const distractor of ['This choice is not copied from the selected passage.',
    'This choice is another unquoted alternative.', 'This choice does not appear in the cited excerpt.']) {
    let option = distractor, suffix = 0;
    while (options.includes(option)) option = `${distractor} (alternative ${++suffix})`;
    options.push(option);
  }
  return {
    title: 'Study the selected source passages',
    objective: 'Read exact excerpts from every selected source that has retrieved evidence, and practise locating source support.',
    chapters,
    quiz: [{
      question: 'Which option is copied from the cited source passage?',
      options,
      correct: 0,
      explanation: 'This checks recognition of an exact source excerpt only. It does not demonstrate subject understanding or mastery.',
      citationIds: [anchor.id],
      supportQuote,
    }],
  };
}
