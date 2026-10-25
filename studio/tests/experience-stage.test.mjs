import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {BOARD,RECORD,WORK,boardAnchorFor,boardLocal,boardNumbers,boardWorld,lineLength,pointAnchorFor,resultAnchor,shelfTarget,targetsFor} from '../src/experience/stage/board.ts';
import {PRESENT_HOLD,REACH_TIMEOUT,advanceWriting,startWriting,writeDuration} from '../src/experience/stage/writing.ts';
import {direct,framingFor,speaking} from '../src/experience/stage/direction.ts';
import {FrameBudget,TIERS,fitFov,initialTier,lowerTier} from '../src/experience/stage/quality.ts';
import {chooseArt,symbolInkPx} from '../src/experience/brand/art.ts';
import {LOCKUP_HORIZONTAL,LOCKUP_HORIZONTAL_MICRO,SYMBOL,SYMBOL_MICRO} from '../src/experience/brand/markArt.ts';
import {STOCK_LESSON} from '../src/experience/session.ts';

const root=fileURLToPath(new URL('../../',import.meta.url));
const sha=path=>createHash('sha256').update(readFileSync(root+path)).digest('hex');

test('board working lines are the authored formulas and introduce numbers only when written',()=>{
 assert.deepEqual(WORK.map(line=>line.map(t=>t.text).join(' ')),STOCK_LESSON.map(s=>s.formula));
 assert.deepEqual(boardNumbers(0),[20,12,9,22]);
 assert.deepEqual(boardNumbers(1),[20,12,32,9,22]);
 assert.deepEqual(boardNumbers(2),[20,12,32,9,23,22]);
 assert.deepEqual(boardNumbers(NaN),boardNumbers(0));
 assert.equal(boardAnchorFor(9,0),'record-9');
 assert.equal(boardAnchorFor(9,2),'work-2-9');
 assert.equal(boardAnchorFor(20,1),'work-1-20');
 assert.equal(boardAnchorFor(23,1),null,'the expected count is not on the board before it is calculated');
 assert.equal(pointAnchorFor(22,2),'shelf','the observed count is pointed at on the shelf itself');
 assert.deepEqual([0,1,2].map(resultAnchor),['work-0-20','work-1-32','work-2-23']);
 assert.ok(lineLength(1)>lineLength(0));
});

test('board anchors land on the board face, inside its outline, facing the class',()=>{
 const rects={'record-20':{u:.06,v:.2,w:.06,h:.06},'work-1-32':{u:.6,v:.6,w:.1,h:.09},'line-1':{u:.06,v:.6,w:.6,h:.09}};
 const targets=targetsFor(rects,[shelfTarget()]);
 assert.deepEqual(targets.map(t=>t.id),['line-1','record-20','work-1-32','shelf']);
 const [cx,cy,cz]=BOARD.centre,n=[Math.sin(BOARD.yaw),0,Math.cos(BOARD.yaw)];
 for(const t of targets.slice(0,3)){
  const d=[t.position[0]-cx,t.position[1]-cy,t.position[2]-cz];
  assert.ok(Math.abs(d[0]*n[0]+d[2]*n[2]-BOARD.lift)<1e-9,'lifted exactly off the board plane');
  assert.ok(Math.abs(d[1])<=BOARD.height/2&&Math.abs(-d[0]*n[2]+d[2]*n[0])<=BOARD.width/2+1e-9,'within the board outline');
  assert.ok(t.normal[2]>0.5,'faces the class');
 }
 assert.deepEqual(boardLocal(.5,.5),[0,0]);
 assert.equal(targets.find(t=>t.id==='line-1').position[0],boardWorld(...boardLocal(.06,.645)).position[0],'line anchors use their left edge');
 assert.ok(shelfTarget().position[0]<0,'the shelf is at Rain\'s right, away from the board');
});

test('writing waits for the fingertip, falls back after a timeout, then presents and returns control',()=>{
 let w=startWriting(1,1,lineLength(1),10,false);
 assert.equal(w.phase,'reach');
 w=advanceWriting(w,{type:'tick',now:10.5});
 assert.equal(w.phase,'reach');
 w=advanceWriting(w,{type:'landed',now:10.6});
 assert.equal(w.phase,'write');
 w=advanceWriting(w,{type:'tick',now:10.6+w.duration/2});
 assert.ok(w.reveal>0.45&&w.reveal<0.55);
 w=advanceWriting(w,{type:'tick',now:12+w.duration});
 assert.equal(w.phase,'present');
 w=advanceWriting(w,{type:'tick',now:12+w.duration+PRESENT_HOLD+0.01});
 assert.equal(w.phase,'done');
 assert.equal(w.reveal,1);
 const timedOut=advanceWriting(startWriting(2,2,5,0,false),{type:'tick',now:REACH_TIMEOUT});
 assert.equal(timedOut.phase,'write','a point that never lands does not block the lesson');
 const reduced=advanceWriting(startWriting(3,2,12,0,true),{type:'tick',now:0});
 assert.equal(reduced.phase,'present','reduced motion writes the line at once');
 const cut=advanceWriting(startWriting(4,1,9,0,false),{type:'interrupt'});
 assert.deepEqual([cut.phase,cut.reveal],['done',1]);
 assert.equal(writeDuration(0,true),0);
 assert.ok(writeDuration(500,false)<=1.6);
});

