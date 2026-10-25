// Reviewed task allowlist. No arbitrary issue text can grant file ownership.
// Adding a new role/issue requires a separately reviewed repository PR.
export const TASKS=Object.freeze({
  49:Object.freeze({
    role:'studio', enabled:true, requiresMergedPrs:[],
    scopes:['studio/src/studio-scenarios/pump-what-if/','studio/tests/pump-what-if.test.mjs','docs/studio-scenarios/'],
    objective:'Implement and test one source-aware, educationally illustrative pump what-if challenge with keyboard/reading equivalence. Preserve existing pump physics, study flow, source ownership and historical attempt evidence. No shared router edits.',
  }),
  50:Object.freeze({
    role:'kaggle-ml', enabled:true, requiresMergedPrs:[53],
    scopes:['tools/kairo-kaggle-lab/','docs/kaggle-ml-20261025/'],
    objective:'Improve the small auditable source passage relevance training/evaluation baseline with true grouped holdout and clear deterministic comparison. Only use licensed synthetic or public data; do not claim actual Kaggle hosted training or use Kaggle tokens.',
  })
});
const bad=s=>typeof s!=='string'||!s||s.includes('\\')||s.startsWith('/')||s.includes(':')||s.includes('\0')||s.split('/').some(p=>!p||p==='.'||p==='..');
export function allowedPath(task,path){
 if(bad(path)||!task||!Array.isArray(task.scopes))return false;
 return task.scopes.some(scope=>scope.endsWith('/')?path.startsWith(scope)&&path.length>scope.length:path===scope);
}
export function chosenTask({issues=[],pulls=[],mergedPrs={},requestIssue=0}={}){
 for(const key of Object.keys(TASKS).sort((a,b)=>Number(a)-Number(b))){
  const n=Number(key),task=TASKS[n];
  if(requestIssue&&requestIssue!==n||!task.enabled)continue;
  if(task.requiresMergedPrs.some(pr=>mergedPrs[pr]!==true))continue;
  const issue=issues.find(x=>x.number===n&&x.state==='open'&&!x.pull_request);
  if(!issue||issue.labels?.some(l=>['agent-blocked','do-not-run'].includes(typeof l==='string'?l:l.name)))continue;
  if(pulls.some(p=>p.state==='open'&&(p.head?.ref?.startsWith('agent/issue-'+n+'-')||new RegExp('(?:^|\\W)#'+n+'(?:\\W|$)').test(p.body||''))))continue;
  return {issue:n,...task};
 }
 return null;
}
export function validatePaths(task,paths,{limit=20}={}){
 if(!Array.isArray(paths)||!paths.length||paths.length>limit)throw new Error('No changes or too many changed files');
 for(const p of paths)if(!allowedPath(task,p))throw new Error('Out-of-scope path: '+p);
 return paths;
}
export function branchName(issue,runId){
 if(!Number.isSafeInteger(issue)||issue<1||!Number.isSafeInteger(runId)||runId<1)throw new Error('Invalid issue or run');
 return 'agent/issue-'+issue+'-'+runId;
}
