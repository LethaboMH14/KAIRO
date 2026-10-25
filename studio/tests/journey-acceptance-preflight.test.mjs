import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {journeyStages,viewports,accessChecks} from '../acceptance/journey-matrix.mjs';

const src = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const routeSource = () => src('StudioRouter.tsx');

test('synthetic journey inventory has unique, consecutive, traceable steps',()=>{
  assert.deepEqual(journeyStages.map(s=>s.id),Array.from({length:8},(_,i)=>`J${String(i+1).padStart(2,'0')}`));
  assert.equal(new Set(journeyStages.map(s=>s.id)).size,journeyStages.length);
  for(const step of journeyStages){
    assert.match(step.route,/^\/[a-z-]+$/);
    assert.ok(step.check.length>20);
    assert.ok(step.source.endsWith('.tsx'));
    assert.ok(step.marker.length>5);
  }
});

test('all journey destinations are actual app routes, not invented screenshots',()=>{
  const router=routeSource();
  for(const {route} of journeyStages){
    assert.ok(router.includes(`'${route}'`),`Missing route ${route}`);
  }
});

test('each acceptance marker exists in its real mounted component',()=>{
  for(const {id,source,marker} of journeyStages){
    assert.ok(src(source).includes(marker),`${id} missing ${source}: ${marker}`);
  }
});

test('caption/reduced-motion/escape alternatives and exported source working have source anchors',()=>{
  const classroom=src('source-classroom/SourceClassroom.tsx');
  for(const needle of ['kx-caption','Chapter text','Reduce motion','Stop','Reading view','ka-flow-tabs'])
    assert.ok(classroom.includes(needle),`Classroom alternative missing: ${needle}`);
  const panels=src('kairo/JourneyPanels.tsx');
  for(const needle of ['text/markdown;charset=utf-8','exportNotes(lesson,progress)','role="status"','source passages'])
    assert.ok(panels.toLowerCase().includes(needle.toLowerCase()),`Working export marker missing: ${needle}`);
});

test('mobile/tablet/desktop and accessibility obligations are represented, without a fake result',()=>{
  assert.deepEqual(viewports.map(p=>p.width),[360,430,768,1280]);
  assert.ok(accessChecks.some(c=>c.name.includes('200%')&&c.kind==='human-device'));
  assert.ok(accessChecks.some(c=>c.name.includes('Screen-reader')&&c.kind==='human-device'));
  assert.equal(new Set(accessChecks.map(c=>c.id)).size,accessChecks.length);
});

test('browser observation stays blocked unless separately authorized on isolated loopback',()=>{
  const script=new URL('../acceptance/journey-browser.mjs',import.meta.url);
  const run=spawnSync(process.execPath,[fileURLToPath(script)],{encoding:'utf8',timeout:10000,env:{...process.env,KAIRO_BROWSER_ACCEPTANCE_AUTHORIZED:'',KAIRO_ACCEPTANCE_ISOLATED_SERVER:'',KAIRO_ACCEPTANCE_BASE_URL:''}});
  assert.equal(run.status,78,run.stderr||run.error?.message);
  assert.match(run.stderr,/BLOCKED.*browser observation denied/);
  const content=readFileSync(script,'utf8');
  assert.doesNotMatch(content,/grantPermissions\(|getUserMedia\(|\.screenshot\(/);
  assert.match(content,/permissions:\s*\[\]/);
  assert.match(content,/127\.0\.0\.1/);
});