test('lesson events direct Rain without sign-language claims or lost context',()=>{
 const explain=direct({type:'explain',value:12,step:1},1);
 assert.deepEqual([explain.pose,explain.point,explain.highlight,explain.framing,explain.interrupts],['explain','work-1-12','work-1-12','board',true]);
 const shelf=direct({type:'explain',value:22,step:2},2);
 assert.deepEqual([shelf.point,shelf.highlight,shelf.framing],['shelf','record-22','room']);
 const stuck=direct({type:'stuck',step:1},3);
 assert.deepEqual([stuck.pose,stuck.expression,stuck.point,stuck.highlight],['acknowledge','neutral',null,'line-1']);
 assert.equal(direct({type:'step',step:2},4).interrupts,false,'the step direction must not cut its own writing short');
 assert.deepEqual([direct({type:'question',focused:true},5).pose,direct({type:'question',focused:true},5).expression],['listen','curious']);
 const wrong=direct({type:'answer',correct:false,step:0},6);
 assert.equal(wrong.point,'work-0-20');
 assert.equal(direct({type:'answer',correct:true,step:0},7).highlight,null,'no highlight for a number not yet on the board');
 const talking=speaking(explain,true,8);
 assert.deepEqual([talking.pose,talking.point,talking.interrupts],['explain','work-1-12',false]);
 const quiet=speaking(talking,false,9);
 assert.deepEqual([quiet.pose,quiet.point,quiet.highlight],['idle',null,'work-1-12']);
 assert.equal(framingFor(explain,false,true),'room','reduced motion keeps one fixed view');
 assert.equal(framingFor(stuck,true,false),'board');
 assert.notEqual(direct({type:'enter'},1).id,direct({type:'enter'},2).id);
});

test('quality tiers start from device hints and only step down on sustained slow frames',()=>{
 assert.equal(initialTier({saveData:true,deviceMemory:16,cores:16}),'light');
 assert.equal(initialTier({deviceMemory:2,cores:8}),'light');
 assert.equal(initialTier({coarsePointer:true,width:390,deviceMemory:4,cores:8}),'balanced');
 assert.equal(initialTier({deviceMemory:8,cores:8}),'full');
 assert.equal(initialTier({}),'balanced');
 assert.deepEqual(['full','balanced','light'].map(lowerTier),['balanced','light','light']);
 assert.equal(TIERS.light.shadows,false);
 assert.equal(TIERS.light.environment,false);
 const fast=new FrameBudget(1,2,34);let flagged=false;
 for(let i=0;i<400;i++)flagged=fast.push(1/60)||flagged;
 assert.equal(flagged,false);
 const slow=new FrameBudget(1,2,34);let hits=0;
 for(let i=0;i<200;i++)if(slow.push(1/20))hits++;
 assert.ok(hits>=2,'50 ms frames are reported once per window after warm-up');
 const crawl=new FrameBudget(1,2,34);let crawlHits=0;
 for(let i=0;i<80;i++)if(crawl.push(0.1))crawlHits++;
 assert.ok(crawlHits>=2,'a 10 fps device is still reported');
 const throttled=new FrameBudget(1,2,34);let falseHits=0;
 for(let i=0;i<120;i++)if(throttled.push(i%3===0?1/60:1.0))falseHits++;
 assert.equal(falseHits,0,'background throttling or a minimised window never lowers the tier');
 const paused=new FrameBudget(1,2,34);let pausedHits=0;
 for(let i=0;i<40;i++)if(paused.push(0.02))pausedHits++;
 for(let i=0;i<30;i++){paused.reset();if(paused.push(0.15))pausedHits++;}
 assert.equal(pausedHits,0,'a reset (focus lost) discards the partial window');
 assert.equal(fitFov(34,1.8),34);
 assert.ok(fitFov(34,0.5)>fitFov(34,1),'narrow screens widen the view');
});

