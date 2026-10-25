import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildCoverage,extractUpload} from '../server/learner-workspace/extraction.mjs';
import {nativeReview} from '../server/workspace/native-extraction.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function native(bytes,blocks,discovered=blocks.length){
 return {schemaVersion:1,contentSha256:digest(bytes),warnings:['Native text only; diagrams are not interpreted.'],blocks:blocks.map((b,i)=>({blockId:`edge-${i}`,kind:b.kind||'page',text:b.text,locator:b.locator,provenance:{method:'native-parser',reviewed:false}})),coverage:{discoveredUnits:discovered,attemptedUnits:blocks.length,completedUnits:blocks.length,skipped:[],failures:[]}};
}

test('sparse PDF preserves uncovered native page and makes pages beyond OCR bound explicit',async()=>{
 const bytes=Buffer.from('%PDF-1.7 synthetic fixture');
 const raw=native(bytes,[{text:'Opening passage long enough to review',locator:{pageIndex:0}},{text:'',locator:{pageIndex:1}},{text:'Closing passage',locator:{pageIndex:5}}],7);
 const out=await extractUpload(bytes,'.pdf',{runNative:async()=>raw,runOcr:async()=>({pageCount:7,pages:[{text:'OCR recognized page two',locator:{pageIndex:1}}],coverage:{units:[{pageIndex:1,status:'ocr'}]}})});
 assert.deepEqual(out.pages.map(p=>p.locator),['Page 1','Page 2','Page 6']);
 assert.deepEqual(out.coverage.units.slice(0,3).map(x=>x.status),['text','ocr','needs-review']);
 assert.equal(out.coverage.units[4].status,'skipped');
 assert.equal(out.coverage.units[6].status,'skipped');
 assert.equal(out.coverage.visualUnderstanding,false);
});

test('image OCR empty result is a rejected extraction with the production readable-text message',async()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10]);
 await assert.rejects(extractUpload(png,'.png',{runOcr:async()=>({pages:[],pageCount:1})}),/No readable text was found/);
});

test('native review emits stable source locators for slide, spreadsheet cell and table-cell blocks',()=>{
 const bytes=Buffer.from('synthetic native package');
 const run=native(bytes,[
  {kind:'slide',text:'Motor summary',locator:{slideIndex:2,elements:[{slideIndex:2,shapeIndex:0},{slideIndex:2,notesIndex:1}]}},
  {kind:'cell',text:'42',locator:{sheet:'Data',range:'XFD1048576'}},
  {kind:'table-cell',text:'Flow rate',locator:{tableIndex:0,rowIndex:3,cellIndex:1}},
 ]);
 const out=nativeReview(run,digest(bytes));
 assert.deepEqual(out.pages.map(p=>p.locator),['Slide 3','Sheet Data · XFD1048576','Table 1, row 4, cell 2']);
});

test('review truncation is observable in counts and warnings, including byte limit for multibyte text',()=>{
 const bytes=Buffer.from('synthetic review');
 const run=native(bytes,[{text:'a'.repeat(12000),locator:{paragraphIndex:0}},{text:'🌍'.repeat(3000),locator:{paragraphIndex:1}},{text:'b'.repeat(12000),locator:{paragraphIndex:2}},{text:'c'.repeat(12000),locator:{paragraphIndex:3}},{text:'d'.repeat(12000),locator:{paragraphIndex:4}}]);
 const out=nativeReview(run,digest(bytes));
 assert(out.extraction.reviewCharacters<=48000);
 assert(out.extraction.omittedReviewCharacters>0);
 assert(out.extraction.warnings.some(x=>/48,000-character \/ 64 KiB/.test(x)));
 assert(out.pages.reduce((n,p)=>n+Buffer.byteLength(p.text),0)<=65536);
 assert(out.pages.every(p=>!/[\uD800-\uDBFF]$/.test(p.text)));
});

test('coverage explicitly distinguishes unknown total, OCR failure and visual non-understanding',()=>{
 const c=buildCoverage({nativePages:[{locator:{pageIndex:0},text:'usable text'}],ocrPages:[{locator:{pageIndex:1},text:''}],pageCount:null});
 assert.equal(c.units[0].status,'text');
 assert.equal(c.units[1].status,'needs-review');
 assert.equal(c.visualUnderstanding,false);
 assert(c.warnings.some(x=>/unknown/.test(x)));
 assert(c.warnings.some(x=>/manual review/.test(x)));
});
