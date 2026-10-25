#!/usr/bin/env node
/** Evidence-driven (not GitHub-connected) release checks. This tool never merges or deploys. */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{40}$/i;
export const PR_GATES=['ci','tenantIsolation','integration','sourceTruth','humanDevice','performance','independentReview','scopeReconciled'];
export const RC_GATES=['mainProtection','privateIam','fullJourney','securityReview','judgeProof','releaseApproval'];
const statuses=new Set(['pass','pending','fail']);
const problem=(s)=>{throw new TypeError(s);};
const validateEvidence=(name,e,sha)=>{
  if(!e||!statuses.has(e.status))problem(`${{name}: missing/invalid status`);
  if(e.status==='pass'){
    if(e.commit!==sha||!e.url||!e.detail)problem(`${{name}: pass requires same-head commit, evidence URL and detail`);
    if(name.endsWith('.ci') && (e.kind!=='github-actions'||!/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(e.url)))
      problem(`${{name}: CI pass needs GitHub Actions run URL and kind`);
  }
};
export function inspectLedger(ledger){
  if(!ledger||ledger.schemaVersion!==1||ledger.repository!=='LethaboMH14/KAIRO')problem('Unsupported ledger/repository');
  if(!SHA.test(ledger.main?.sha||''))problem('Main must have a full commit SHA');
  if(!Array.isArray(ledger.pullRequests)||!ledger.pullRequests.length)problem('No PR ledger entries');
  const seen=new Set();
  for(const pr of ledger.pullRequests){
    if(!Number.isInteger(pr.number)||pr.number<1||seen.has(pr.number))problem('Invalid/duplicate PR number');
    seen.add(pr.number);
    if(!SHA.test(pr.headSha||'')||!pr.base||!['open','closed','merged'].includes(pr.state))problem(`PR #${{pr.number}: invalid Git refs/state`);
    if(!Array.isArray(pr.dependsOn)||pr.dependsOn.some(n=>!Number.isInteger(n)))problem(`PR #${{pr.number}: invalid dependencies`);
    for(const gate of PR_GATES)validateEvidence(`PR #${{pr.number}.${{gate}`,pr.gates?.[gate],pr.headSha);
  }
  const rc=ledger.releaseCandidate;
  if(!rc||!Array.isArray(rc.proposedPrNumbers)||!SHA.test(rc.mainSha||''))problem('Malformed release candidate');
  for(const n of rc.proposedPrNumbers)if(!seen.has(n))problem(`Release references unknown PR #${{n}`);
  for(const gate of RC_GATES)validateEvidence(`Release.${{gate}`,rc.gates?.[gate],rc.mainSha);
  return ledger;
}
const issue=(label,e,blockers)=>{
  if(e.status!=='pass')blockers.push(`${{label}: ${{e.status}${{e.detail?' — '+e.detail:''}`);
};
export function evaluatePR(pr){
  const blockers=[];
  if(pr.state==='closed')blockers.push(`PR #${{pr.number}: closed without recorded merge`);
  if(pr.draft)blockers.push(`PR #${{pr.number}: draft`);
  for(const gate of PR_GATES)issue(`PR #${{pr.number} ${{gate}`,pr.gates[gate],blockers);
  return {number:pr.number,headSha:pr.headSha,ready:!blockers.length,blockers};
}
export function evaluateCandidate(input){
  const ledger=inspectLedger(input);
  const reports=ledger.pullRequests.map(evaluatePR);
  const byNumber=new Map(ledger.pullRequests.map(p=>[p.number,p]));
  const blockers=[];
  const candidate=ledger.releaseCandidate;
  if(candidate.mainSha!==ledger.main.sha)blockers.push('Release main SHA differs from observed main; rebase/review first');
  if(!candidate.proposedPrNumbers.length)blockers.push('Release candidate has no reviewed PRs selected');
  for(const n of candidate.proposedPrNumbers){
    const pr=byNumber.get(n),report=reports.find(r=>r.number===n);
    blockers.push(...report.blockers);
    for(const dep of pr.dependsOn){
      if(!candidate.proposedPrNumbers.includes(dep))blockers.push(`PR #${{n} depends on PR #${{dep}, which is not selected`);
    }
  }
  for(const gate of RC_GATES)issue(`Release ${{gate}`,candidate.gates[gate],blockers);
  return {ready:!blockers.length,blockers,reports,mainSha:ledger.main.sha};
}
export function formatReport(report){
  const lines=[`KAIRO release candidate: ${{report.ready?'READY FOR HUMAN REVIEW':'BLOCKED'} (never an automatic merge/deploy)`, `Main: ${{report.mainSha}`];
  for(const pr of report.reports)lines.push(`PR #${{pr.number} ${{pr.ready?'gates recorded':'pending/blocked'} @ ${{pr.headSha.slice(0,12)} (${{pr.blockers.length} unmet)`);
  lines.push(...report.blockers.map(b=>`BLOCKER: ${{b}`));
  return lines.join('\n');
}
async function cli(){
  const file=process.argv[2];
  if(!file){console.error('Usage: node release-gate.mjs <PR-LEDGER.json>');process.exitCode=2;return;}
  try{const ledger=JSON.parse(await readFile(file,'utf8'));const report=evaluateCandidate(ledger);console.log(formatReport(report));process.exitCode=report.ready?0:1;}
  catch(error){console.error(`Invalid release evidence: ${{error.message}`);process.exitCode=2;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await cli();
