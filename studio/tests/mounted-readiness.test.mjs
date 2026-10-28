import test from 'node:test';
import assert from 'node:assert/strict';
import {listOpportunities} from '../server/opportunities/index.mjs';
const record={id:'synthetic',title:'Synthetic bursary',type:'bursary',provider:'Synthetic provider',officialUrl:'https://example.org/apply',checkedAt:'2026-10-25',closesAt:'2026-11-01',requirements:[],disciplines:['Engineering'],status:'open',verification:'official'};
test('mounted curator attaches canonical freshness and never labels incomplete metadata open',()=>{
 const result=listOpportunities({now:'2026-10-25T12:00:00.000Z',records:[record]}).records[0];
 assert.equal(result.status,'unknown');assert.equal(result.freshness.status,'needs-check');assert(result.freshness.reasons.includes('missing-requirements'));
});
test('mounted curator preserves closed and discovery meanings while mapping fresh complete metadata',()=>{
 const ready={...record,requirements:['Synthetic requirement']};
 assert.equal(listOpportunities({now:'2026-10-25T12:00:00.000Z',records:[ready]}).records[0].status,'open');
 assert.equal(listOpportunities({now:'2026-10-25T12:00:00.000Z',records:[{...ready,status:'closed'}]}).records[0].status,'closed');
 assert.equal(listOpportunities({now:'2026-10-25T12:00:00.000Z',records:[{...ready,verification:'discovery-only'}]}).records[0].status,'unknown');
});
