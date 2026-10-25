// Isolated, read-only bridge for the five unmerged prepared studio scenarios.
// This is NOT a server evidence endpoint, source-owner verifier, replay validator,
// score certification or substitute for the canonical local coordination bus.
export const REVIEW_SCHEMA='kairo-studio-local-review/1';
export const REVIEW_STATUS='local-unverified';
const HEX24=/^[a-f0-9]{24}$/;
const HEX64=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{6,80}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const fail=message=>{throw new TypeError(message);};
const keys=(x,expected)=>{
 if(!isObject(x)||Object.keys(x).length!==expected.length||
    expected.some(k=>!own(x,k)))fail('Unexpected or missing contract fields');
};
const safeDate=x=>typeof x==='string'&&ISO.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString()===x;
const safeNumber=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e6;

const definitions=Object.freeze({
 'pump-what-if':Object.freeze({
   model:'kairo-pump-lab-model/1',revision:'kairo-pump-what-if/1',
   sourceKind:'prepared-model-only',sourceRevision:'kairo-pump-lab-model/1',
   attemptKeys:['scenarioId','independent','direction','estimateLps','beforeLps','afterLps','deltaLps','beforeHeadM','afterHeadM','beforeValveLossM','afterValveLossM','actualDirection','directionMatches','absoluteErrorLps','note'],
 }),
 'http-request':Object.freeze({
   model:'kairo-http-request-trace/1',sourceKind:'prepared-public-reference',
   sourceRevision:'rfc9110-2022+rfc9111-2022',
   attemptKeys:['id','modelVersion','referenceKind','referenceRevision','evidenceStatus','at','scenario','prediction','result','outcomeCorrect','requestPredictionCorrect'],
 }),
 'binary-search':Object.freeze({
   model:'kairo-binary-search-lower-bound/1',sourceKind:'prepared-public-reference',
   sourceRevision:'python-3.14-bisect-left',
   attemptKeys:['id','at','scenario','prediction','trace','correct','modelVersion','referenceKind','referenceRevision','evidenceStatus'],
 }),
 'sql-join':Object.freeze({
   model:'kairo-sql-join-trace/1',sourceKind:'prepared-public-reference',
   sourceRevision:'postgresql-current-join-table-expressions-2026-10-25',
   attemptKeys:['id','at','scenario','prediction','actual','correct','modelVersion','sourceKind','sourceRevision','evidenceStatus'],
 }),
 'bfs-path':Object.freeze({
   model:'kairo-bfs-unweighted-directed/1',sourceKind:'prepared-public-reference',
   sourceRevision:'mit-ocw-6-006-spring-2020-lecture-9',
   attemptKeys:['id','at','scenarioId','prediction','trace','correct','modelVersion','sourceKind','sourceRevision','evidenceStatus'],
 })
});
export const ACTIVITY_IDS=Object.freeze(Object.keys(definitions));

function scenarioKey(activity,attempt,round){
 if(activity==='pump-what-if'){
   const expected=['guided-open-valve','independent-close-valve'][round];
   if(attempt.scenarioId!==expected||attempt.independent!==(round===1))fail('Pump scenario or independence marker changed');
   if(!['increase','decrease','unchanged'].includes(attempt.direction)||
      !['increase','decrease','unchanged'].includes(attempt.actualDirection))fail('Invalid pump prediction');
   for(const field of ['estimateLps','beforeLps','afterLps','deltaLps','beforeHeadM','afterHeadM','beforeValveLossM','afterValveLossM','absoluteErrorLps'])
     if(!safeNumber(attempt[field]))fail('Invalid pump reading');
   if(typeof attempt.directionMatches!=='boolean'||(attempt.note!==null&&
      (typeof attempt.note!=='string'||attempt.note.length>400)))fail('Invalid pump note or flag');
   return attempt.scenarioId;
 }
 if(activity==='http-request'){
   keys(attempt.scenario,['cache','connection','origin']);
   const {cache,connection,origin}=attempt.scenario;
   if(!['fresh','empty'].includes(cache)||!['online','offline'].includes(connection)||!['200','503'].includes(origin))
     fail('Unknown HTTP scenario');
   return [cache,connection,origin].join('/');
 }
 if(activity==='binary-search'){
   keys(attempt.scenario,['arrayId','target']);
   const {arrayId,target}=attempt.scenario;
   if(!['repeats','gaps','empty'].includes(arrayId)||!Number.isSafeInteger(target)||target< -100||target>100)
     fail('Unknown binary search scenario');
   return arrayId+'/'+target;
 }
 if(activity==='sql-join'){
   keys(attempt.scenario,['datasetId','join']);
   const {datasetId,join}=attempt.scenario;
   if(!['multiple','missing','nulls'].includes(datasetId)||!['inner','left'].includes(join))
     fail('Unknown SQL JOIN scenario');
   return datasetId+'/'+join;
 }
 if(activity==='bfs-path'){
   if(!['branching','cycle','disconnected','same','tie'].includes(attempt.scenarioId))
     fail('Unknown BFS graph');
   return attempt.scenarioId;
 }
 fail('Unrecognised activity');
}

