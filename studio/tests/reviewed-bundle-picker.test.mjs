import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
let server,Picker,parseCatalog,requestPreview,EvidencePreview;
const ids=['a'.repeat(24),'b'.repeat(24)];
const rev=['1'.repeat(64),'2'.repeat(64)];
const source=(i,extra={})=>({
  id:ids[i],title:'Synthetic reviewed motor notes '+i,reviewed:true,
  reviewedSectionCount:2,revision:rev[i],...extra
});
const catalog=(values=[source(0),source(1)])=>({
  reviewedSourcesVersion:1,reviewedSources:values,
  reviewedSourcesPage:{limit:100,returned:values.length,possiblyTruncated:false},
});
before(async()=>{
  server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),
    configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});
  try{const ui=await server.ssrLoadModule('/src/source-selection/ReviewedBundlePicker.tsx');
    Picker=ui.default;parseCatalog=ui.parseReviewedCatalog;
    requestPreview=ui.requestLocalBundlePreview;EvidencePreview=ui.BundleEvidencePreview;
  }catch(error){await server.close();throw error;}
});
after(async()=>{await server?.close();});
const html=(props={})=>renderToStaticMarkup(React.createElement(Picker,{catalog:catalog(),...props}));
const choice=i=>({sourceId:ids[i],revision:rev[i],title:'Synthetic reviewed motor notes '+i});
const preview=(quote='A correct synthetic passage about electric motor speed.')=>({
  schemaVersion:2,kind:'reviewed-evidence-preview',bundleRevision:'a'.repeat(64),
  sourceRefs:[{sourceId:ids[0],revision:rev[0]}],
  evidence:[{id:ids[0]+'-'+rev[0].slice(0,12)+'-S1-0',
    sourceId:ids[0],sourceRevision:rev[0],title:'Motor study',locator:'Synthetic page 1',
    quote,start:0,end:quote.length,edited:false}],
  selection:{method:'multi-source-lexical',semantic:false,selectedCharacters:quote.length},
  notice:'This is a private excerpt preview, not a generated or saved lesson.',
});
const json=v=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
test('SSR makes source selection readable and keyboard-native with explicit preview-only meaning',()=>{
  const out=html();
  assert.match(out,/Choose reviewed study sources/);
  assert.match(out,/<fieldset/);
  assert.match(out,/<legend>Reviewed sources \(0 of 8 selected\)<\/legend>/);
  assert.equal((out.match(/type="checkbox"/g)||[]).length,2);
  assert.match(out,/What do you want to understand\?/);
  assert.match(out,/role="status"/);
  assert.match(out,/No provider call or lesson save occurs here/);
  assert.match(out,/disabled=""[^>]*>Preview private passages/);
  assert.doesNotMatch(out,/<script|<iframe/);
});
test('loading, empty, error, and untrusted catalog do not offer a submit or model call',()=>{
  assert.match(html({loading:true}),/Loading reviewed material/);
  assert.match(html({catalog:catalog([])}),/No reviewed sources yet/);
  assert.match(html({catalog:null}),/Reviewed material status is unavailable/);
  assert.match(html({error:'Private source list could not load'}),/role="alert"/);
  assert.match(html({catalog:{reviewedSourcesVersion:1,reviewedSources:[source(0),source(0)]}}),/status is unavailable/);
});
test('catalog refuses false reviews, revoked entries, malformed counts and duplicate IDs',()=>{
  for(const items of [[source(0,{reviewed:false})],[source(0,{revoked:true})],
    [source(0,{deleted:true})],[source(0,{reviewedSectionCount:0})],
    [source(0,{revision:'unsafe'})],[source(0),source(0)]])
    assert.equal(parseCatalog(catalog(items)),null);
  assert.equal(parseCatalog(catalog([])).length,0);
  assert.equal(parseCatalog(catalog()).length,2);
  assert.equal(parseCatalog({...catalog(),reviewedSourcesPage:{limit:100,returned:1,possiblyTruncated:false}}),null);
});
test('HTML-looking source text is escaped by actual React SSR output',()=>{
  const bad=source(0,{title:'<script>alert(1)</script>'});
  const out=html({catalog:catalog([bad])});
  assert.match(out,/&lt;script&gt;/);
  assert.doesNotMatch(out,/<script>/);
});
test('preview submits only ordered revision refs, local mode, and explicit goal',async()=>{
  let url,options;
  const fetchMock=async(u,init)=>{url=u;options=init;return json(preview());};
  const result=await requestPreview([choice(0)],[source(0)],'Explain a motor',fetchMock);
  assert.equal(url,'/api/workspace/bundle-preview');
  const body=JSON.parse(options.body);
  assert.deepEqual(body,{schemaVersion:2,mode:'local',
    sourceRefs:[{sourceId:ids[0],revision:rev[0]}],goal:'Explain a motor'});
  assert.equal(options.credentials,'same-origin');
  assert.equal(options.cache,'no-store');
  assert.equal(result.kind,'reviewed-evidence-preview');
  assert.equal(options.body.includes('Synthetic reviewed motor notes'),false);
  assert.equal('consent' in body,false);
  assert.equal('provider' in body,false);
});
test('preview blocks selection changed or unsupported cloud payload before network',async()=>{
  let calls=0;const fake=async()=>{calls++;return json(preview());};
  await assert.rejects(requestPreview([choice(0)],[source(0,{revision:rev[1]})],'',fake),/changed/);
  await assert.rejects(requestPreview([choice(0)],[source(0)],'x'.repeat(1001),fake),/1,000/);
  assert.equal(calls,0);
});
test('preview rejects wrong-source citations, malformed anchors and invented saved lesson status',async()=>{
  for(const bad of [
    {...preview(),sourceRefs:[{sourceId:ids[1],revision:rev[1]}]},
    {...preview(),kind:'generated-lesson'},
    {...preview(),evidence:[{...preview().evidence[0],sourceRevision:rev[1]}]},
    {...preview(),selection:{method:'multi-source-lexical',semantic:false,selectedCharacters:4000}},
  ])await assert.rejects(requestPreview([choice(0)],[source(0)],'',async()=>json(bad)),/invalid source references/);
});
test('server errors are converted to clear privacy-safe guidance',async()=>{
  const unauth=()=>new Response(JSON.stringify({error:'private internal account identifier'}),{status:403});
  await assert.rejects(requestPreview([choice(0)],[source(0)],'',unauth),/Sign in/);
  const stale=()=>new Response('{}',{status:409});
  await assert.rejects(requestPreview([choice(0)],[source(0)],'',stale),/revision changed/);
});
test('a rejected cancelled request preserves cancellation signal and cannot report success',async()=>{
  const ctrl=new AbortController();ctrl.abort();
  const fake=async(_url,init)=>{if(init.signal.aborted)throw new DOMException('Aborted','AbortError');return json(preview());};
  await assert.rejects(requestPreview([choice(0)],[source(0)],'',fake,ctrl.signal),/Aborted/);
});
test('actual React SSR shows literal excerpts rather than executing embedded markup',()=>{
  const malicious=preview('<img src=x onerror=alert(1)>');
  malicious.evidence[0].end=malicious.evidence[0].quote.length;
  malicious.selection.selectedCharacters=malicious.evidence[0].quote.length;
  const markup=renderToStaticMarkup(React.createElement(EvidencePreview,{preview:malicious}));
  assert.match(markup,/&lt;img/);
  assert.doesNotMatch(markup,/<img/);
  assert.match(markup,/not a generated or saved lesson/);
});
