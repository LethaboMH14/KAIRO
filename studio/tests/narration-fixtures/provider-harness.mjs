import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';

const providerFile = fileURLToPath(new URL('../../src/teacher/TeacherProvider.tsx', import.meta.url));
const reactShimId = '\0narration-react-shim';

const reactShim = `
const h=()=>globalThis.__teacherHarness;
export function createContext(){return {Provider:Symbol('provider')}}
export function useContext(){return h().provided}
export function useState(initial){return h().useState(initial)}
export function useRef(initial){return h().useRef(initial)}
export function useEffect(effect,deps){return h().useEffect(effect,deps)}
export const Fragment=Symbol('fragment');
export function createElement(type,props,...children){if(type&&typeof type==='symbol'&&String(type)==='Symbol(provider)')globalThis.__teacherHarness.provided=props.value;return {type,props,children}}
`;

export async function loadActualTeacherProvider() {
  const server = await createServer({
    configFile: false,
    root: path.resolve(path.dirname(providerFile), '../..'),
    appType: 'custom',
    server: { middlewareMode: true, ws: false },
    esbuild: { jsx: 'transform', jsxFactory: 'createElement', jsxFragment: 'Fragment' },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{
      name: 'narration-provider-hook-adapter',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === 'narration-react-shim') return reactShimId;
      },
      load(id) {
        if (id === reactShimId) return reactShim;
      },
      transform(code, id) {
        if (id.split('?')[0].replaceAll('\\', '/').endsWith('/src/teacher/TeacherProvider.tsx')) return `import {createElement,Fragment} from 'narration-react-shim';\n${code.replace("from 'react'", "from 'narration-react-shim'")}`;
      }
    }]
  });
  try {
    const mod = await server.ssrLoadModule(providerFile);
    return { Provider: mod.default, close: () => server.close() };
  } catch (error) {
    await server.close();
    throw error;
  }
}

export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
  }
}

export function createProviderHarness(Provider) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let effectCursor = 0;
  const harness = {
    provided: null,
    value: null,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = effects[index];
      const changed = !previous || !deps || deps.some((v, i) => !Object.is(v, previous.deps?.[i]));
      if (changed) effects[index] = { effect, deps, pending: true, cleanup: previous?.cleanup };
    },
    render() {
      cursor = 0;
      harness.provided = null;
      Provider({ children: null });
      harness.value = harness.provided;
      for (effectCursor = 0; effectCursor < effects.length; effectCursor++) {
        const entry = effects[effectCursor];
        if (entry?.pending) {
          entry.pending = false;
          entry.cleanup = entry.effect();
        }
      }
      if (!harness.value) throw new Error('Provider context value was not captured.');
      return harness.value;
    },
    cleanup() {
      for (const entry of [...effects].reverse()) entry?.cleanup?.();
      effects.length = 0;
    }
  };
  globalThis.__teacherHarness = harness;
  harness.render();
  return harness;
}

