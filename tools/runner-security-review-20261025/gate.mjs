import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const API='https://api.github.com/repos/LethaboMH14/KAIRO';
const WORKFLOW='kairo-agent-reboot-20261025.yml';
const DAY=86400000, MAX_PAGES=20;
const SHA=/^[a-f0-9]{40}$/, EVENTS=['workflow_dispatch','schedule'];
function demand(ok,why){if(!ok)throw Error('BLOCKED: '+why);}
function timestamp(s,now){
 demand(typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s),'invalid timestamp');
 const t=Date.parse(s);demand(Number.isFinite(t)&&t<=now+300000,'invalid or future timestamp');return t;
}
export async function collectRecentAttempts(request,now=Date.now(),maxPages=MAX_PAGES){
 demand(Number.isFinite(now)&&Number.isInteger(maxPages)&&maxPages>0,'invalid limits');
 const result=[],cutoff=now-DAY;
 for(const event of EVENTS){
  let last=Infinity,complete=false;const seen=new Set();
  for(let page=1;page<=maxPages;page++){
   const payload=await request('/actions/workflows/'+WORKFLOW+'/runs?event='+event+'&per_page=100&page='+page);
   demand(payload&&Array.isArray(payload.workflow_runs)&&Number.isSafeInteger(payload.total_count)&&payload.total_count>=0,'incomplete history');
   const rows=payload.workflow_runs;demand(rows.length<=100,'oversized page');
   demand(payload.total_count>=(page-1)*100+rows.length,'inconsistent history total');
   if(rows.length===0){
    // A full previous page with no older page can conceal a provider result cap.
    // Never infer the 24-hour ledger is complete unless page one is genuinely empty.
    demand(page===1&&payload.total_count===0,'missing history page before cutoff');
    complete=true;break;
   }
   for(const row of rows){
    demand(row&&Number.isSafeInteger(row.id)&&row.id>0&&row.event===event,'malformed run');
    demand(!seen.has(row.id),'duplicate history page');seen.add(row.id);
    const t=timestamp(row.created_at,now);demand(t<=last,'unsorted workflow history');last=t;
    if(t>cutoff)result.push(row);
   }
   demand(rows.length===100||payload.total_count<=(page-1)*100+rows.length,'truncated history page');
   if(rows.length<100||last<=cutoff){complete=true;break;}
  }
  demand(complete,'history pagination exhausted before cutoff');
 }
 return result;
}
export async function collectOpenPRs(request,maxPages=MAX_PAGES){
 const result=[],seen=new Set();let complete=false;
 for(let page=1;page<=maxPages;page++){
  const rows=await request('/pulls?state=open&per_page=100&page='+page);
  demand(Array.isArray(rows)&&rows.length<=100,'incomplete PR history');
  for(const row of rows){
   demand(row&&Number.isSafeInteger(row.number)&&row.number>0&&row.state==='open'&&typeof row.head?.ref==='string','malformed PR');
   demand(!seen.has(row.number),'duplicate PR page');seen.add(row.number);result.push(row);
  }
  if(rows.length<100){complete=true;break;}
 }
 demand(complete,'PR pagination exhausted');return result;
}
export async function readLiveSnapshot(request,now=Date.now()){
 const [issue,prs,runs,ref]=await Promise.all([
  request('/issues/13'),collectOpenPRs(request),collectRecentAttempts(request,now),request('/git/ref/heads/main')
 ]);
 demand(issue?.number===13&&issue.state==='open'&&Array.isArray(issue.labels),'issue unavailable');
 demand(SHA.test(ref?.object?.sha),'unverified main SHA');
 return {issue,prs,runs,head:ref.object.sha};
}
export function evaluate(snapshot,{now=Date.now(),runId,attempt,enabled,budgetApproved,execute,selectedSha,selectedBranch,publish=false}={}){
 const no=why=>({ok:false,why});
 if(!enabled||!budgetApproved)return no('owner_or_budget_switch_off');
 if(!execute)return no('dry_run');
 if(!Number.isSafeInteger(runId)||runId<1||attempt!==1)return no('invalid_or_replayed_run');
 if(!snapshot||!SHA.test(snapshot.head))return no('unverified_main');
 const issue=snapshot.issue;
 if(issue?.number!==13||issue.state!=='open'||!Array.isArray(issue.labels))return no('issue_unavailable');
 const labels=issue.labels.map(x=>typeof x==='string'?x:x?.name);
 if(!labels.includes('agent-approved')||labels.some(x=>['agent-blocked','do-not-run'].includes(x)))return no('issue_approval_revoked');
 if(!Array.isArray(snapshot.prs)||!Array.isArray(snapshot.runs))return no('incomplete_ledger');
 if(snapshot.prs.some(x=>x.state==='open'&&x.head?.ref?.startsWith('agent/kairo-13-')))return no('pending_agent_pr');
 if(snapshot.runs.some(x=>x.id!==runId&&EVENTS.includes(x.event)&&timestamp(x.created_at,now)>now-DAY))return no('daily_cap');
 const branch='agent/kairo-13-'+runId;
 if(publish&&(selectedSha!==snapshot.head||selectedBranch!==branch))return no('stale_or_mismatched_selection');
 return {ok:true,sha:snapshot.head,branch};
}
export function inspectSensitivePatch(patch){
 demand(typeof patch==='string'&&patch.length>0&&Buffer.byteLength(patch)<=81920,'invalid patch');
 const patterns=[
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\b(?:sk-[a-zA-Z0-9_-]{12,}|gh[pousr]_[a-zA-Z0-9_]{20,}|github_pat_[a-zA-Z0-9_]{20,}|AKIA[A-Z0-9]{16}|AIza[\w-]{20,}|xox[baprs]-[\w-]{12,})\b/,
  /\b(?:authorization\s*:\s*bearer|(?:password|api[_-]?key|access[_-]?token|secret)\s*[:=]\s*['"][^'"\s]{6,})/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
 ];
 demand(!patterns.some(x=>x.test(patch)),'possible credential or private identifier in patch');
 return true;
}
async function request(path){
 demand(typeof process.env.GITHUB_TOKEN==='string'&&process.env.GITHUB_TOKEN.length>0,'missing GitHub token');
 const r=await fetch(API+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'}});
 demand(r.ok,'GitHub API '+r.status);return r.json();
}
async function main(){
 const command=process.argv[2];
 if(command==='scan-patch'){
  inspectSensitivePatch(await readFile(process.env.KAIRO_PATCH,'utf8'));
  console.log('Pilot patch heuristic scan passed');return;
 }
 demand(['select','publish'].includes(command),'unsupported command');
 const snapshot=await readLiveSnapshot(request);
 const decision=evaluate(snapshot,{
  runId:Number(process.env.GITHUB_RUN_ID),attempt:Number(process.env.GITHUB_RUN_ATTEMPT),
  enabled:process.env.KAIRO_AGENT_ENABLED==='true',budgetApproved:process.env.KAIRO_BUDGET_APPROVED==='true',
  execute:command==='publish'||process.env.GITHUB_EVENT_NAME==='schedule'||process.env.KAIRO_EXECUTE==='true',
  selectedSha:process.env.KAIRO_SELECTED_SHA,selectedBranch:process.env.KAIRO_SELECTED_BRANCH,publish:command==='publish'
 });
 demand(decision.ok,decision.why);
 if(command==='select'){
  demand(typeof process.env.GITHUB_OUTPUT==='string'&&process.env.GITHUB_OUTPUT.length>0,'missing Actions output');
  await appendFile(process.env.GITHUB_OUTPUT,'selected=true\nbase_sha='+decision.sha+'\nbranch='+decision.branch+'\n');
 }
 console.log(command==='publish'?'Live publication authorization rechecked':'Live selection authorization checked');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(e=>{console.error(e.message);process.exitCode=1;});
