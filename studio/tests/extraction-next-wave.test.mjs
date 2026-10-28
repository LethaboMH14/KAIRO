import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildCoverage,extractUpload} from '../server/learner-workspace/extraction.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function nativeResult(bytes,blocks,discoveredUnits=blocks.length){
 const selected=blocks.filter(block=>String(block.text||'').trim()).map((block,index)=>({blockId:`unit-${index+1}`,kind:block.kind||'page',text:block.text,locator:block.locator,provenance:{method:'native-parser',reviewed:false}}));
 const skipped=blocks.filter(block=>!String(block.text||'').trim()).map(block=>({locator:block.locator,reason:'synthetic blank fixture unit'}));
 return {schemaVersion:1,contentSha256:digest(bytes),blocks:selected,coverage:{discoveredUnits,attemptedUnits:Math.min(discoveredUnits,100),completedUnits:selected.length,skipped,failures:[]},warnings:[]};
}

test('PDF wrapper limits OCR to four distinct source pages while retaining native text beyond that window',async()=>{
 const bytes=Buffer.from('%PDF-next-wave-mixed');
 const raw=nativeResult(bytes,[
  {text:'Native opening text',locator:{pageIndex:0}},
  {text:'',locator:{pageIndex:1}},
  {text:'Native page six text',locator:{pageIndex:5}},
 ],8);
 const ocrPages=Array.from({length:7},(_,pageIndex)=>({text:`Synthetic OCR page ${pageIndex+1}`,locator:{pageIndex}}));
 const result=await extractUpload(bytes,'.pdf',{runNative:async()=>raw,runOcr:async()=>({pageCount:8,pages:ocrPages,coverage:{units:ocrPages.map(page=>({pageIndex:page.locator.pageIndex,status:'ocr'}))}})});
 assert.deepEqual(result.pages.map(page=>page.locator),['Page 1','Page 2','Page 3','Page 4','Page 6']);
 assert.equal(result.pages[1].text,'Synthetic OCR page 2');
 assert.equal(result.pages.some(page=>page.text==='Synthetic OCR page 5'),false);
 assert.deepEqual(result.coverage.units.map(unit=>unit.status),['text','ocr','ocr','ocr','skipped','text','skipped','skipped']);
 assert.equal(result.coverage.visualUnderstanding,false);
});

test('PDF native parser failure uses the bounded OCR fallback and records incomplete native extraction',async()=>{
 const bytes=Buffer.from('%PDF-native-failure');
 const ocrPages=Array.from({length:6},(_,pageIndex)=>({text:`OCR fallback page ${pageIndex+1}`,locator:{pageIndex},method:'tesseract-ocr-preview'}));
 const result=await extractUpload(bytes,'.pdf',{
  runNative:async()=>{throw new Error('synthetic parser failure detail must not reach learner output');},
  runOcr:async()=>({pageCount:6,pages:ocrPages,coverage:{units:ocrPages.map(page=>({pageIndex:page.locator.pageIndex,status:'ocr'}))}}),
 });
 assert.deepEqual(result.pages.map(page=>page.locator),['Page 1','Page 2','Page 3','Page 4']);
 assert(result.pages.every(page=>page.method==='tesseract-ocr-preview'));
 assert(result.extraction.warnings.some(warning=>/native PDF text extraction was unavailable/i.test(warning)));
 assert.doesNotMatch(JSON.stringify(result),/synthetic parser failure detail/);
 assert.equal(result.coverage.units[4].status,'skipped');
 assert.equal(result.coverage.visualUnderstanding,false);
});

test('coverage deduplicates OCR page reports and refuses OCR units outside its page bound',()=>{
 const coverage=buildCoverage({pageCount:6,ocrLimit:4,nativePages:[
  {locator:{pageIndex:0},text:'Native page one'},
  {locator:{pageIndex:1},text:''},
  {locator:{pageIndex:2},text:''},
  {locator:{pageIndex:3},text:''},
  {locator:{pageIndex:4},text:''},
 ],ocrPages:[
  {locator:{pageIndex:1},text:'OCR page two'},
  {locator:{pageIndex:1},text:'Duplicate OCR page two'},
  {locator:{pageIndex:2},text:'OCR page three'},
  {locator:{pageIndex:2},text:'Duplicate OCR page three'},
  {locator:{pageIndex:3},text:'OCR page four'},
  {locator:{pageIndex:4},text:'Over-bound OCR page five'},
 ],});
 assert.deepEqual(coverage.units.map(unit=>unit.status),['text','ocr','ocr','ocr','skipped','skipped']);
 assert.equal(coverage.units[4].reason,'No native text; outside the four-page OCR limit.');
 assert.equal(coverage.visualUnderstanding,false);
 const outOfRange=buildCoverage({pageCount:6,nativePages:[{locator:{pageIndex:4},text:''}],ocrPages:[{locator:{pageIndex:4},text:'Out-of-range OCR'}]});
 assert.equal(outOfRange.units[4].status,'skipped');
 assert.equal(outOfRange.units[4].reason,'No native text; outside the four-page OCR limit.');
});

test('blank page remains visible as needing review when bounded OCR returns no text',async()=>{
 const bytes=Buffer.from('%PDF-blank-page');
 const raw=nativeResult(bytes,[{text:'Readable page one',locator:{pageIndex:0}},{text:'',locator:{pageIndex:1}}],2);
 const result=await extractUpload(bytes,'.pdf',{runNative:async()=>raw,runOcr:async()=>({pageCount:2,pages:[],coverage:{units:[{pageIndex:1,status:'needs-review'}]}})});
 assert.deepEqual(result.pages.map(page=>page.locator),['Page 1']);
 assert.equal(result.coverage.units[1].status,'needs-review');
 assert(result.coverage.warnings.some(warning=>/manual review/i.test(warning)));
});

test('native Office coverage summary remains available while per-page coverage is honestly unavailable',async()=>{
 const bytes=Buffer.from('PK\u0003\u0004synthetic docx');
 const raw=nativeResult(bytes,[
  {text:'First paragraph',locator:{paragraphIndex:0},kind:'paragraph'},
  {text:'Table value',locator:{tableIndex:0,rowIndex:0,cellIndex:0},kind:'table-cell'},
 ],5);
 raw.coverage.skipped=[{locator:{paragraphIndex:1},reason:'empty'}];
 raw.coverage.failures=[{locator:{paragraphIndex:2},code:'synthetic-failure'}];
 const result=await extractUpload(bytes,'.docx',{runNative:async()=>raw,runOcr:async()=>{throw new Error('Office source must not be sent to image OCR');}});
 assert.equal(result.pages.length,2);
 assert.equal(result.extraction.discoveredUnits,5);
 assert.equal(result.extraction.completedUnits,2);
 assert.equal(result.extraction.skippedCount,1);
 assert.equal(result.extraction.failureCount,1);
 assert.equal(result.coverage.units.length,0);
 assert(result.coverage.warnings.some(warning=>/unavailable for this source format/.test(warning)));
 assert.equal(result.coverage.visualUnderstanding,false);
});
