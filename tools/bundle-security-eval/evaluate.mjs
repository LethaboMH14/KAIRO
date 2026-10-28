#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const ids = ['a'.repeat(24), 'b'.repeat(24)];
const ownerId = 'synthetic-owner-a';

function args(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--record-module') result.recordModule = argv[++i];
    else if (argv[i] === '--output') result.output = argv[++i];
    else if (argv[i] === '--help') result.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!result.help && (!result.recordModule || !isAbsolute(result.recordModule))) throw new Error('Pass --record-module with an absolute path to the actual PR48 lesson-v2/record.mjs module.');
  return result;
}

function syntheticStore(modulePath, { malicious = false } = {}) {
  const records = new Map(); let reads = 0;
  const key = (owner, kind, id) => `${owner}:${kind}:${id}`;
  const pages = ids.map((id, index) => {
    const special = malicious && index === 0 ? '<script>globalThis.__KAIRO_FIXTURE_EXECUTED__=true</script> ' : '';
    const text = `${special}Synthetic reviewed source ${index + 1} describes a motor field principle for an offline record-validation fixture. `.repeat(2);
    const reviewedPages = [{ locator: `Fixture page ${index + 1}`, method: 'pasted-text', edited: false, text }];
    const revision = digest(reviewedPages);
    const source = { id, title: `Synthetic source ${index + 1}`, reviewed: true, reviewedPages, pages: reviewedPages, revision };
    records.set(key(ownerId, 'sources', id), { id, value: structuredClone(source), version: 'fixture-v1' });
    records.set(key(ownerId, 'revisions', `${id}_${revision}`), { id: `${id}_${revision}`, value: structuredClone(source), version: 'fixture-v1' });
    return source;
  });
  const repository = {
    async get(owner, kind, id) { reads++; return structuredClone(records.get(key(owner, kind, id)) || null); },
    async put(owner, kind, id, value, options) { const saved = { id, value: structuredClone(value), version: 'fixture-v1', options }; records.set(key(owner, kind, id), saved); return structuredClone(saved); },
    async remove(owner, kind, id) { records.delete(key(owner, kind, id)); return { removed: true }; },
  };
  return { records, repository, pages, reads: () => reads, key, modulePath };
}

function content(bundle) {
  const evidence = bundle.evidence, supportQuote = evidence[0].quote.slice(0, Math.min(60, evidence[0].quote.length));
  return { title: 'Synthetic local lesson', objective: 'Inspect exact selected source evidence.', chapters: [
    { title: 'Source one', explanation: 'This is a bounded synthetic explanation.', example: 'Check the first locator.', citationIds: [evidence[0].id] },
    { title: 'Source two', explanation: 'This remains a separate selected source.', example: 'Check the second locator.', citationIds: [evidence.at(-1).id] },
  ], quiz: [{ question: 'Which phrase occurs in the source?', options: [supportQuote, 'Unrelated synthetic choice one.', 'Unrelated synthetic choice two.', 'Unrelated synthetic choice three.'], correct: 0, explanation: 'This fixture checks an exact source anchor only.', citationIds: [evidence[0].id], supportQuote }] };
}

async function buildBundle(store, prepareOwnedLessonBundle) {
  const sourceRefs = store.pages.map(source => ({ sourceId: source.id, revision: source.revision }));
  const request = { mode: 'local', goal: 'motor field', sourceRefs };
  const retrieve = async ({ sourceIds }) => {
    const evidence = sourceIds.map(id => {
      const source = store.pages.find(item => item.id === id), page = source.reviewedPages[0];
      return { id: `${id}-${source.revision.slice(0, 12)}-S1-0`, sourceId: id, sourceRevision: source.revision, title: source.title, locator: page.locator, quote: page.text, start: 0, end: page.text.length, edited: page.edited };
    });
    return { evidence, selection: { selectedSources: sourceRefs, selectedCharacters: evidence.reduce((sum, item) => sum + item.quote.length, 0) } };
  };
  return prepareOwnedLessonBundle({ repository: store.repository, ownerId, request, retrieve });
}

async function expect(id, category, expected, run, cases) {
  try {
    const detail = await run();
    cases.push({ id, category, expected, actual: 'accepted', outcome: expected === 'accepted' ? 'pass' : 'fail', detail: detail ?? null });
  } catch (error) {
    cases.push({ id, category, expected, actual: 'rejected', outcome: expected === 'rejected' ? 'pass' : 'fail', detail: { name: error?.name || 'Error', status: Number.isInteger(error?.status) ? error.status : null } });
  }
}

