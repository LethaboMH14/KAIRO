import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {listOpportunities} from '../server/opportunities/index.mjs';

const data=JSON.parse(await readFile(new URL('../data/submission-opportunities-20261026/records.json',import.meta.url),'utf8'));

test('official opportunity batch passes the existing freshness and safety validator',()=>{
 const result=listOpportunities({now:data.checkedAt,records:data.records,programme:data.profileContext.programme});
 assert.equal(result.records.length,3);
 const umngeni=result.records.find(item=>item.id==='umngeni-uthukela-graduate-engineers-2026-rechecked');
 const nsfas=result.records.find(item=>item.id==='nsfas-2027-engineering-funding-20261026');
 const transnet=result.records.find(item=>item.id==='transnet-technical-bursaries-provider-info-20261026');
 assert.equal(nsfas.status,'open');
 assert.equal(nsfas.freshness.status,'current');
 assert.equal(nsfas.closesAt,'2026-10-31T21:59:59.000Z');
 assert.equal(data.records.find(item=>item.id===nsfas.id).eligibility,'unknown');
 assert.equal(umngeni.status,'unknown');
 assert.equal(umngeni.closesAt,null);
 assert.equal(transnet.status,'unknown');
 assert.equal(transnet.closesAt,null);
 assert.equal(transnet.freshness.status,'needs-check');
});

test('NSFAS opportunity closes at the declared South African deadline and then becomes closed',()=>{
 const afterDeadline=listOpportunities({now:'2026-11-01T00:00:00+02:00',records:data.records}).records;
 assert.equal(afterDeadline.find(item=>item.id==='nsfas-2027-engineering-funding-20261026').status,'closed');
 assert.equal(afterDeadline.find(item=>item.id==='transnet-technical-bursaries-provider-info-20261026').status,'unknown');
});
