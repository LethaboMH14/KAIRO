import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceFor,reviewedPages,validateLesson,localLesson,hash} from '../server/workspace/model.mjs';
import {adaptation,exportNotes,emptyProgress} from '../src/workspace/learning.ts';

const passage='Opening stock is the quantity available at the start of the day. Deliveries increase stock, and sales decrease stock. Closing stock equals opening stock plus deliveries minus sales.';
const source={id:'a'.repeat(24),title:'Stock control',reviewedPages:[{text:passage,locator:'Page 2',method:'OCR',edited:true}]};
test('review preserves page provenance, records corrections and rejects invalid review sizes',()=>{
 const original=[{text:passage,locator:'Page 2',method:'OCR'}];
 const reviewed=reviewedPages([{text:passage+' Corrected.'}],original);
 assert.equal(reviewed[0].locator,'Page 2');assert.equal(reviewed[0].edited,true);assert.notEqual(hash(reviewed),hash(original));
 assert.throws(()=>reviewedPages([],original),/every/);assert.throws(()=>reviewedPages([{text:''}],original),/80/);
});
test('evidence offsets resolve exactly and generation receives at most 12000 characters',()=>{
 const big={...source,reviewedPages:[{...source.reviewedPages[0],text:passage.repeat(100)}]};const evidence=evidenceFor(big);
 assert.equal(evidence.reduce((n,e)=>n+e.quote.length,0),12000);
 for(const e of evidence)assert.equal(big.reviewedPages[0].text.slice(e.start,e.end),e.quote);
});
test('cloud lessons reject fabricated citations and unsupported practice quotations',()=>{
 const evidence=evidenceFor(source);const raw=localLesson(source,evidence);
 assert.equal(validateLesson(raw,evidence).quiz.length,1);
 const invented=structuredClone(raw);invented.chapters[0].citationIds=['made-up'];assert.throws(()=>validateLesson(invented,evidence),/unknown/);
 const unsupported=structuredClone(raw);unsupported.quiz[0].supportQuote='This source proves I passed.';assert.throws(()=>validateLesson(unsupported,evidence),/exact source/);
 const repeated=structuredClone(raw);repeated.quiz[0].options[1]=repeated.quiz[0].options[0];assert.throws(()=>validateLesson(repeated,evidence),/differ/);
});
test('practice adaptation responds to the current question and gives a reason for changed help',()=>{
 assert.equal(adaptation([],0).kind,'start');
 const wrong={question:0,choice:1,correct:false,at:'2026-10-21'};
 assert.match(adaptation([wrong],0).message,/1 incorrect attempt/);assert.equal(adaptation([wrong],1).kind,'start');
 assert.equal(adaptation([wrong,{...wrong,correct:true}],0).kind,'ready');
});
test('notes export retains learner work, source revision, exact citations and scope of achievement',()=>{
 const evidence=evidenceFor(source);const lesson={...localLesson(source,evidence),evidence,revision:'review-v2',createdAt:'2026-10-21',mode:'local-extractive',coverage:'Partial source.',reviewWarning:'Needs source checks.'};
 const notes=exportNotes(lesson,{...emptyProgress(),notes:'My own example',attempts:[{question:0,choice:2,correct:false,at:'now'}]});
 for(const part of ['My own example','review-v2',passage,'Page 2','learner-corrected','not an accredited certificate','try again'])assert.ok(notes.includes(part));
});
