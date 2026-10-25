import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CAPTURE_WIDTH,PAUSE_LIMIT_MS,TRACKING_ONLY_LABEL} from '../src/signing/contract.ts';
import {TERMINAL_EFFECTS,initialContext,isLive,transition} from '../src/signing/lifecycle.ts';
import {FramePump,MAX_AGE_MS,STALL_MS} from '../src/signing/pump.ts';
import {percentile} from '../src/signing/stats.ts';
import {IntegrityError,SIMD_PROBE,fetchVerified,loadVerifiedAssets,parseManifest,sha256Hex,simdSupported,verifyBytes,wasmFor} from '../src/signing/assets.ts';
import {HintSmoother,hintCodes,meanLuma,toLandmarkFrame,userSide} from '../src/signing/convert.ts';
import {CAMERA_CONSTRAINTS,classifyCameraError,openCamera,releaseStream} from '../src/signing/camera.ts';
import {monotonic} from '../src/signing/protocol.ts';
import {TrackingSession} from '../src/signing/session.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(root+p);
const sha=b=>createHash('sha256').update(b).digest('hex');
const settle=async(n=6)=>{for(let i=0;i<n;i++)await new Promise(r=>setImmediate(r));};
const ev=type=>({type});

// ---------------------------------------------------------------- lifecycle reducer
const LIVE=['starting','tracking','paused'];
function ctxAt(phase,extra={}){return {phase,session:3,cameraReady:phase!=='starting',modelReady:phase!=='starting',...extra};}

test('START opens a new session from every resting state and never doubles up while live',()=>{
 for(const phase of ['idle','stopped','denied','unavailable','failed']){
  const r=transition(ctxAt(phase),ev('START'));
  assert.deepEqual([r.context.phase,r.context.session,r.context.cameraReady,r.context.modelReady],['starting',4,false,false]);
  assert.deepEqual(r.effects,['open-camera','start-worker']);
 }
 for(const phase of LIVE){const c=ctxAt(phase);const r=transition(c,ev('START'));assert.equal(r.context,c);assert.deepEqual(r.effects,[]);}
});

test('tracking begins only when both the camera and the tracker are ready, in either order',()=>{
 for(const order of [['CAMERA_READY','MODEL_READY'],['MODEL_READY','CAMERA_READY']]){
  let r=transition(initialContext,ev('START'));
  r=transition(r.context,ev(order[0]));
  assert.equal(r.context.phase,'starting');assert.deepEqual(r.effects,[]);
  r=transition(r.context,ev(order[1]));
  assert.deepEqual([r.context.phase,r.effects],['tracking',['start-pump']]);
 }
});

test('refusals and failures while starting end the session and release everything',()=>{
 const starting=transition(initialContext,ev('START')).context;
 const cases=[[ev('CAMERA_DENIED'),'denied',undefined],[ev('NO_CAMERA'),'unavailable',undefined],
  [{type:'CAMERA_FAILED',kind:'camera-busy'},'failed','camera-busy'],[{type:'MODEL_FAILED',kind:'model-integrity'},'failed','model-integrity'],
  [{type:'MODEL_FAILED',kind:'model-load'},'failed','model-load'],[{type:'WORKER_FAILED',kind:'worker'},'failed','worker']];
 for(const [event,phase,failure] of cases){
  const r=transition(starting,event);
  assert.deepEqual([r.context.phase,r.context.failure],[phase,failure]);
  assert.deepEqual(r.effects,TERMINAL_EFFECTS);
  assert.equal(r.context.cameraReady||r.context.modelReady,false);
 }
 const late=ctxAt('tracking');
 assert.equal(transition(late,ev('CAMERA_DENIED')).context,late,'a stray camera event cannot end a running session');
});

test('pause rules: the tab resumes only what the tab paused, the learner resumes their own pause',()=>{
 const tracking=ctxAt('tracking');
 const user=transition(tracking,ev('PAUSE'));
 assert.deepEqual([user.context.phase,user.context.pause,user.effects],['paused','user',['stop-pump','start-pause-timer']]);
 assert.equal(transition(user.context,ev('VISIBLE')).context,user.context,'coming back to the tab does not undo the learner\'s pause');
 assert.deepEqual(transition(user.context,ev('RESUME')).effects,['clear-pause-timer','start-pump']);
 const hidden=transition(tracking,ev('HIDDEN'));
 assert.equal(hidden.context.pause,'hidden');
 const back=transition(hidden.context,ev('VISIBLE'));
 assert.deepEqual([back.context.phase,back.context.pause,back.effects],['tracking',undefined,['clear-pause-timer','start-pump']]);
 assert.equal(transition(hidden.context,ev('HIDDEN')).context,hidden.context);
 assert.equal(transition(tracking,ev('RESUME')).context,tracking);
 assert.equal(transition(tracking,ev('PAUSE_TIMEOUT')).context,tracking,'the pause timer only matters while paused');
});

