import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const componentPath = path.join(studioRoot, 'src', 'teacher-access-ui', 'TeacherAccessPanel.tsx');
const canonicalStudioPackage = 'C:/Users/USER/Desktop/fnb app of year hackathon/studio/package.json';
const dependencyRequire = createRequire(canonicalStudioPackage);
const React = dependencyRequire('react');
const { renderToStaticMarkup } = dependencyRequire('react-dom/server');
const ts = dependencyRequire('typescript');

const source = await readFile(componentPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const componentModule = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputText)(dependencyRequire, componentModule, componentModule.exports);
const TeacherAccessPanel = componentModule.exports.default;

const baseProps = (overrides = {}) => ({
  choices: [
    { id: 'en', label: 'English', available: true },
    { id: 'zu', label: 'isiZulu', available: true },
    { id: 'sasl', label: 'South African Sign Language', available: false, reason: 'No signer-reviewed content is available for this lesson.' },
  ],
  selectedLanguage: 'en',
  captions: false,
  reducedMotion: false,
  busy: false,
  listeningAvailable: false,
  signContentAvailable: false,
  onLanguageChange() {},
  onCaptionsChange() {},
  onReducedMotionChange() {},
  onUseTyped() {},
  onClose() {},
  ...overrides,
});

function render(overrides) {
  return renderToStaticMarkup(React.createElement(TeacherAccessPanel, baseProps(overrides)));
}

test('renders controlled native language choices and truthful language, voice, caption and sign labels', () => {
  const html = render();
  assert.match(html, /<select[^>]+name="language"/);
  assert.match(html, /<option value="en" selected="">English<\/option>/);
  assert.match(html, /South African Sign Language — Not available: No signer-reviewed content is available for this lesson\./);
  assert.match(html, /Recorded-file listening is not available in this view\. No microphone is active\./);
  assert.match(html, /No sign-language translation has been validated\./);
  assert.match(html, /Captions off/);
  assert.match(html, /Read instead/);
  assert.match(html, /Type a question/);
});

test('language selection exposes unsupported and unknown selections as an error and keeps choice callbacks uninvoked during render', () => {
  let callbacks = 0;
  const html = render({
    selectedLanguage: 'sasl',
    onLanguageChange() { callbacks += 1; },
  });
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /No signer-reviewed content is available for this lesson\./);
  assert.equal(callbacks, 0);

  const unknown = render({ selectedLanguage: 'xx' });
  assert.match(unknown, /Choose a language marked available before changing this setting\./);
});

test('malformed duplicate choices fail closed and escape supplied labels and reasons as text', () => {
  const html = render({
    choices: [
      { id: 'en', label: '<script>name()</script>', available: true },
      { id: 'en', label: 'Duplicate', available: true },
      { id: 'fr', label: 'Français', available: false, reason: '<img src=x onerror=alert(1)>' },
    ],
    selectedLanguage: 'en',
  });
  assert.match(html, /Language choices could not be checked/);
  assert.match(html, /&lt;script&gt;name\(\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<script>name\(\)<\/script>/);
  assert.doesNotMatch(html, /<img src=x/);
});

test('busy gates language, captions, motion and typed callbacks while leaving close available', () => {
  const html = render({ busy: true });
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /<select[^>]+disabled=""/);
  assert.match(html, /Captions off<\/button>/);
  assert.match(html, /disabled=""[^>]*>Captions off/);
  assert.match(html, /disabled=""[^>]*>Read instead/);
  assert.match(html, /disabled=""[^>]*>Reduced motion off/);
  assert.match(html, /disabled=""[^>]*>Type a question/);
  assert.match(html, /aria-label="Close language and access settings">Close<\/button>/);
  assert.match(html, /You can still close this panel\./);
});

test('listening and signer-reviewed content labels only reflect the supplied capability flags', () => {
  const html = render({ listeningAvailable: true, signContentAvailable: true });
  assert.match(html, /Listening can use a recording you choose\. KAIRO does not listen continuously\./);
  assert.match(html, /Signer-reviewed sign content is available for this lesson\./);
  assert.doesNotMatch(html, /SASL translation is available/i);
});

test('reduced-motion styling is explicit and the panel does not own network, voice, microphone or storage APIs', () => {
  const html = render({ reducedMotion: true });
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(html, /Reduced motion on/);
  assert.doesNotMatch(source, /\bfetch\s*\(|speechSynthesis|mediaDevices|localStorage|sessionStorage/);
});

async function writeFixture() {
  const esbuild = dependencyRequire('esbuild');
  const componentImport = componentPath.replaceAll('\\', '/');
  const entry = `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import TeacherAccessPanel from ${JSON.stringify(componentImport)};
    function Fixture(){
      const [values,setValues]=useState({selectedLanguage:'en',captions:false,reducedMotion:false,closed:false,message:''});
      const [calls,setCalls]=useState([]);
      const record=(name,value)=>{setCalls(items=>[...items, {name,value}]);setValues(current=>({...current,...(name==='language'?{selectedLanguage:value}:name==='captions'?{captions:value}:name==='motion'?{reducedMotion:value}:name==='typed'?{message:'Typed question control selected'}:name==='close'?{closed:true}:{})}));};
      return <main><TeacherAccessPanel choices={[{id:'en',label:'English',available:true},{id:'zu',label:'isiZulu',available:true},{id:'xh',label:'isiXhosa with a deliberately long label for a narrow screen',available:true},{id:'sasl',label:'South African Sign Language',available:false,reason:'No signer-reviewed content is available for this lesson.'}]} selectedLanguage={values.selectedLanguage} captions={values.captions} reducedMotion={values.reducedMotion} busy={false} listeningAvailable={false} signContentAvailable={false} onLanguageChange={id=>record('language',id)} onCaptionsChange={v=>record('captions',v)} onReducedMotionChange={v=>record('motion',v)} onUseTyped={()=>record('typed',true)} onClose={()=>record('close',true)}/><output aria-live="polite">{values.message||calls.map(item=>item.name+':'+item.value).join(' | ')}</output>{values.closed&&<p>Panel closed callback received.</p>}</main>;
    }
    createRoot(document.getElementById('root')).render(<Fixture/>);
  `;
  const build = await esbuild.build({
    stdin: { contents: entry, resolveDir: studioRoot, sourcefile: 'teacher-access-fixture.tsx', loader: 'tsx' },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    write: false,
    nodePaths: [path.dirname(path.dirname(dependencyRequire.resolve('react')))],
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
  });
  const dirIndex = process.argv.indexOf('--fixture-dir');
  const dir = dirIndex >= 0 ? path.resolve(process.argv[dirIndex + 1]) : await mkdtemp(path.join(os.tmpdir(), 'kairo-teacher-access-'));
  await mkdir(dir, { recursive: true });
  const bundlePath = path.join(dir, 'app.js');
  const pagePath = path.join(dir, 'index.html');
  await writeFile(bundlePath, build.outputFiles[0].text, 'utf8');
  await writeFile(pagePath, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KAIRO access panel fixture</title></head><body><div id="root"></div><script src="./app.js"></script></body></html>', 'utf8');
  process.stdout.write(`TeacherAccessPanel synthetic browser fixture: ${pagePath}\n`);
  return pagePath;
}

if (process.argv.includes('--write-fixture')) await writeFixture();
