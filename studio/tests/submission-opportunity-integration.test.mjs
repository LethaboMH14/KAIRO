import test from 'node:test';
import assert from 'node:assert/strict';
import {listOpportunities} from '../server/opportunities/index.mjs';

test('learner opportunity default feed includes sourced records with conservative statuses',()=>{
 const {records}=listOpportunities({now:'2026-10-26T21:30:00+02:00',programme:'Mechanical Engineering'});
 const byId=new Map(records.map(record=>[record.id,record]));
 assert.equal(byId.size,records.length,'default feed remains deduplicated');

 const nsfas=byId.get('nsfas-2027-engineering-funding-20261026');
 assert.ok(nsfas);
 assert.equal(nsfas.status,'open');
 assert.equal(nsfas.closesAt,'2026-10-31T21:59:59.000Z');
 assert.equal(nsfas.freshness.status,'current');

 const umngeni=byId.get('umngeni-uthukela-graduate-engineers-2026-rechecked');
 assert.ok(umngeni);
 assert.equal(umngeni.status,'unknown','advert has a closing date but no published time');
 assert.equal(umngeni.closesAt,null);

 const transnet=byId.get('transnet-technical-bursaries-provider-info-20261026');
 assert.ok(transnet);
 assert.equal(transnet.status,'unknown','provider page only links a 2025 form');
 assert.equal(transnet.closesAt,null);

 const originalSeed=new Map(listOpportunities({now:'2026-10-26T21:30:00+02:00'}).records.map(record=>[record.id,record]));
 assert.equal(originalSeed.get('nc-premier-bursary-2027')?.officialUrl,'https://www.northerncape.gov.za/bursary/');
 assert.equal(originalSeed.get('funza-lushaka-bursary-2027')?.checkedAt,'2026-10-25T00:00:00.000Z');
 assert.equal(originalSeed.get('graduates24-bursary-discovery')?.verification,'discovery-only');
});

test('custom opportunity records remain isolated from the appended default seed',()=>{
 const custom={id:'custom-record',title:'Custom engineering record',type:'job',provider:'Test provider',officialUrl:'https://example.org/job',checkedAt:'2026-10-26T00:00:00Z',closesAt:'2026-11-01T00:00:00Z',status:'open',verification:'official',requirements:['Mechanical engineering'],disciplines:['Mechanical Engineering']};
 const {records}=listOpportunities({now:'2026-10-26T12:00:00Z',records:[custom]});
 assert.deepEqual(records.map(record=>record.id),['custom-record']);
});

test('NSFAS record expires automatically after its official 23:59 SAST closing time',()=>{
 const {records}=listOpportunities({now:'2026-11-01T00:00:00+02:00',programme:'Mechanical Engineering'});
 const nsfas=records.find(record=>record.id==='nsfas-2027-engineering-funding-20261026');
 assert.ok(nsfas);
 assert.equal(nsfas.status,'closed');
 assert.equal(nsfas.freshness.status,'expired');
});
