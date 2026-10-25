import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
export const tracked=Object.freeze({engineering:[3,4,6,7,8,9,10,13,14,16,31,46,47,49],qa:[5,11,36,39,51],research:[35,37,38,43,44],studios:[9,49],kaggle:[50],coordination:[11,13,51]});
const hours=(now,then)=>(Date.parse(now)-Date.parse(then))/36e5;
const lanes=n=>Object.entries(tracked).filter(([,ids])=>ids.includes(n)).map(([k])=>k);
export function buildReport({issues=[],prs=[],runs=[],now=new Date().toISOString(),staleHours=24}={}){
 if(!Number.isFinite(Date.parse(now)))throw new TypeError('invalid timestamp');
 const jobs=issues.filter(x=>!x.pull_request&&x.state==='open');
 const roles=Object.fromEntries(Object.keys(tracked).map(k=>[k,{open:0,stale:0,unclaimed:0,items:[]}]));
 const work=jobs.map(i=>{
   const groups=lanes(i.number),age=Math.max(0,Math.floor(hours(now,i.updated_at)));
   const state=age>=staleHours?'NO_RECENT_GITHUB_ACTIVITY':(i.comments||0)===0?'NO_ISSUE_COMMENTS':'RECENT_GITHUB_ACTIVITY';
   for(const group of groups){const r=roles[group];r.open++;r.stale+=Number(age>=staleHours);r.unclaimed+=Number((i.comments||0)===0);r.items.push({issue:i.number,state,ageHours:age});}
   return {issue:i.number,title:i.title||'',lanes:groups,state,ageHours:age,url:i.html_url||'',lastUpdated:i.updated_at};
 });
 const openPullRequests=prs.filter(p=>p.state==='open').map(p=>({pr:p.number,draft:!!p.draft,head:p.head?.sha||'',base:p.base?.ref||'',url:p.html_url||''}));
 const failedRecentWorkflows=runs.filter(r=>r.name!=='KAIRO worker watch'&&r.status==='completed'&&['failure','timed_out','cancelled'].includes(r.conclusion)).map(r=>({id:r.id,conclusion:r.conclusion,url:r.html_url||''})).slice(0,10);
 const attention=work.filter(w=>w.issue!==11&&w.lanes.length&&w.state!=='RECENT_GITHUB_ACTIVITY');
 const summary={issueCount:jobs.length,openPrCount:openPullRequests.length,staleTrackedIssues:attention.filter(x=>x.state==='NO_RECENT_GITHUB_ACTIVITY').length,uncommentedTrackedIssues:attention.filter(x=>x.state==='NO_ISSUE_COMMENTS').length,failingRuns:failedRecentWorkflows.length};
 const fingerprint=createHash('sha256').update(JSON.stringify({attention:attention.map(p=>[p.issue,p.state]).sort((a,b)=>a[0]-b[0]),failingRuns:failedRecentWorkflows.map(x=>[x.id,x.conclusion])})).digest('hex');
 return {kind:'READ_ONLY_GITHUB_STATUS',generatedAt:now,workerExecutionVerified:false,autonomousCodeExecution:false,source:'GitHub metadata, not live local bus',staleAfterHours:staleHours,summary,roles,work,openPullRequests,failedRecentWorkflows,attention,fingerprint};
}
async function github(path,token,options={}){
 const r=await fetch('https://api.github.com'+path,{...options,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'kairo-worker-watch'}});
 if(!r.ok)throw Error('GitHub API '+r.status+' '+path);
 return r.json();
}
async function pages(base,token,max=5){
 let rows=[];for(let page=1;page<=max;page++){const batch=await github(base+(base.includes('?')?'&':'?')+'per_page=100&page='+page,token);if(!Array.isArray(batch))throw Error('Expected list');rows.push(...batch);if(batch.length<100)break;}return rows;
}
export function renderSummary(r){
 const s=r.summary;return '# KAIRO cross-team worker watch\n\nGenerated '+r.generatedAt+' · stale after '+r.staleAfterHours+'h. **Not a coding-agent execution service.**\n\n- '+s.issueCount+' open issues, '+s.openPrCount+' open PRs, '+s.staleTrackedIssues+' tracked stale and '+s.uncommentedTrackedIssues+' un-commented task issues.\n- Dedicated Studio Builder [#49](https://github.com/LethaboMH14/KAIRO/issues/49), Kaggle ML Lab [#50](https://github.com/LethaboMH14/KAIRO/issues/50), true runner [#13](https://github.com/LethaboMH14/KAIRO/issues/13).\n- Recent failed workflows: '+s.failingRuns+'.\n\n'+(r.attention.length?'## Task follow-up needed\n'+r.attention.slice(0,20).map(x=>'- [#'+x.issue+']('+x.url+'): '+x.state+' ('+x.ageHours+'h); '+x.lanes.join(', ')).join('\n'):'No tracked stale or un-commented issues detected.')+'\n\nA comment, new commit or open PR is **not** proof that an agent is actively running or that QA/CI has passed.\n';
}
async function maybePost(report,repo,token){
 const marker='<!-- KAIRO-WORKER-WATCH fingerprint=';
 const comments=await pages('/repos/'+repo+'/issues/11/comments',token,3);
 const last=comments.filter(c=>c.user?.type==='Bot'&&c.body?.includes(marker)).at(-1);
 const sig=marker+report.fingerprint+' -->';
 if(last?.body?.includes(sig)||!(last||report.attention.length||report.failedRecentWorkflows.length))return;
 const body=sig+'\n## Scheduled workforce check\n'+renderSummary(report).slice(0,4400)+'\nThis is GitHub metadata, not a verified live local bus, coding worker or Kaggle training run.\n';
 await github('/repos/'+repo+'/issues/11/comments',token,{method:'POST',body:JSON.stringify({body})});
}
async function main(){
 const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
 if(!token||repo!=='LethaboMH14/KAIRO')throw Error('Requires allowlisted repo and GitHub Actions token');
 const [issues,prs,run]=await Promise.all([pages('/repos/'+repo+'/issues?state=open',token),pages('/repos/'+repo+'/pulls?state=open',token),github('/repos/'+repo+'/actions/runs?per_page=40',token)]);
 const report=buildReport({issues,prs,runs:run.workflow_runs||[]});
 writeFileSync('worker-status.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,renderSummary(report),{flag:'a'});
 if(process.env.KAIRO_WATCH_POST==='true')await maybePost(report,repo,token);
 console.log('KAIRO watch: '+JSON.stringify(report.summary)+'; no worker execution implied');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
