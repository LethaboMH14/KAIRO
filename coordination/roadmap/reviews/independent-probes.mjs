import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createPolicyEngine, PolicyError } from '../../../studio/server/tools-core/policy.mjs';
import { recommendPractice } from '../../../studio/src/adaptive/policy.ts';
import { scenario, acceptedOutcomes } from '../../../studio/src/worksim/model.ts';

const now=1800000000000;
const grant={userId:'reviewer-fixture',tool:'mock.read',action:'read',destination:'local-pane',resource:'synthetic-1',allowedFields:[],documentVersions:{},expiresAt:now+1000,uses:1};
const intent={userId:grant.userId,tool:grant.tool,action:grant.action,destination:grant.destination,resource:grant.resource,fields:{},documentVersions:{},idempotencyKey:'review-probe'};

test('review probe: fractional and unsafe clock cannot mint consent',()=>{
 for(const value of [now+.5,Number.MAX_SAFE_INTEGER+1]){
  const p=createPolicyEngine({clock:()=>value});
  assert.throws(()=>p.mintGrant({...grant,expiresAt:Number.MAX_SAFE_INTEGER}),e=>e instanceof PolicyError&&e.code==='INVALID_CLOCK');
 }
});
test('review probe: primitive-only arrays cannot bypass aggregate payload budget',()=>{
 const p=createPolicyEngine({clock:()=>now,limits:{totalInputBytes:32}});
 assert.throws(()=>p.createIntent({...intent,fields:{values:Array(20).fill(null)}}),e=>e instanceof PolicyError&&e.code==='INPUT_TOO_LARGE');
});
test('review probe: clock failure cannot orphan a consumed queued ticket',()=>{
 let attack=false,calls=0;
 const p=createPolicyEngine({clock:()=>attack?(++calls===1?now:NaN):now});
 const g=p.mintGrant(grant),r=p.request(p.createIntent(intent));
 attack=true;
 let ticket;
 try{ticket=p.authorize(r.requestId,g.id,grant.userId);}catch(e){assert.equal(e.code,'INVALID_CLOCK');}
 attack=false;
 if(!ticket)ticket=p.authorize(r.requestId,g.id,grant.userId);
 assert.equal(p.getLedger().length,1);
 assert.equal(p.execute(ticket.ticketId).status,'succeeded');
});
test('review probe: invalid calendar and coercible support cannot become recall evidence',()=>{
 const request={conceptId:'review-concept',revisions:{source:'s1',task:'t1',rubric:'r1'},now:'2026-10-22T10:00:00Z'};
 const event={eventId:'review-1',conceptId:request.conceptId,taskId:'task-a',sourceRevision:'s1',taskRevision:'t1',rubricRevision:'r1',occurredAt:'2026-02-30T10:00:00Z',correct:true,helpExposure:'none',contextKey:'context-a',assessmentKind:'practice'};
 assert.equal(recommendPractice([event],request).action,'insufficient-data');
 assert.equal(recommendPractice([{...event,occurredAt:'2026-10-21T10:00:00Z',helpExposure:{toString:()=> 'none'}}],request).action,'insufficient-data');
});
test('review probe: independent SQL calculation agrees with published synthetic outcomes',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE rows (row_id TEXT, ticket TEXT, status TEXT, updated TEXT, code TEXT, verified INTEGER)');
  const put=db.prepare('INSERT INTO rows VALUES (?,?,?,?,?,?)');
  for(const row of scenario.records)put.run(row.sourceRowId,row.ticketId,row.status,row.updatedAt,row.resolutionCode,row.customerVerified===null?null:Number(row.customerVerified));
  const values=db.prepare(`WITH ranked AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY ticket ORDER BY updated DESC) AS rank FROM rows)
   SELECT count(*) AS tickets,
    sum(CASE WHEN updated IS NOT NULL AND status='resolved' THEN 1 ELSE 0 END) AS resolved,
    sum(CASE WHEN updated IS NOT NULL AND status='reopened' THEN 1 ELSE 0 END) AS reopened,
    sum(CASE WHEN updated IS NULL THEN 1 ELSE 0 END) AS unknown,
    sum(CASE WHEN updated IS NOT NULL AND status='resolved' AND verified=1 AND length(trim(code))>0 AND updated<'2026-10-22T11:00:00+02:00' THEN 1 ELSE 0 END) AS eligible
   FROM ranked WHERE rank=1`).get();
  const expected=acceptedOutcomes();
  assert.equal(values.tickets,7);assert.equal(values.resolved,5);assert.equal(values.reopened,1);assert.equal(values.unknown,1);assert.equal(values.eligible,2);
  assert.equal(expected.first.uniqueTickets,values.tickets);assert.equal(expected.first.resolvedCurrent,values.resolved);assert.equal(expected.changed.eligibleResolved,values.eligible);
 }finally{db.close();}
});
