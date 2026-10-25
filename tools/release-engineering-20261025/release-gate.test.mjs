import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {inspectLedger,evaluateCandidate,formatReport,PR_GATES,RC_GATES} from './release-gate.mjs';

const main='a'.repeat(40),head='b'.repeat(40);
const pass=(commit,gate)=>({status:'pass',commit,kind:gate==='ci'?'github-actions':'manual-review',url:gate==='ci'?'https://github.com/LethaboMH14/KAIRO/actions/runs/123':'https://github.com/LethaboMH14/KAIRO/issues/11',detail:'Verified against this exact commit; synthetic fixture for test only.'});
const gates=(names,commit)=>Object.fromEntries(names.map(k=>[k,pass(commit,k)]));
function valid(){return {schemaVersion:1,repository:'LethaboMH14/KAIRO',main:{sha:main},pullRequests:[{number:20,state:'open',draft:false,headSha:head,base:'main',dependsOn:[],gates:gates(PR_GATES,head)}],releaseCandidate:{mainSha:main,proposedPrNumbers:[20],gates:gates(RC_GATES,main)}};}
const clone=x=>structuredClone(x);

test('fully evidenced fixture is technically ready, without automatically authorizing a deployment',()=>{
 const result=evaluateCandidate(valid());assert.equal(result.ready,true);assert.equal(result.blockers.length,0);assert.match(formatReport(result),/READY FOR HUMAN REVIEW/);
});
test('original real ledger remains blocked, and gate outputs named blockers',async()=>{
 const url=new URL('./PR-LEDGER.json',import.meta.url);
 const actual=JSON.parse(await readFile(url,'utf8'));const result=evaluateCandidate(actual);
 assert.equal(result.ready,false);assert.equal(result.reports.length,14);
 assert.match(formatReport(result),/PR #1/);assert.ok(result.blockers.some(s=>s.includes('fullJourney')));
});
test('unknown, pending or failed checks never count as green',()=>{
 for(const status of ['pending','fail']){const item=valid();item.pullRequests[0].gates.tenantIsolation={status,detail:'No tenant integration proof'};assert.equal(evaluateCandidate(item).ready,false);}
 assert.throws(()=>{const item=valid();item.pullRequests[0].gates.ci.status='unknown';inspectLedger(item);},/invalid status/);
});
test('stale SHA and borrowed CI evidence are rejected before eligibility',()=>{
 for(const gate of ['ci','tenantIsolation']){const item=valid();item.pullRequests[0].gates[gate].commit=main;assert.throws(()=>inspectLedger(item),/same-head commit/);}
 const item=valid();item.pullRequests[0].gates.ci.url='https://example.com/green';assert.throws(()=>inspectLedger(item),/GitHub Actions run URL/);
});
test('missing independent signoff and private IAM gate block release',()=>{
 const item=valid();item.releaseCandidate.gates.privateIam={status:'pending',detail:'IAM not independently checked'};
 item.pullRequests[0].gates.independentReview={status:'pending',detail:'Await reviewer'};
 const report=evaluateCandidate(item);
 assert.equal(report.ready,false);assert.ok(report.blockers.some(x=>x.includes('privateIam')));assert.ok(report.blockers.some(x=>x.includes('independentReview')));
});
test('stacked dependencies must be explicitly included',()=>{
 const item=valid();item.pullRequests[0].dependsOn=[21];
 assert.equal(evaluateCandidate(item).ready,false);
 assert.match(formatReport(evaluateCandidate(item)),/depends on PR #21/);
});
test('main drift cannot be silently accepted',()=>{
 const item=valid();item.releaseCandidate.mainSha='c'.repeat(40);
 item.releaseCandidate.gates=gates(RC_GATES,'c'.repeat(40));
 assert.match(formatReport(evaluateCandidate(item)),/differs from observed main/);
});
test('CLI uses blocked exit code for actual current ledger',()=>{
 const file=fileURLToPath(new URL('./release-gate.mjs',import.meta.url));
 const ledger=fileURLToPath(new URL('./PR-LEDGER.json',import.meta.url));
 const result=spawnSync(process.execPath,[file,ledger],{encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stdout,/BLOCKED/);
});
test('malformed ledger has an error exit instead of a green outcome',()=>{
 const item=valid();item.pullRequests[0].number=0;
 assert.throws(()=>inspectLedger(item),/Invalid\/duplicate/);
});