export function installMediaMocks() {
  const originals = new Map();
  const restore = key => {
    if (originals.has(key)) {
      const old = originals.get(key);
      if (old.exists) Object.defineProperty(globalThis, key, old.descriptor);
      else delete globalThis[key];
    }
  };
  const set = (key, value) => {
    originals.set(key, { exists: Object.hasOwn(globalThis, key), descriptor: Object.getOwnPropertyDescriptor(globalThis, key) });
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  const trace = { fetches: [], audios: [], urls: [], revoked: [], frames: new Set(), cancelledFrames: [], graphs: [], sources: [], analysers: [], playCalls: 0, nextPlayError: null, synthesis: null, events: new Map(), stored: new Map() };
  const speech = {
    voices: [{ name: 'Synthetic English', lang: 'en-ZA', voiceURI: 'en-ZA-test' }],
    utterances: [], cancelCount: 0, pauseCount: 0, resumeCount: 0, listeners: new Map(),
    getVoices() { return this.voices; },
    speak(utterance) { this.utterances.push(utterance); },
    cancel() { this.cancelCount++; }, pause() { this.pauseCount++; }, resume() { this.resumeCount++; },
    addEventListener(type, fn) { this.listeners.set(type, fn); }, removeEventListener(type) { this.listeners.delete(type); }
  };
  trace.synthesis = speech;
  class Utterance { constructor(text) { this.text = text; this.voice = null; this.lang = ''; this.rate = 1; this.onstart = this.onend = this.onerror = null; } }
  class FakeAudio {
    constructor(src) { this.src = src; this.paused = true; this.currentTime = 0; this.duration = 3; this.playbackRate = 1; this.preservesPitch = false; this.onended = this.onerror = this.onplaying = null; this.pauseCount = 0; trace.audios.push(this); }
    play() { trace.playCalls++; if (trace.nextPlayError) { const error=trace.nextPlayError; trace.nextPlayError=null; return Promise.reject(error); } this.paused = false; this.onplaying?.(); return Promise.resolve(); }
    pause() { this.paused = true; this.pauseCount++; }
  }
  class FakeAudioContext {
    constructor() { this.destination = {}; this.resumeDeferred = trace.nextResumeDeferred || null; trace.nextResumeDeferred = null; this.closeCount = 0; trace.graphs.push(this); }
    resume() { return this.resumeDeferred ? this.resumeDeferred.promise : Promise.resolve(); }
    close() { this.closeCount++; return Promise.resolve(); }
    createMediaElementSource() { const source={ connect() {}, disconnect() { this.disconnected = true; } }; trace.sources.push(source); return source; }
    createAnalyser() { const analyser={ fftSize: 256, connect() {}, disconnect() { this.disconnected = true; }, getByteTimeDomainData(a) { a.fill(128); } }; trace.analysers.push(analyser); return analyser; }
  }
  const windowMock = {
    speechSynthesis: speech,
    addEventListener(type, fn) { trace.events.set(type, fn); },
    removeEventListener(type) { trace.events.delete(type); }
  };
  const storage = { getItem(key) { return trace.stored.get(key) ?? null; }, setItem(key, value) { trace.stored.set(key, value); } };
  set('window', windowMock); set('speechSynthesis', speech); set('SpeechSynthesisUtterance', Utterance); set('Audio', FakeAudio); set('AudioContext', FakeAudioContext); set('localStorage', storage);
  const url = globalThis.URL;
  originals.set('URL.createObjectURL', { exists: Object.hasOwn(url, 'createObjectURL'), descriptor: Object.getOwnPropertyDescriptor(url, 'createObjectURL') });
  originals.set('URL.revokeObjectURL', { exists: Object.hasOwn(url, 'revokeObjectURL'), descriptor: Object.getOwnPropertyDescriptor(url, 'revokeObjectURL') });
  Object.defineProperty(url, 'createObjectURL', { configurable: true, value: blob => { const value = `blob:test-${trace.urls.length + 1}`; trace.urls.push({ blob, value }); return value; } });
  Object.defineProperty(url, 'revokeObjectURL', { configurable: true, value: value => trace.revoked.push(value) });
  set('requestAnimationFrame', fn => { const id = trace.frames.size + 1; trace.frames.add(id); trace.frameCallback = fn; return id; });
  set('cancelAnimationFrame', id => { trace.frames.delete(id); trace.cancelledFrames.push(id); });
  set('fetch', async (...args) => { trace.fetches.push(args); throw new Error(`Unexpected fetch URL: ${args[0]}`); });
  return {
    trace, speech, restore() { for (const key of ['window','speechSynthesis','SpeechSynthesisUtterance','Audio','AudioContext','localStorage','requestAnimationFrame','cancelAnimationFrame','fetch']) restore(key); for (const key of ['URL.createObjectURL','URL.revokeObjectURL']) { const old=originals.get(key); if(old.exists)Object.defineProperty(url,key,old.descriptor);else delete url[key.split('.')[1]]; } delete globalThis.__teacherHarness; }
  };
}

export function settings(overrides = {}) {
  return { version: 1, look: 'soft3d', voiceURI: '', language: 'en-ZA', rate: 0.94, voiceMode: 'browser', cloudVoice: 'en-GB-Chirp3-HD-Aoede', cloudConsent: false, ...overrides };
}