test('a paused camera is released after the pause limit',()=>{
 const r=transition(ctxAt('paused',{pause:'user'}),ev('PAUSE_TIMEOUT'));
 assert.deepEqual([r.context.phase,r.context.reason],['stopped','pause-timeout']);
 assert.deepEqual(r.effects,TERMINAL_EFFECTS);
 assert.equal(PAUSE_LIMIT_MS,30000);
});

test('every way out of a live session stops and releases; the same events do nothing when nothing is live',()=>{
 const table={STOP:'user',PAGEHIDE:'pagehide',ROUTE_EXIT:'route-exit',TRACK_ENDED:'track-ended',PERMISSION_REVOKED:'permission-revoked'};
 for(const phase of LIVE)for(const [type,reason] of Object.entries(table)){
  const r=transition(ctxAt(phase,phase==='paused'?{pause:'hidden'}:{}),ev(type));
  assert.deepEqual([r.context.phase,r.context.reason],['stopped',reason],`${phase}/${type}`);
  assert.deepEqual(r.effects,TERMINAL_EFFECTS);
  assert.equal(r.context.pause,undefined);
 }
 for(const phase of ['idle','stopped','denied','unavailable','failed'])for(const type of [...Object.keys(table),'PAUSE','RESUME','HIDDEN','VISIBLE','MODEL_READY']){
  const c=ctxAt(phase);assert.equal(transition(c,ev(type)).context,c,`${phase}/${type}`);
 }
 assert.deepEqual(TERMINAL_EFFECTS.filter(e=>e==='release-camera'||e==='close-worker'||e==='invalidate').length,3);
 assert.equal(isLive('failed'),false);
 const failed=transition(ctxAt('tracking'),{type:'WORKER_FAILED',kind:'worker-stalled'});
 assert.deepEqual([failed.context.phase,failed.context.failure],['failed','worker-stalled']);
});

// ---------------------------------------------------------------- pump
function pumpRig(){let t=1000;const pump=new FramePump({now:()=>t});return {pump,at:ms=>{t=ms;},tick:ms=>{t+=ms;return t;}};}
const result=(offer,extra={})=>({session:offer.session,seq:offer.seq,capturedAt:offer.capturedAt,workerMs:20,...extra});

test('the pump keeps one picture in flight and drops newer ones instead of queueing them',()=>{
 const {pump,tick}=pumpRig();
 assert.deepEqual(pump.offer(),{action:'drop',reason:'inactive'});
 pump.activate(1);
 const first=pump.offer();
 assert.equal(first.action,'send');
 for(let i=0;i<5;i++){tick(10);assert.deepEqual(pump.offer(),{action:'drop',reason:'busy'});}
 assert.deepEqual(pump.accept(result(first)),{apply:true});
 const next=pump.offer();
 assert.deepEqual([next.action,next.seq],['send',2]);
 const s=pump.stats();
 assert.deepEqual([s.sent,s.dropped,s.applied],[2,5,1]);
});

test('results from an old session, out of order, duplicated or too old are never applied',()=>{
 const {pump,tick}=pumpRig();
 pump.activate(1);
 const a=pump.offer();
 assert.deepEqual(pump.accept(result(a,{session:0})),{apply:false,reason:'stale-session'});
 assert.equal(pump.offer().action,'drop','a stale answer does not free the tracker');
 assert.deepEqual(pump.accept(result(a)),{apply:true});
 assert.equal(pump.accept(result(a)).apply,false,'a duplicate answer is ignored');
 const b=pump.offer();
 tick(MAX_AGE_MS+1);
 assert.deepEqual(pump.accept(result(b)),{apply:false,reason:'too-old'});
 const c=pump.offer();
 assert.equal(c.action,'send','a too-old answer still frees the tracker');
 pump.end();
 assert.deepEqual(pump.accept(result(c)),{apply:false,reason:'stale-session'},'after end() every answer is stale');
 assert.equal(pump.offer().action,'drop');
 const s=pump.stats();assert.ok(s.staleSession>=2&&s.tooOld===1);
});

test('a new session starts clean; resuming the same session keeps its sequence',()=>{
 const {pump}=pumpRig();
 pump.activate(1);const a=pump.offer();pump.accept(result(a));
 pump.pause();pump.activate(1);
 assert.equal(pump.offer().seq,2,'resume continues the sequence');
 pump.activate(2);
 const fresh=pump.offer();
 assert.deepEqual([fresh.seq,fresh.session],[1,2]);
 assert.equal(pump.stats().sent,1);
});

test('a picture the tracker never answers is reported as stalled; a failed picture frees the tracker',()=>{
 const {pump,tick}=pumpRig();
 pump.activate(1);const o=pump.offer();
 assert.equal(pump.isStalled(),false);
 tick(STALL_MS+1);assert.equal(pump.isStalled(),true);
 pump.fail(1,o.seq);
 assert.equal(pump.isStalled(),false);
 assert.equal(pump.offer().action,'send');
 pump.fail(9,1);assert.equal(pump.stats().failed,1,'a failure for another session is ignored');
});

