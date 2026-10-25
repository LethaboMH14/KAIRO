import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server, OriginalMaterial, helpers;
test('load the actual original viewer through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const module = await server.ssrLoadModule('/src/original-material-ui/OriginalMaterial.tsx');
    OriginalMaterial = module.default;
    helpers = module;
  } catch (error) { await server.close(); throw error; }
});

const render = props => renderToStaticMarkup(React.createElement(OriginalMaterial, props));

test('retained PDF waits for an explicit open action before exposing page rendering', () => {
  const html = render({ sourceId: 'a'.repeat(24), section: 1, original: { kind: 'pdf', name: 'course.pdf' } });
  assert.match(html, /Open original page/);
  assert.doesNotMatch(html, /<canvas|<img|<iframe|src=/i);
});

test('retained image stays unloaded before an explicit open action', () => {
  const before = render({ sourceId: 'b'.repeat(24), section: 0, original: { kind: 'image', name: 'lab-photo.png' } });
  const after = render({ sourceId: 'b'.repeat(24), section: 0, original: { kind: 'image', name: '<photo>.png' } });
  assert.match(before, /Show original image/);
  assert.doesNotMatch(before, /<img|src=/i);
  assert.match(after, /Show original image/);
  assert.doesNotMatch(after, /<img|src=/i);
});

test('download-only originals explain that page preview is unavailable and never render inline', () => {
  const html = render({ sourceId: 'c'.repeat(24), section: 0, original: { kind: 'download', name: 'lecture.docx' } });
  assert.match(html, /Show download option/);
  assert.doesNotMatch(html, /lecture\.docx|<a\b|<iframe/i);
  const shown = render({ sourceId: 'c'.repeat(24), section: 0, original: null });
  assert.match(shown, /No saved original is available/);
});

test('missing original and invalid source IDs return honest, noninteractive states', () => {
  assert.match(render({ sourceId: 'd'.repeat(24), section: 0, original: null }), /No saved original is available/);
  const invalid = render({ sourceId: '../unsafe', section: 0, original: { kind: 'pdf', name: 'x.pdf' } });
  assert.match(invalid, /Original comparison is unavailable for this source/);
  assert.doesNotMatch(invalid, /<button|href=/);
});

test('source URLs and section/page mapping accept only bounded native IDs and first four sections', () => {
  assert.equal(helpers.isOriginalSourceId('a'.repeat(24)), true);
  assert.equal(helpers.isOriginalSourceId('g'.repeat(24)), false);
  assert.equal(helpers.originalEndpoint('a'.repeat(24)), `/api/workspace/source/${'a'.repeat(24)}/original`);
  assert.equal(helpers.originalEndpoint('../a'), null);
  assert.equal(helpers.sectionToOriginalPage(0), 1);
  assert.equal(helpers.sectionToOriginalPage(3), 4);
  assert.equal(helpers.sectionToOriginalPage(4), 4);
  assert.equal(helpers.sectionToOriginalPage(-1), 1);
  assert.equal(helpers.originalPageLimit(9), 4);
  assert.equal(helpers.originalPageLimit(0), 0);
  assert.equal(helpers.boundOriginalPage(0, 3), 1);
  assert.equal(helpers.boundOriginalPage(9, 3), 3);
});

test('PDF canvas dimensions are capped before allocation, including hostile page sizes', () => {
  const size = helpers.boundedPdfCanvasSize(900_000, 10_000_000, 700);
  assert.ok(size.width <= helpers.MAX_PDF_CANVAS_DIMENSION);
  assert.ok(size.height <= helpers.MAX_PDF_CANVAS_DIMENSION);
  assert.ok(size.width * size.height <= helpers.MAX_PDF_CANVAS_PIXELS);
  assert.throws(() => helpers.boundedPdfCanvasSize(Infinity, 100, 700), /invalid dimensions/);
});

