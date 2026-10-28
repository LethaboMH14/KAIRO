import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const modulePath = '/src/prepared-clip-ui/PreparedClipPlayer.tsx';
const workerManifestPath = new URL('../../tools/concept-clip-20261026/artifacts/motor-field-speed-v1-b84477959e869ac7ddad.manifest.json', import.meta.url);
let viteServer;
let loaded;
let preparedInput;

async function setup() {
  if (!loaded) {
    viteServer = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    const module = await viteServer.ssrLoadModule(modulePath);
    const manifestBytes = await readFile(workerManifestPath);
    preparedInput = {
      manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
      manifest: JSON.parse(manifestBytes.toString('utf8')),
    };
    loaded = { ...module, resetModule: await viteServer.ssrLoadModule('/src/prepared-clip-ui/preparedClipManifest.ts') };
  }
  return loaded;
}

after(async () => { await viteServer?.close(); });

test('locks the exact worker manifest, corrected sources, and silent renderer', async () => {
  const { resetModule } = await setup();
  assert.equal(resetModule.isReviewedPreparedClip(preparedInput), true);
  assert.deepEqual(resetModule.preparedClipPaths(preparedInput, 'https://kairo.example'), {
    video: '/media/explainers/motor-field-speed-v1-b84477959e869ac7ddad.mp4',
    poster: '/media/explainers/motor-field-speed-v1-b84477959e869ac7ddad.png',
    captions: '/media/explainers/motor-field-speed-v1-b84477959e869ac7ddad.vtt',
  });
});

test('rejects stale source references, mismatched revisions, media hashes, and audio-bearing variants', async () => {
  const { resetModule } = await setup();
  const tamper = (change) => {
    const candidate = structuredClone(preparedInput);
    change(candidate);
    return candidate;
  };
  const mutations = [
    tamper((candidate) => { candidate.manifestSha256 = '0'.repeat(64); }),
    tamper((candidate) => { candidate.manifest.sourceReferences[0].url = 'https://example.org/other.pdf'; }),
    tamper((candidate) => { candidate.manifest.sourceReferences[0] = null; }),
    tamper((candidate) => { candidate.manifest.sourceRevisions[1].sha256 = '0'.repeat(64); }),
    tamper((candidate) => { candidate.manifest.artifactSha256 = '0'.repeat(64); }),
    tamper((candidate) => { candidate.manifest.renderer.audioTracks = 1; }),
    tamper((candidate) => { candidate.manifest.sourceReferences = 'not-an-array'; }),
  ];
  for (const candidate of mutations) assert.equal(resetModule.isReviewedPreparedClip(candidate), false);
});

test('allows only fixed root-relative same-origin video, poster, and VTT paths', async () => {
  const { resetModule } = await setup();
  const allowed = '/media/explainers/motor-field-speed-v1-b84477959e869ac7ddad.mp4';
  assert.equal(resetModule.isApprovedSameOriginPath(allowed, 'https://kairo.example'), true);
  for (const path of [
    'https://attacker.example/clip.mp4',
    '//attacker.example/clip.mp4',
    '/media/explainers/motor-field-speed.mp4',
    `${allowed}?download=1`,
    `${allowed}#fragment`,
    'javascript:alert(1)',
  ]) assert.equal(resetModule.isApprovedSameOriginPath(path, 'https://kairo.example'), false, path);
});

test('renders native silent controls, lazy preload, poster, VTT track, and no autoplay', async () => {
  const { default: PreparedClipPlayer } = await setup();
  const html = renderToStaticMarkup(React.createElement(PreparedClipPlayer, {
    manifest: preparedInput,
    onPlaybackRequested() {},
  }));
  assert.match(html, /<video[^>]*controls=""/);
  assert.match(html, /muted=""/);
  assert.match(html, /playsInline=""/);
  assert.match(html, /preload="none"/);
  assert.match(html, /poster="\/media\/explainers\/motor-field-speed-v1-b84477959e869ac7ddad\.png"/);
  assert.match(html, /src="\/media\/explainers\/motor-field-speed-v1-b84477959e869ac7ddad\.mp4"/);
  assert.match(html, /kind="captions"[^>]*src="\/media\/explainers\/motor-field-speed-v1-b84477959e869ac7ddad\.vtt"/);
  assert.doesNotMatch(html, /autoplay=/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /This shows calculated rotating-field speed/);
  assert.match(html, /Read the clip captions/);
});

test('an invalid source lock fails closed with lesson text instead of media', async () => {
  const { default: PreparedClipPlayer } = await setup();
  const invalid = structuredClone(preparedInput);
  invalid.manifest.sourcePackSha256 = '0'.repeat(64);
  const html = renderToStaticMarkup(React.createElement(PreparedClipPlayer, {
    manifest: invalid,
    onPlaybackRequested() {},
  }));
  assert.match(html, /reviewed source or media record did not match/);
  assert.match(html, /motor explanation remains available in the lesson text/);
  assert.doesNotMatch(html, /<video/);
});

test('resets media on cleanup and invokes the host callback from native play', async () => {
  const { default: PreparedClipPlayer, notifyHostPlaybackRequested, resetPreparedVideo } = await setup();
  const calls = [];
  const fakeTrack = { removeAttribute: (name) => calls.push(`track.remove:${name}`) };
  const video = {
    pause: () => calls.push('pause'),
    currentTime: 7.5,
    removeAttribute: (name) => calls.push(`video.remove:${name}`),
    querySelectorAll: () => [fakeTrack],
    load: () => calls.push('load'),
  };
  resetPreparedVideo(video);
  assert.equal(video.currentTime, 0);
  assert.deepEqual(calls, ['pause', 'video.remove:src', 'track.remove:src', 'load']);

  const source = await readFile(new URL('../src/prepared-clip-ui/PreparedClipPlayer.tsx', import.meta.url), 'utf8');
  assert.match(source, /useEffect\(\(\) => \(\) => resetPreparedVideo\(videoRef\.current\)/);
  assert.match(source, /<ReviewedVideo key=\{sourceIdentity\}/);
  assert.match(source, /onPlay=\{handlePlay\}/);
  assert.match(source, /onPlaybackRequested\(\);/);
  let hostCallbackCalls = 0;
  notifyHostPlaybackRequested(() => { hostCallbackCalls += 1; });
  assert.equal(hostCallbackCalls, 1);
  const html = renderToStaticMarkup(React.createElement(PreparedClipPlayer, { manifest: preparedInput, onPlaybackRequested() {} }));
  assert.doesNotMatch(html, /TeacherProvider|useTeacher|speechSynthesis/);
});