function localSourceClaim(claim){
 if(claim===undefined)return null;
 keys(claim,['sourceId','revision','lessonId','currentRevision']);
 if(!HEX24.test(claim.sourceId)||!HEX24.test(claim.lessonId)||
    !HEX64.test(claim.revision)||!HEX64.test(claim.currentRevision))
   fail('Invalid source/lesson reference');
 if(claim.revision!==claim.currentRevision)fail('Source revision changed; review again');
 return Object.freeze({
   kind:'browser-claimed-reviewed-source',sourceId:claim.sourceId,
   revision:claim.revision,lessonId:claim.lessonId,
   ownerVerified:false,revisionVerifiedByServer:false
 });
}

export function createLocalReview({activity,session,localSessionId,sourceClaim}={}){
 if(typeof activity!=='string'||!own(definitions,activity))fail('Unsupported prepared studio activity');
 const def=definitions[activity];
 if(!isObject(session))fail('Invalid studio session');
 // Limit data processed; no raw learner text or trace is copied to output.
 const size=JSON.stringify(session)?.length;
 if(!Number.isSafeInteger(size)||size>32768)fail('Session is too large to review');
 const pump=activity==='pump-what-if';
 if(pump){
   keys(session,['schema','model','provenance','phase','attempts','actions']);
   if(session.schema!==def.revision||session.model!==def.model||
      session.provenance!=='prepared-model-only'||!['predict','explain','done'].includes(session.phase)||
      !Array.isArray(session.actions)||session.actions.length>4)
     fail('Pump schema/model/provenance mismatch');
 }else{
   keys(session,['id','attempts']);
   if(!ID.test(session.id))fail('Invalid local session ID');
 }
 const id=pump?localSessionId:session.id;
 if(!ID.test(id)||(!pump&&localSessionId!==undefined&&localSessionId!==id))
   fail('Local session identifier mismatch');
 if(!Array.isArray(session.attempts)||session.attempts.length<1||session.attempts.length>2)
   fail('Only one or two local attempts can be reviewed');
 const seen=new Set(),results=[];
 for(const [index,attempt] of session.attempts.entries()){
   keys(attempt,def.attemptKeys);
   const key=scenarioKey(activity,attempt,index);
   if(seen.has(key))fail('Second attempt must use a different prepared scenario');
   seen.add(key);
   if(!pump){
     if(attempt.modelVersion!==def.model||
       (attempt.referenceKind??attempt.sourceKind)!==def.sourceKind||
       (attempt.referenceRevision??attempt.sourceRevision)!==def.sourceRevision||
       attempt.evidenceStatus!==REVIEW_STATUS)fail('Stale or promoted model/source evidence metadata');
     if(attempt.id!==id+'-round-'+(index+1)||!safeDate(attempt.at))
       fail('Invalid attempt identity or timestamp');
     if(typeof attempt.correct!=='boolean'&&
       !(activity==='http-request'&&typeof attempt.outcomeCorrect==='boolean'&&
         typeof attempt.requestPredictionCorrect==='boolean'))fail('Invalid local result flag');
   }
   results.push(Object.freeze({
     id:id+'-round-'+(index+1),
     ordinal:index+1,
     scenarioKey:key,
     attemptedAt:pump?null:attempt.at,
     independent:index>0,
     resultStatus:REVIEW_STATUS
   }));
 }
 return Object.freeze({
   schema:REVIEW_SCHEMA,activity,modelVersion:def.model,sessionId:id,
   preparedReference:Object.freeze({kind:def.sourceKind,revision:def.sourceRevision}),
   sourceClaim:localSourceClaim(sourceClaim),
   attempts:Object.freeze(results),
   resultStatus:REVIEW_STATUS,
   serverVerified:false,
   replayVerified:false,
   // Scores and raw predictions are intentionally NOT carried across the boundary.
   score:null
 });
}