test('app mark data is the exported master and switches to micro art below 32 px',()=>{
 for(const [art,file] of [[SYMBOL,'kairo-symbol'],[SYMBOL_MICRO,'kairo-symbol-micro'],[LOCKUP_HORIZONTAL,'kairo-lockup-horizontal'],[LOCKUP_HORIZONTAL_MICRO,'kairo-lockup-horizontal-micro']]){
  const path=`design/brand-master-20261023/master/${file}.svg`;
  assert.equal(art.source,path);
  assert.equal(art.sha256,sha(path),`${file} matches its master file`);
  assert.ok(readFileSync(root+path,'utf8').includes(`d="${art.d}"`));
 }
 assert.equal(chooseArt('symbol',48),SYMBOL);
 assert.equal(chooseArt('symbol',40),SYMBOL_MICRO,'a 40 px box holds a 29 px symbol');
 assert.equal(chooseArt('lockup',34),LOCKUP_HORIZONTAL_MICRO,'the sidebar lockup uses the micro symbol');
 assert.equal(chooseArt('lockup',64),LOCKUP_HORIZONTAL);
 assert.ok(Math.abs(symbolInkPx('lockup',60)-35)<0.1);
});

test('Rain shirt badge patch is pinned to the shipped teacher GLB and is well formed',()=>{
 const patch=JSON.parse(readFileSync(root+'studio/src/experience/stage/rainBadge.json','utf8'));
 assert.equal(patch.asset.sha256,sha('studio/public/models/character/kairo-teacher.glb'),'regenerate rainBadge.json when the teacher GLB changes');
 const vertices=patch.positionsRaw.length/3;
 assert.equal(vertices,81);
 assert.equal(patch.uvs.length,vertices*2);
 assert.equal(patch.skinIndex.length,vertices*4);
 assert.ok(patch.indices.every(i=>Number.isInteger(i)&&i>=0&&i<vertices));
 for(let v=0;v<vertices;v++){const w=patch.skinWeight.slice(v*4,v*4+4);assert.ok(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-3);}
 const used=new Set(patch.skinIndex.filter((_,i)=>patch.skinWeight[i]>0).map(i=>patch.jointNames[i]));
 assert.ok(used.has('clavicle_l')&&used.has('spine_03'),'follows the chest and left clavicle like the shirt');
 assert.ok(patch.checks.restSkinMatrixSpread<1e-4);
 assert.equal(patch.meshName,'Teacher_Shirt');
});

test('record on the board matches the lesson source values',()=>{
 assert.deepEqual(RECORD.map(r=>r.value),[20,12,9,22]);
 assert.equal(20+12-9,23);
});

test('Rain badge mesh is the master outline laid opaquely on the chest patch in true proportion',async()=>{
 const {badgeData,pathRings}=await import('../src/experience/stage/badgeMesh.ts');
 const patch=JSON.parse(readFileSync(root+'studio/src/experience/stage/rainBadge.json','utf8'));
 const rings=pathRings(SYMBOL.d);
 assert.equal(rings.length,2,'two strokes: the looped stem with the lower leg, and the upper arm');
 const data=badgeData(rings,SYMBOL.ink,patch);
 const n=data.positions.length/3;
 assert.ok(data.index.length>=3*(n-4),'every ring is triangulated');
 assert.ok(data.index.every(i=>i>=0&&i<n));
 for(let v=0;v<n;v++){const w=Array.from(data.skinWeight.slice(v*4,v*4+4));assert.ok(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-5);}
 // Positions stay inside the patch's raw-space bounds (bilinear blends never extrapolate).
 const lo=[0,1,2].map(c=>Math.min(...patch.positionsRaw.filter((_,i)=>i%3===c))),hi=[0,1,2].map(c=>Math.max(...patch.positionsRaw.filter((_,i)=>i%3===c)));
 for(let v=0;v<n;v++)for(let c=0;c<3;c++)assert.ok(data.positions[v*3+c]>=lo[c]-1e-6&&data.positions[v*3+c]<=hi[c]+1e-6);
 // Proportion: map the ring's uv extent back to metres and compare with the ink aspect.
 const [x0,y0,x1,y1]=SYMBOL.ink,[pw,ph]=patch.sizeMetres;
 const k=Math.min(pw*0.86/(x1-x0),ph*0.86/(y1-y0));
 assert.ok(Math.abs(((x1-x0)*k)/((y1-y0)*k)-(x1-x0)/(y1-y0))<1e-9);
 assert.ok((x1-x0)*k<=pw*0.86+1e-9&&(y1-y0)*k<=ph*0.86+1e-9,'fits the badge with its margin');
});