test('the tracker gets a fixed picture width and the nearest-rank percentile is right',()=>{
 const {pump}=pumpRig();pump.activate(1);
 assert.equal(pump.offer().width,CAPTURE_WIDTH);
 assert.equal(CAPTURE_WIDTH,640);
 assert.equal(percentile([1,2,3,4,5,6,7,8,9,10],90),9);
 assert.equal(percentile([1,2,3,4,5,6,7,8,9,10],50),5);
 assert.equal(percentile([],90),0);
});

test('detector timestamps strictly increase',()=>{
 assert.equal(monotonic(0,100.4),100);
 assert.equal(monotonic(100,100.2),101);
 assert.equal(monotonic(100,50),101);
});

// ---------------------------------------------------------------- integrity
const manifest=()=>JSON.parse(read('src/signing/manifest.json').toString());
const asset=bytes=>({path:'x.bin',sha256:sha(bytes),bytes:bytes.length});
const bufOf=bytes=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);

test('SHA-256 and byte checks accept only the pinned bytes',async()=>{
 assert.equal(await sha256Hex(new TextEncoder().encode('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 const good=Buffer.from('tracker bytes');
 await verifyBytes('x',bufOf(good),asset(good));
 await assert.rejects(()=>verifyBytes('x',bufOf(Buffer.from('tracker byteZ')),asset(good)),e=>e instanceof IntegrityError&&/checksum/.test(e.message)&&e.asset==='x');
 await assert.rejects(()=>verifyBytes('x',bufOf(Buffer.from('short')),asset(good)),/expected \d+ bytes/);
});

test('fetchVerified returns bytes only when the response and checksum are right',async()=>{
 const good=Buffer.from('model bytes');
 const ok=bytes=>async()=>({ok:true,status:200,arrayBuffer:async()=>bufOf(bytes)});
 assert.equal((await fetchVerified('m','/signing/',asset(good),ok(good))).byteLength,good.length);
 await assert.rejects(()=>fetchVerified('m','/signing/',asset(good),async()=>({ok:false,status:404,arrayBuffer:async()=>new ArrayBuffer(0)})),e=>!(e instanceof IntegrityError)&&/HTTP 404/.test(e.message));
 await assert.rejects(()=>fetchVerified('m','/signing/',asset(good),ok(Buffer.from('model byteZ'))),IntegrityError);
 let url='';
 await fetchVerified('m','/signing/',{...asset(good),path:'models/a.task'},async u=>{url=u;return ok(good)();});
 assert.equal(url,'/signing/models/a.task');
});

test('loadVerifiedAssets fetches only the engine variant that will run, and fails closed on any mismatch',async()=>{
 const files={loaderS:Buffer.from('simd loader'),wasmS:Buffer.from('simd wasm'),loaderN:Buffer.from('nosimd loader'),wasmN:Buffer.from('nosimd wasm'),model:Buffer.from('model')};
 const m={contract:'kairo-signing/0.1',mode:'tracking-only',runtime:{version:'1',npmIntegrity:'x',wasm:{
  simd:{loader:{...asset(files.loaderS),path:'wasm/s.js'},binary:{...asset(files.wasmS),path:'wasm/s.wasm'}},
  nosimd:{loader:{...asset(files.loaderN),path:'wasm/n.js'},binary:{...asset(files.wasmN),path:'wasm/n.wasm'}}}},
  model:{asset:{...asset(files.model),path:'models/m.task'}},worker:{...asset(Buffer.from('w')),path:'w.js'},licenseFile:{...asset(Buffer.from('l')),path:'l.txt'}};
 parseManifest(m);
 const byPath={'/signing/wasm/s.js':files.loaderS,'/signing/wasm/s.wasm':files.wasmS,'/signing/wasm/n.js':files.loaderN,'/signing/wasm/n.wasm':files.wasmN,'/signing/models/m.task':files.model};
 for(const [simd,names] of [[true,['/signing/wasm/s.js','/signing/wasm/s.wasm']],[false,['/signing/wasm/n.js','/signing/wasm/n.wasm']]]){
  const seen=[];
  const out=await loadVerifiedAssets({manifest:m,base:'/signing/',simd,fetchFn:async u=>{seen.push(u);return {ok:true,status:200,arrayBuffer:async()=>bufOf(byPath[u])};}});
  assert.deepEqual(seen.sort(),[...names,'/signing/models/m.task'].sort());
  assert.equal(out.simd,simd);
  assert.equal(wasmFor(m,simd).loader.path,simd?'wasm/s.js':'wasm/n.js');
 }
 await assert.rejects(()=>loadVerifiedAssets({manifest:m,base:'/signing/',simd:true,fetchFn:async u=>({ok:true,status:200,arrayBuffer:async()=>bufOf(u.endsWith('.task')?Buffer.from('tampered'):byPath[u])})}),e=>e instanceof IntegrityError&&/hand model/.test(e.message));
});

test('the manifest must be well formed, and SIMD detection is a safe boolean',()=>{
 parseManifest(manifest());
 assert.throws(()=>parseManifest(null),/contract/);
 assert.throws(()=>parseManifest({...manifest(),contract:'other/1'}),/contract/);
 const bad=manifest();bad.model.asset.sha256='nothex';assert.throws(()=>parseManifest(bad),/model/);
 const abs=manifest();abs.worker.path='/etc/passwd';assert.throws(()=>parseManifest(abs),/worker/);
 const up=manifest();up.runtime.wasm.simd.binary.path='../x';assert.throws(()=>parseManifest(up),/wasm simd binary/);
 assert.equal(typeof simdSupported(),'boolean');
 assert.equal(simdSupported(()=>false),false);
 assert.equal(simdSupported(()=>{throw new Error('no wasm');}),false);
 assert.equal(SIMD_PROBE[0],0);
});

// ---------------------------------------------------------------- conversion and hints
const pts=(x=0.5,y=0.5)=>Array.from({length:21},(_,i)=>({x:x+i*0.001,y,z:0}));
const meta={session:1,seq:7,capturedAt:123,width:640,height:480};

test('handedness is swapped for a raw picture so each side is the learner\'s own hand',()=>{
 assert.deepEqual(['Left','Right','left','right','','Other',undefined].map(userSide),['right','left','right','left','unknown','unknown','unknown']);
 const f=toLandmarkFrame({landmarks:[pts(0.3),pts(0.7)],handedness:[[{categoryName:'Left',score:0.9}],[{categoryName:'Right',score:0.8}]]},meta);
 assert.deepEqual(f.hands.map(h=>[h.side,h.sideScore]),[['right',0.9],['left',0.8]]);
 assert.deepEqual([f.session,f.seq,f.capturedAt,f.width,f.height],[1,7,123,640,480]);
 assert.equal(f.hands[0].points.length,21);
});

test('malformed hands are dropped rather than guessed at',()=>{
 const short=pts().slice(0,20);
 const nan=pts();nan[3]={x:NaN,y:0,z:0};
 const f=toLandmarkFrame({landmarks:[short,nan,pts()],handedness:[[],[],[]]},meta);
 assert.equal(f.hands.length,1);
 assert.deepEqual([f.hands[0].side,f.hands[0].sideScore],['unknown',0]);
 assert.equal(toLandmarkFrame({landmarks:[]},meta).hands.length,0);
});

test('picture hints describe the picture only, and show only after they hold steady',()=>{
 const one=toLandmarkFrame({landmarks:[pts()]},meta),none=toLandmarkFrame({landmarks:[]},meta),two=toLandmarkFrame({landmarks:[pts(0.3),pts(0.6)]},meta);
 const edge=toLandmarkFrame({landmarks:[pts(0.5,0.01)]},meta);
 assert.deepEqual(hintCodes(none,null),['no-hands']);
 assert.deepEqual(hintCodes(one,null),['one-hand']);
 assert.deepEqual(hintCodes(two,200),[]);
 assert.deepEqual(hintCodes(edge,30).sort(),['hand-at-edge','low-light','one-hand']);
 assert.deepEqual(hintCodes(null,30),['low-light']);
 assert.ok(Math.abs(meanLuma(new Uint8ClampedArray([255,255,255,255,0,0,0,255]))-127.5)<1e-9);
 const s=new HintSmoother(600);
 assert.deepEqual(s.update(['one-hand'],0),[]);
 assert.deepEqual(s.update(['one-hand'],599),[]);
 assert.deepEqual(s.update(['one-hand'],600).map(h=>h.code),['one-hand']);
 assert.deepEqual(s.update([],700),[],'a hint that goes away disappears at once');
 assert.deepEqual(s.update(['one-hand'],800),[],'and has to hold again');
});

// ---------------------------------------------------------------- camera helpers
test('camera errors are classified and the microphone is never requested',async()=>{
 assert.deepEqual(['NotAllowedError','SecurityError','NotFoundError','NotReadableError','AbortError','TypeError',undefined].map(name=>classifyCameraError(name&&{name})),
  ['denied','denied','unavailable','busy','busy','failed','failed']);
 assert.equal(CAMERA_CONSTRAINTS.audio,false);
 const calls=[];
 const stream={tracks:1};
 const got=await openCamera({getUserMedia:async c=>{calls.push(c);if(calls.length===1)throw Object.assign(new Error('x'),{name:'OverconstrainedError'});return stream;}});
 assert.equal(got,stream);
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.audio===false));assert.equal(calls[1].video,true);
 await assert.rejects(()=>openCamera({getUserMedia:async()=>{throw Object.assign(new Error('no'),{name:'NotAllowedError'});}}),{name:'NotAllowedError'});
 let stops=0;const track={stop(){stops++;}};
 releaseStream({getTracks:()=>[track,{stop(){throw new Error('already');}}]});releaseStream(null);releaseStream(undefined);
 assert.equal(stops,1);
});

// ---------------------------------------------------------------- session controller with fakes
function makeClock(){let t=0,id=0;const timers=new Map();
 return {now:()=>t,pending:()=>timers.size,
  timers:{setTimeout:(fn,ms)=>{const i=++id;timers.set(i,{fn,at:t+ms});return i;},clearTimeout:i=>{timers.delete(i);},
   setInterval:(fn,ms)=>{const i=++id;timers.set(i,{fn,at:t+ms,every:ms});return i;},clearInterval:i=>{timers.delete(i);}},
  advance(ms){const end=t+ms;for(;;){let next=null;for(const [i,x] of timers)if(x.at<=end&&(!next||x.at<next.x.at))next={i,x};if(!next)break;t=next.x.at;if(next.x.every)next.x.at+=next.x.every;else timers.delete(next.i);next.x.fn();}t=end;}};}

function makeStream(state){
 const track={stopped:0,listeners:{},stop(){this.stopped++;},addEventListener(type,fn){this.listeners[type]=fn;},end(){this.listeners.ended?.();}};
 const stream={tracks:[track],getTracks:()=>[track],getVideoTracks:()=>[track]};
 state.streams.push(stream);return stream;
}
function makeWorker(state,opts){
 const w={posted:[],terminated:0,onmessage:null,onerror:null,
  postMessage(m){this.posted.push(m);if(m.type==='init'&&opts.autoReady!==false)queueMicrotask(()=>this.onmessage?.({data:{type:'ready',session:m.session}}));},
  terminate(){this.terminated++;},emit(data){this.onmessage?.({data});},
  frames(){return this.posted.filter(m=>m.type==='frame');}};
 state.workers.push(w);return w;
}
function rig(opts={}){
 const clock=makeClock();
 const state={gum:0,streams:[],workers:[],bitmaps:[],assetCalls:0,frameCb:null,cancelled:0,hidden:false,visCb:null,hideCb:null,permCb:null,luma:null,constraints:[]};
 const video={srcObject:null,readyState:4,videoWidth:640,videoHeight:480,paused:false,play:async()=>{},pause(){this.paused=true;}};
 const deps={
  mediaDevices:opts.noDevices?undefined:{getUserMedia:async c=>{state.gum++;state.constraints.push(c);return opts.gum?opts.gum(state):makeStream(state);}},
  video,
  loadAssets:async signal=>{state.assetCalls++;state.signal=signal;if(opts.assetError)throw opts.assetError;return {loader:new ArrayBuffer(4),wasm:new ArrayBuffer(4),model:new ArrayBuffer(4),simd:true};},
  createWorker:async()=>{if(opts.workerError)throw opts.workerError;return makeWorker(state,opts);},
  grabFrame:async()=>{if(opts.grabFails)throw new Error('grab');const b={closed:0,close(){this.closed++;}};state.bitmaps.push(b);return b;},
  requestFrame:cb=>{state.frameCb=cb;return 1;},cancelFrame:()=>{state.frameCb=null;state.cancelled++;},
  now:clock.now,timers:clock.timers,isHidden:()=>state.hidden,
  onVisibilityChange:cb=>{state.visCb=cb;return ()=>{state.visCb=null;};},
  onPageHide:cb=>{state.hideCb=cb;return ()=>{state.hideCb=null;};},
  watchCameraPermission:cb=>{state.permCb=cb;return ()=>{state.permCb=null;};},
  sampleLuma:()=>state.luma,
 };
 const session=new TrackingSession(deps);
 const frames=[];session.onFrame(f=>frames.push(f));
 const frame=async()=>{const cb=state.frameCb;state.frameCb=null;cb?.();await settle(3);};
 const worker=()=>state.workers[state.workers.length-1];
 const answer=(msg,extra={})=>worker().emit({type:'result',workerMs:12,frame:{session:msg.session,seq:msg.seq,capturedAt:msg.capturedAt,width:320,height:240,hands:[],...extra}});
 const tracking=async()=>{session.start();await settle();assert.equal(session.getSnapshot().phase,'tracking');};
 return {session,state,clock,video,frames,frame,worker,answer,tracking};
}
const phase=r=>r.session.getSnapshot().phase;

test('constructing a session touches no camera, network or worker; only start() does',async()=>{
 const r=rig();
 await settle();
 assert.deepEqual([r.state.gum,r.state.assetCalls,r.state.workers.length,phase(r)],[0,0,0,'idle']);
 assert.equal(r.session.getSnapshot().label,TRACKING_ONLY_LABEL);
 r.state.hidden=true;r.state.visCb();r.state.hideCb();
 assert.equal(phase(r),'idle');
 r.session.start();r.session.start();
 await settle();
 assert.equal(r.state.gum,1,'two quick clicks open one camera');
});

test('happy path: video only, verified bytes handed to the worker, one picture in flight, newest answer shown once',async()=>{
 const r=rig();
 await r.tracking();
 assert.deepEqual(r.state.constraints[0].audio,false);
 const init=r.worker().posted[0];
 assert.deepEqual([init.type,init.session,init.model.byteLength],['init',1,4]);
 await r.frame();
 const sent=r.worker().frames();
 assert.equal(sent.length,1);
 assert.deepEqual([sent[0].session,sent[0].seq],[1,1]);
 await r.frame();await r.frame();
 assert.equal(r.worker().frames().length,1,'while the tracker is busy newer pictures are dropped, not queued');
 r.answer(sent[0]);
 assert.equal(r.frames.length,1);
 r.clock.advance(500);
 assert.equal(r.session.getSnapshot().stats.dropped,2,'counters reach the snapshot at 2 Hz, not on every frame');
 r.answer(sent[0]);
 assert.equal(r.frames.length,1,'a repeated answer is not shown twice');
 await r.frame();
 assert.equal(r.worker().frames().length,2);
 r.clock.advance(500);
 assert.equal(r.session.getSnapshot().stats.applied,1);
});

test('pictures are only taken when the video has a real picture',async()=>{
 const r=rig();
 await r.tracking();
 r.video.readyState=1;await r.frame();
 assert.equal(r.worker().frames().length,0);
 r.video.readyState=4;r.video.videoWidth=0;await r.frame();
 assert.equal(r.worker().frames().length,0);
});

test('camera denial or no camera ends the session, with the tracker closed and no stream kept',async()=>{
 for(const [name,expected] of [['NotAllowedError','denied'],['NotFoundError','unavailable']]){
  const r=rig({gum:()=>{throw Object.assign(new Error(name),{name});}});
  r.session.start();await settle();
  assert.equal(phase(r),expected);
  assert.ok(r.state.workers.every(w=>w.terminated===1)||r.state.workers.length===0);
  assert.equal(r.video.srcObject,null);
 }
 const noDevices=rig({noDevices:true});noDevices.session.start();await settle();
 assert.equal(phase(noDevices),'unavailable');
});

test('stopping while the permission prompt is open releases the camera the moment it arrives',async()=>{
 let resolve;const late={};
 const r=rig({gum:state=>new Promise(res=>{resolve=()=>res(makeStream(state));late.state=state;})});
 r.session.start();await settle();
 assert.equal(phase(r),'starting');
 r.session.stop();
 assert.equal(phase(r),'stopped');
 resolve();await settle();
 assert.equal(phase(r),'stopped');
 assert.equal(r.state.streams[0].tracks[0].stopped,1,'the late stream was stopped, not kept');
 assert.equal(r.video.srcObject,null);
 assert.equal(r.state.signal.aborted,true,'loading was cancelled');
});

test('a failed checksum fails closed: no worker is created and the camera is released',async()=>{
 const r=rig({assetError:new IntegrityError('hand model','checksum mismatch')});
 r.session.start();await settle();
 const s=r.session.getSnapshot();
 assert.deepEqual([s.phase,s.failure],['failed','model-integrity']);
 assert.match(s.detail,/hand model/);
 assert.equal(r.state.workers.length,0);
 assert.equal(r.state.streams[0].tracks[0].stopped,1);
 const net=rig({assetError:new Error('HTTP 404')});net.session.start();await settle();
 assert.equal(net.session.getSnapshot().failure,'model-load');
 const code=rig({workerError:new IntegrityError('tracker worker','bad')});code.session.start();await settle();
 assert.equal(code.session.getSnapshot().failure,'model-integrity');
});

test('leaving the page, the screen, losing the track or losing permission each turn the camera off',async()=>{
 const trigger={
  pagehide:r=>r.state.hideCb(),
  'track-ended':r=>r.state.streams[0].tracks[0].end(),
  'permission-revoked':r=>r.state.permCb(),
  'route-exit':r=>r.session.dispose(),
  user:r=>r.session.stop(),
 };
 for(const [reason,act] of Object.entries(trigger)){
  const r=rig();await r.tracking();
  await r.frame();
  const worker=r.worker(),track=r.state.streams[0].tracks[0];
  act(r);
  assert.equal(phase(r),'stopped',reason);
  assert.equal(r.session.getSnapshot().reason,reason);
  assert.equal(track.stopped,1,`${reason}: camera released`);
  assert.equal(r.video.srcObject,null);
  assert.equal(worker.terminated,1,`${reason}: worker terminated`);
  assert.ok(worker.posted.some(m=>m.type==='close'));
  assert.equal(r.state.frameCb,null,`${reason}: no more pictures requested`);
  assert.equal(r.clock.pending(),0,`${reason}: no timers left`);
 }
 const r=rig();await r.tracking();r.session.dispose();
 assert.deepEqual([r.state.visCb,r.state.hideCb,r.state.permCb],[null,null,null],'dispose detaches every listener');
});

test('a hidden tab pauses, resumes when visible, and is released after the pause limit',async()=>{
 const r=rig();await r.tracking();
 await r.frame();
 r.state.hidden=true;r.state.visCb();
 assert.equal(phase(r),'paused');
 assert.equal(r.session.getSnapshot().pause,'hidden');
 assert.equal(r.state.frameCb,null,'no pictures while paused');
 const track=r.state.streams[0].tracks[0];
 r.clock.advance(PAUSE_LIMIT_MS-1);
 assert.deepEqual([phase(r),track.stopped],['paused',0]);
 r.state.hidden=false;r.state.visCb();
 assert.equal(phase(r),'tracking');
 assert.equal(r.clock.pending()>0,true);
 await r.frame();
 assert.ok(r.worker().frames().length>=1);
 r.state.hidden=true;r.state.visCb();
 r.clock.advance(PAUSE_LIMIT_MS);
 assert.deepEqual([phase(r),r.session.getSnapshot().reason,track.stopped],['stopped','pause-timeout',1]);
 assert.equal(r.clock.pending(),0);
});

test('a learner\'s own pause is not undone by the tab coming back, and Resume works',async()=>{
 const r=rig();await r.tracking();
 r.session.pause();
 assert.equal(r.session.getSnapshot().pause,'user');
 r.state.hidden=true;r.state.visCb();r.state.hidden=false;r.state.visCb();
 assert.equal(phase(r),'paused');
 r.session.resume();
 assert.equal(phase(r),'tracking');
 r.session.pause();r.clock.advance(PAUSE_LIMIT_MS);
 assert.equal(r.session.getSnapshot().reason,'pause-timeout');
});

test('a tab hidden while the camera is still starting pauses as soon as tracking begins',async()=>{
 const r=rig();r.state.hidden=true;
 r.session.start();await settle();
 assert.equal(phase(r),'paused');
 assert.equal(r.session.getSnapshot().pause,'hidden');
});

test('answers that arrive after stop, after a restart, or for another session are never shown',async()=>{
 const r=rig();await r.tracking();await r.frame();
 const oldWorker=r.worker(),msg=oldWorker.frames()[0];
 r.session.stop();
 oldWorker.emit({type:'result',workerMs:5,frame:{session:1,seq:msg.seq,capturedAt:msg.capturedAt,width:1,height:1,hands:[]}});
 assert.equal(r.frames.length,0,'the old worker no longer delivers anything');
 await r.tracking();
 assert.equal(r.session.getSnapshot().session,2);
 await r.frame();
 const fresh=r.worker().frames()[0];
 assert.equal(fresh.session,2);
 r.worker().emit({type:'result',workerMs:5,frame:{session:1,seq:fresh.seq,capturedAt:fresh.capturedAt,width:1,height:1,hands:[]}});
 assert.equal(r.frames.length,0);
 r.clock.advance(500);
 assert.ok(r.session.getSnapshot().stats.staleSession>=1);
 assert.equal(r.state.gum,2,'a restart asks for the camera again');
 r.session.pause();
 r.answer(fresh);
 assert.equal(r.frames.length,0,'a picture answered while paused is not drawn');
});

test('a tracker that stops answering, errors repeatedly or fails outright turns the camera off',async()=>{
 const stalled=rig();await stalled.tracking();await stalled.frame();
 stalled.clock.advance(STALL_MS+1000);
 assert.deepEqual([phase(stalled),stalled.session.getSnapshot().failure],['failed','worker-stalled']);
 assert.equal(stalled.state.streams[0].tracks[0].stopped,1);

 const noisy=rig();await noisy.tracking();
 for(let i=0;i<5;i++){await noisy.frame();const m=noisy.worker().frames().pop();noisy.worker().emit({type:'error',session:1,seq:m.seq,fatal:false,message:'one picture failed'});}
 assert.deepEqual([phase(noisy),noisy.session.getSnapshot().failure],['failed','worker']);

 const fatal=rig();await fatal.tracking();
 fatal.worker().emit({type:'error',session:1,fatal:true,message:'engine crashed'});
 assert.equal(phase(fatal),'failed');
 assert.match(fatal.session.getSnapshot().detail,/engine crashed/);

 const grab=rig({grabFails:true});await grab.tracking();
 for(let i=0;i<5;i++)await grab.frame();
 assert.deepEqual([phase(grab),grab.session.getSnapshot().failure],['failed','frames']);

 const crash=rig();await crash.tracking();crash.worker().onerror({});
 assert.equal(crash.session.getSnapshot().failure,'worker');
});

test('a picture prepared just as the camera stops is closed, not sent',async()=>{
 const r=rig();await r.tracking();
 const cb=r.state.frameCb;r.state.frameCb=null;cb();
 r.session.stop();
 await settle(3);
 assert.equal(r.state.bitmaps.length,1);
 assert.equal(r.state.bitmaps[0].closed,1);
 assert.equal(r.worker().frames().length,0);
});

test('picture tips appear only after holding steady and only while tracking',async()=>{
 const r=rig();r.state.luma=20;
 await r.tracking();
 r.clock.advance(500);
 assert.deepEqual(r.session.getSnapshot().hints,[]);
 r.clock.advance(1000);
 assert.deepEqual(r.session.getSnapshot().hints.map(h=>h.code),['low-light']);
 r.session.pause();
 r.session.stop();
 assert.deepEqual(r.session.getSnapshot().hints,[]);
});

test('no picture or landmark history is kept: the session exposes only counters and the latest tips',async()=>{
 const r=rig();await r.tracking();
 for(let i=0;i<4;i++){await r.frame();r.answer(r.worker().frames().pop());}
 const keys=Object.keys(r.session.getSnapshot());
 assert.deepEqual(keys.sort(),['detail','failure','hints','label','pause','phase','reason','session','stats'].sort());
 const own=Object.keys(r.session);
 assert.ok(!own.some(k=>/history|buffer|recording|frames$/i.test(k)),own.join());
 assert.equal(r.frames.length,4,'frames went to the listener once');
});

// ---------------------------------------------------------------- pinned files, and what the code is allowed to do
test('the runtime is pinned exactly and matches the lockfile, the install and the manifest',()=>{
 const pkg=JSON.parse(read('package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const m=manifest();
 assert.equal(pkg.dependencies['@mediapipe/tasks-vision'],'0.10.17','an exact version, no range');
 assert.equal(lock.packages[''].dependencies['@mediapipe/tasks-vision'],'0.10.17');
 const entry=lock.packages['node_modules/@mediapipe/tasks-vision'];
 assert.deepEqual([entry.version,entry.license],['0.10.17','Apache-2.0']);
 assert.equal(m.runtime.version,'0.10.17');
 assert.equal(m.runtime.npmIntegrity,entry.integrity);
 const installed=JSON.parse(read('node_modules/@mediapipe/tasks-vision/package.json'));
 assert.equal(installed.version,'0.10.17');
 for(const f of ['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm']){
  assert.equal(sha(read(`public/signing/wasm/${f}`)),sha(read(`node_modules/@mediapipe/tasks-vision/wasm/${f}`)),`${f}: the served engine is the pinned package's file`);
 }
});

test('every pinned file on disk matches its manifest hash and size',()=>{
 const m=parseManifest(manifest());
 const files=[m.runtime.wasm.simd.loader,m.runtime.wasm.simd.binary,m.runtime.wasm.nosimd.loader,m.runtime.wasm.nosimd.binary,m.model.asset,m.worker,m.licenseFile];
 for(const a of files){const bytes=read(`public/signing/${a.path}`);assert.equal(bytes.length,a.bytes,a.path);assert.equal(sha(bytes),a.sha256,a.path);}
 assert.equal(m.model.asset.sha256,'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1');
 const task=read('public/signing/models/hand_landmarker.task');
 assert.ok(task.subarray(0,16).includes(Buffer.from([0x50,0x4b,0x03,0x04])),'a zip local header near the start');
 assert.ok(task.subarray(task.length-64).includes(Buffer.from([0x50,0x4b,0x05,0x06])),'a zip end record at the end');
 assert.equal(createHash('md5').update(read('public/signing/models/hand_landmarker.task')).digest('hex'),m.model.md5,'matches the checksum Google reported for the download');
 assert.match(read('public/signing/LICENSE-Apache-2.0.txt').toString(),/Apache License\s+Version 2\.0/);
 const found=[];const walk=(dir,prefix='')=>{for(const e of readdirSync(root+dir,{withFileTypes:true}))e.isDirectory()?walk(`${dir}/${e.name}`,`${prefix}${e.name}/`):found.push(prefix+e.name);};
 walk('public/signing');
 assert.deepEqual(found.sort(),files.map(a=>a.path).sort(),'nothing unpinned sits in public/signing');
 assert.ok(m.model.limits.some(l=>/not a sign language model/i.test(l)));
});

test('the worker is a classic script (the engine needs importScripts) with no module syntax',()=>{
 const code=read('public/signing/tracker.worker.js').toString();
 assert.ok(code.includes('importScripts'),'the library loads its engine with importScripts');
 assert.ok(!/\bimport\.meta\b/.test(code));
 assert.ok(!/(^|[;{}\n])\s*(import|export)(\s+[\w{*"']|\s*[{*"'])/.test(code),'no top-level import/export (importScripts is fine)');
 assert.ok(!/\bdocument\./.test(code.replace(/typeof document[^;]*/g,'')) || /createElement\("script"\)/.test(code),'the only DOM use is the library\'s own non-worker fallback');
 assert.ok(code.length<400_000);
});

test('signing code has no recording, storage, outbound or microphone path',()=>{
 const dir='src/signing/';
 const files=readdirSync(root+dir).filter(f=>/\.(ts|tsx)$/.test(f));
 assert.ok(files.length>=10);
 const banned=/MediaRecorder|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|WebSocket|EventSource|toDataURL|toBlob\(|captureStream|enumerateDevices|audio:\s*true|getDisplayMedia/;
 for(const f of files){
  const code=readFileSync(root+dir+f,'utf8').split('\n').filter(l=>!/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  assert.ok(!banned.test(code),`${f}: ${code.match(banned)?.[0]}`);
  assert.ok(!/https?:\/\//.test(code),`${f}: no external address in code`);
  if(f!=='browserDeps.ts')assert.ok(!/\bfetch\(/.test(code),`${f}: only browserDeps reaches the network, and only for same-origin pinned files`);
 }
 const deps=readFileSync(root+dir+'browserDeps.ts','utf8');
 assert.equal((deps.match(/\bfetch\(/g)??[]).length,2);
 assert.ok(/ASSET_BASE/.test(deps));
 assert.ok(existsSync(root+'src/signing/preview.html'));
});
