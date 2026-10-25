import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePassage,validatePassageHelp} from '../server/workspace/passages.mjs';
import {sentences,validSpan,annotationKey,parseAnnotations,toggleAnnotation,annotationMarkdown,parseSettings,allowedTeacherAction} from '../src/teacher/model.ts';
const passage='Opening stock is available at the start. Deliveries increase stock; sales decrease stock. The count is 23.';
const doc={id:'a'.repeat(24),revision:'review-v1',reviewed:true,reviewedPages:[{text:passage,locator:'Page 2'}]};
const request={kind:'source',revision:'review-v1',section:0,start:0,end:39,action:'explain'};
test('passages resolve server-owned text and reject stale versions, unreviewed material and injected actions',()=>{
 const result=resolvePassage(doc,request);assert.equal(result.selection,passage.slice(0,39));assert.equal(result.provenance.locator,'Page 2');
 for(const change of [{revision:'old'},{start:-1},{end:9999},{section:5},{action:'run_javascript'},{action:'translate',language:'unknown'}])assert.throws(()=>resolvePassage(doc,{...request,...change}),TypeError);
 assert.throws(()=>resolvePassage({...doc,reviewed:false},request),/reviewed/);
 const lesson={id:'lesson',revision:'r1',evidence:[{id:'S1',quote:passage,locator:'Slide 1'}]};
 assert.equal(resolvePassage(lesson,{...request,kind:'lesson',revision:'r1',evidenceId:'S1'}).provenance.locator,'Slide 1');
 assert.throws(()=>resolvePassage(lesson,{...request,kind:'lesson',revision:'r1',evidenceId:'made-up'}),/known/);
});
test('teacher output must retain a real exact anchor and label translations as drafts',()=>{
 const context=resolvePassage(doc,{...request,action:'translate',language:'Afrikaans'});const raw={text:'Voorraad is beskikbaar aan die begin.',anchorQuote:'Opening stock is available at the start.',citationId:'P1'};
 const result=validatePassageHelp(raw,context);assert.equal(result.translationDraft,true);assert.equal(result.provenance.revision,'review-v1');
 assert.throws(()=>validatePassageHelp({...raw,anchorQuote:'The source proves everything.'},context),/anchor/);
 assert.throws(()=>validatePassageHelp({...raw,citationId:'internet'},context),/anchor/);
});
test('sentence offsets preserve source text including decimal numbers, paragraphs and repeated passages',()=>{
 const text='Price is 12.50 rand.\n\nStock increases! Stock increases!';const parts=sentences(text);
 assert.equal(parts[0].text,'Price is 12.50 rand.');for(const p of parts)assert.equal(text.slice(p.start,p.end),p.text);
 assert.notEqual(parts[1].start,parts[2].start);assert.throws(()=>validSpan(text,0,1201));const blank=text.indexOf('\n');assert.throws(()=>validSpan(text,blank,blank+2));
});
test('annotations toggle exact spans and cannot silently attach to a changed revision',()=>{
 const c={kind:'source',id:'a',revision:'v1',section:0};const span=validSpan(passage,0,39);const marked=toggleAnnotation([],span,'highlight','mark1','now');
 assert.equal(parseAnnotations(JSON.stringify(marked),passage).length,1);assert.equal(parseAnnotations(JSON.stringify(marked),'Changed '+passage).length,0);
 assert.notEqual(annotationKey(c),annotationKey({...c,revision:'v2'}));assert.equal(toggleAnnotation(marked,span,'highlight','mark2','later').length,0);
 const out=annotationMarkdown('Course passage',c,marked);assert.ok(out.includes('v1'));assert.ok(out.includes(span.text));assert.ok(out.includes('characters 0–39'));
});
test('settings are bounded and teacher action registry never accepts arbitrary execution or arbitrary targets',()=>{
 const p=parseSettings(JSON.stringify({look:'evil',language:'unknown',voiceURI:'test',rate:9}));assert.equal(p.look,'soft3d');assert.equal(p.language,'en-ZA');assert.equal(p.rate,1.2);
 assert.equal(allowedTeacherAction({type:'focus_source',target:'source-reader'}),true);assert.equal(allowedTeacherAction({type:'focus_source',target:'delete-everything'}),false);assert.equal(allowedTeacherAction({type:'execute',code:'...'}),false);
});