async function evaluate(recordModulePath) {
  const resolvedModule = resolve(recordModulePath);
  const recordUrl = pathToFileURL(resolvedModule);
  const recordSource = await readFile(resolvedModule);
  const moduleSha256 = createHash('sha256').update(recordSource).digest('hex');
  const recordApi = await import(recordUrl.href);
  const contractApi = await import(new URL('../owner-retrieval/lesson-contract.mjs', recordUrl));
  const modelApi = await import(new URL('../workspace/model.mjs', recordUrl));
  for (const name of ['createLessonV2Record', 'verifyLessonV2Record']) if (typeof recordApi[name] !== 'function') throw new Error(`Selected module does not export ${name}.`);
  const store = syntheticStore(resolvedModule), bundle = await buildBundle(store, contractApi.prepareOwnedLessonBundle);
  const record = recordApi.createLessonV2Record({ bundle, content: content(bundle), id: 'f'.repeat(24), createdAt: '2026-10-25T12:00:00.000Z' });
  const cases = [];
  await expect('owner-rights-owner-reads-current-record', 'ownership', 'accepted', () => recordApi.verifyLessonV2Record({ repository: store.repository, ownerId, record }), cases);
  await expect('owner-other-cannot-read-record-sources', 'ownership', 'rejected', () => recordApi.verifyLessonV2Record({ repository: store.repository, ownerId: 'synthetic-owner-b', record }), cases);

  const changedCurrent = syntheticStore(resolvedModule), currentBundle = await buildBundle(changedCurrent, contractApi.prepareOwnedLessonBundle), currentRecord = recordApi.createLessonV2Record({ bundle: currentBundle, content: content(currentBundle), id: 'e'.repeat(24) });
  const source = changedCurrent.pages[0], changedPages = [{ ...source.reviewedPages[0], text: source.reviewedPages[0].text + ' changed' }], changedRevision = modelApi.hash(changedPages);
  changedCurrent.records.set(changedCurrent.key(ownerId, 'sources', source.id), { value: { ...source, reviewedPages: changedPages, revision: changedRevision }, version: 'fixture-v2' });
  await expect('current-source-revision-change-rejects', 'revision', 'rejected', () => recordApi.verifyLessonV2Record({ repository: changedCurrent.repository, ownerId, record: currentRecord }), cases);

  const changedArchive = syntheticStore(resolvedModule), archiveBundle = await buildBundle(changedArchive, contractApi.prepareOwnedLessonBundle), archiveRecord = recordApi.createLessonV2Record({ bundle: archiveBundle, content: content(archiveBundle), id: 'd'.repeat(24) });
  const archivedSource = changedArchive.pages[0];
  changedArchive.records.delete(changedArchive.key(ownerId, 'revisions', `${archivedSource.id}_${archivedSource.revision}`));
  await expect('archived-source-revision-missing-rejects', 'archive', 'rejected', () => recordApi.verifyLessonV2Record({ repository: changedArchive.repository, ownerId, record: archiveRecord }), cases);

  const tamperedArchive = syntheticStore(resolvedModule), tamperedBundle = await buildBundle(tamperedArchive, contractApi.prepareOwnedLessonBundle), tamperedRecord = recordApi.createLessonV2Record({ bundle: tamperedBundle, content: content(tamperedBundle), id: '2'.repeat(24) });
  const archived = tamperedArchive.pages[0], archivePages = [{ ...archived.reviewedPages[0], text: archived.reviewedPages[0].text + ' archive changed' }];
  tamperedArchive.records.set(tamperedArchive.key(ownerId, 'revisions', `${archived.id}_${archived.revision}`), { value: { ...archived, reviewedPages: archivePages }, version: 'tampered-archive' });
  await expect('archived-source-content-tamper-rejects', 'archive', 'rejected', () => recordApi.verifyLessonV2Record({ repository: tamperedArchive.repository, ownerId, record: tamperedRecord }), cases);

  const missingSource = syntheticStore(resolvedModule), missingBundle = await buildBundle(missingSource, contractApi.prepareOwnedLessonBundle), missingRecord = recordApi.createLessonV2Record({ bundle: missingBundle, content: content(missingBundle), id: 'c'.repeat(24) });
  missingSource.records.delete(missingSource.key(ownerId, 'sources', ids[1]));
  await expect('deleted-selected-source-rejects', 'revision', 'rejected', () => recordApi.verifyLessonV2Record({ repository: missingSource.repository, ownerId, record: missingRecord }), cases);

  const cloudBundle = provider => ({ ...bundle, request: { ...bundle.request, mode: 'cloud', provider, consent: true, providerConsent: [provider], requestId: 'synthetic-request-1' } });
  await expect('unsupported-provider-rejects', 'provider', 'rejected', () => recordApi.createLessonV2Record({ bundle: cloudBundle('unsupported'), content: content(bundle), id: '9'.repeat(24) }), cases);
  await expect('cloud-consent-missing-rejects', 'consent', 'rejected', () => recordApi.createLessonV2Record({ bundle: { ...bundle, request: { ...cloudBundle('google').request, consent: false } }, content: content(bundle), id: '8'.repeat(24) }), cases);
  await expect('selected-provider-absent-from-consent-rejects', 'consent', 'rejected', () => recordApi.createLessonV2Record({ bundle: { ...bundle, request: { ...cloudBundle('google').request, providerConsent: ['groq'] } }, content: content(bundle), id: '7'.repeat(24) }), cases);
  const cloudRecord = recordApi.createLessonV2Record({ bundle: cloudBundle('google'), content: content(bundle), id: '6'.repeat(24), model: 'synthetic-model' });
  await expect('unsupported-persisted-provider-rejects', 'provider', 'rejected', () => recordApi.verifyLessonV2Record({ repository: store.repository, ownerId, record: { ...cloudRecord, provider: 'unlisted' } }), cases);
  await expect('overlong-persisted-model-rejects', 'provider', 'rejected', () => recordApi.verifyLessonV2Record({ repository: store.repository, ownerId, record: { ...cloudRecord, model: 'x'.repeat(161) } }), cases);
  await expect('overlong-model-constructor-rejects', 'provider', 'rejected', () => recordApi.createLessonV2Record({ bundle: cloudBundle('google'), content: content(bundle), id: '5'.repeat(24), model: 'x'.repeat(161) }), cases);

  const maliciousStore = syntheticStore(resolvedModule, { malicious: true }), maliciousBundle = await buildBundle(maliciousStore, contractApi.prepareOwnedLessonBundle), maliciousRecord = recordApi.createLessonV2Record({ bundle: maliciousBundle, content: content(maliciousBundle), id: '4'.repeat(24) });
  await expect('markup-shaped-source-remains-plain-fixture-text', 'inert-input', 'accepted', async () => {
    await recordApi.verifyLessonV2Record({ repository: maliciousStore.repository, ownerId, record: maliciousRecord });
    const quote = maliciousRecord.evidence[0].quote;
    if (!quote.includes('<script>globalThis.__KAIRO_FIXTURE_EXECUTED__=true</script>') || globalThis.__KAIRO_FIXTURE_EXECUTED__ === true) throw new Error('Fixture text changed or executed.');
    return { preservedAsString: true, executed: false };
  }, cases);

  const cancelledStore = syntheticStore(resolvedModule), cancelBundle = await buildBundle(cancelledStore, contractApi.prepareOwnedLessonBundle), cancelRecord = recordApi.createLessonV2Record({ bundle: cancelBundle, content: content(cancelBundle), id: '3'.repeat(24) });
  const readsBefore = cancelledStore.reads(), controller = new AbortController(); controller.abort();
  await expect('aborted-read-stays-cancelled-before-storage', 'cancellation', 'rejected', () => recordApi.verifyLessonV2Record({ repository: cancelledStore.repository, ownerId, record: cancelRecord, signal: controller.signal }), cases);
  if (cancelledStore.reads() !== readsBefore) cases.push({ id: 'aborted-read-performs-no-repository-read', category: 'cancellation', expected: 'zero reads', actual: `${cancelledStore.reads() - readsBefore} reads`, outcome: 'fail', detail: null });
  else cases.push({ id: 'aborted-read-performs-no-repository-read', category: 'cancellation', expected: 'zero reads', actual: 'zero reads', outcome: 'pass', detail: null });

  const failed = cases.filter(item => item.outcome === 'fail').length;
  return { resultSchemaVersion: 1, evaluationId: 'bundle-security-eval-synthetic-pr48-v1', createdAt: new Date().toISOString(), synthetic: true,
    implementation: { suppliedBy: '--record-module', sha256: moduleSha256, moduleFile: 'lesson-v2/record.mjs' },
    environment: { providerCalls: 0, productionAccounts: 0, liveData: 0, fixtureSourceTextEvaluated: false },
    summary: { total: cases.length, passed: cases.length - failed, failed }, cases };
}

const cli = args(process.argv.slice(2));
if (cli.help) { process.stdout.write('Usage: node evaluate.mjs --record-module <absolute path to actual PR48 record.mjs> [--output <path>]\n'); process.exit(0); }
try {
  const result = await evaluate(cli.recordModule), serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (cli.output) { const output = resolve(cli.output); await mkdir(dirname(output), { recursive: true }); await writeFile(output, serialized, 'utf8'); }
  process.stdout.write(serialized);
  if (result.summary.failed) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`Evaluation could not run: ${error instanceof Error ? error.message : 'unknown error'}\n`);
  process.exitCode = 2;
}