test('PDF and image original loads use only the fixed same-origin URL with a mocked fetcher', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': calls.length === 1 ? 'application/pdf' : 'image/png' } });
  };
  const pdf = await helpers.fetchOriginalAsset('e'.repeat(24), 'pdf', { fetcher });
  const image = await helpers.fetchOriginalAsset('e'.repeat(24), 'image', { fetcher });
  assert.equal(pdf.kind, 'pdf');
  assert.equal(pdf.bytes.byteLength, 3);
  assert.equal(image.kind, 'image');
  assert.equal(image.blob.type, 'image/png');
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.url, `/api/workspace/source/${'e'.repeat(24)}/original`);
    assert.equal(call.init.credentials, 'same-origin');
    assert.equal(call.init.cache, 'no-store');
    assert.equal(call.init.redirect, 'error');
  }
});

test('invalid IDs, errors and wrong media types never become renderable assets', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return new Response('not a pdf', { status: 200, headers: { 'content-type': 'text/html' } }); };
  await assert.rejects(helpers.fetchOriginalAsset('../secret', 'pdf', { fetcher }), /unavailable for this source/);
  assert.equal(calls, 0);
  await assert.rejects(helpers.fetchOriginalAsset('f'.repeat(24), 'pdf', { fetcher }), /not a supported original page/);
  await assert.rejects(helpers.fetchOriginalAsset('f'.repeat(24), 'image', { fetcher }), /not a supported original page/);
  const notFound = async () => new Response('missing', { status: 404, headers: { 'content-type': 'application/json' } });
  await assert.rejects(helpers.fetchOriginalAsset('f'.repeat(24), 'pdf', { fetcher: notFound }), /could not be loaded/);
});

test('PDF rendering disables eval, shows at most first four pages, and disposes render/loading tasks', async () => {
  let options, renderedPage, renderCancelled = false, documentDestroyed = 0, loadingDestroyed = 0;
  const context = { clearRect() {}, setTransform() {} };
  const canvas = { width: 0, height: 0, parentElement: { clientWidth: 700 }, getContext: () => context };
  const page = { getViewport: ({ scale }) => ({ width: 500 * scale, height: 700 * scale }), render: () => ({ promise: Promise.resolve(), cancel() { renderCancelled = true; } }) };
  const document = { numPages: 12, async getPage(number) { renderedPage = number; return page; } };
  const loadingTask = { promise: Promise.resolve(document), async destroy() { loadingDestroyed++; } };
  const loader = async () => ({ getDocument(value) { options = value; return loadingTask; } });
  const session = helpers.createPdfPageSession(new Uint8Array([4, 5]).buffer, 9, canvas, loader);
  assert.deepEqual(await session.ready, { pageCount: 4, pageNumber: 4 });
  assert.equal(options.isEvalSupported, false);
  assert.ok(options.data instanceof Uint8Array);
  assert.equal(renderedPage, 4);
  assert.equal(canvas.width, 700);
  session.dispose();
  assert.equal(renderCancelled, true);
  assert.equal(documentDestroyed, 0);
  assert.equal(loadingDestroyed, 1);
});

test('PDF session destroys the loading task when cancelled before its document resolves', async () => {
  let resolveDocument, loadingDestroyed = 0, documentDestroyed = 0, renders = 0;
  const canvas = { width: 0, height: 0, getContext: () => ({ clearRect() {} }) };
  const documentPromise = new Promise(resolve => { resolveDocument = resolve; });
  const loadingTask = { promise: documentPromise, async destroy() { loadingDestroyed++; } };
  const session = helpers.createPdfPageSession(new ArrayBuffer(4), 1, canvas, async () => ({ getDocument() { return loadingTask; } }));
  await Promise.resolve();
  session.dispose();
  resolveDocument({ numPages: 1, async getPage() { renders++; return null; } });
  assert.equal(await session.ready, null);
  assert.equal(loadingDestroyed, 1);
  assert.equal(documentDestroyed, 0);
  assert.equal(renders, 0);
});

test('close SSR server', async () => { await server.close(); server = undefined; });
