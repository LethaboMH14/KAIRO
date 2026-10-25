import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildCoverage,extractUpload} from '../server/learner-workspace/extraction.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function nativeResult(bytes,pages){
 const blocks=pages.filter(p=>p.text).map((p,i)=>({blockId:`b${i+1}`,kind:'page',text:p.text,locator:{pageIndex:p.index},provenance:{method:'native-parser',reviewed:false}}));
 return {schemaVersion:1,contentSha256:hash(bytes),blocks,coverage:{discoveredUnits:pages.length,attemptedUnits:pages.length,completedUnits:blocks.length,skipped:pages.filter(p=>!p.text).map(p=>({locator:{pageIndex:p.index}})),failures:[]},warnings:[]};
}

test('production coverage helper preserves native text and marks mixed, limited PDF pages honestly',()=>{
 const coverage=buildCoverage({pageCount:7,ocrLimit:4,nativePages:[
  {locator:{pageIndex:0},text:'Native lecture notes'},
  {locator:{pageIndex:1},text:''},
  {locator:{pageIndex:2},text:'Native equation'},
 ],ocrPages:[{locator:{pageIndex:1},text:'Scanned annotation'}]});
 assert.deepEqual(coverage.units.map(unit=>unit.status),['text','ocr','text','skipped','skipped','skipped','skipped']);
 assert.equal(coverage.visualUnderstanding,false);
 assert(coverage.units[4].reason.includes('four-page OCR limit'));
});

test('injected production extractor combines sparse mixed PDF pages without replacing native anchors',async()=>{
 const bytes=Buffer.from('%PDF-test fixture');
 const raw=nativeResult(bytes,[{index:0,text:'Native opening passage'},{index:1,text:''},{index:2,text:'Native closing passage'}]);
 const result=await extractUpload(bytes,'.pdf',{
  runNative:async()=>raw,
  runOcr:async()=>({pageCount:6,pages:[{text:'OCR scan text',locator:{pageIndex:1},method:'tesseract-ocr-preview'}],coverage:{units:[{pageIndex:0,status:'needs-review'},{pageIndex:1,status:'ocr'},{pageIndex:2,status:'needs-review'},{pageIndex:3,status:'needs-review'}]}}),
 });
 assert.deepEqual(result.pages.map(page=>[page.locator,page.text]),[
  ['Page 1','Native opening passage'],['Page 2','OCR scan text'],['Page 3','Native closing passage'],
 ]);
 assert.deepEqual(result.coverage.units.slice(0,3).map(unit=>unit.status),['text','ocr','text']);
 assert.equal(result.coverage.units[5].status,'skipped');
 assert.equal(result.coverage.visualUnderstanding,false);
});

test('production extractor still OCRs a missing scanned page when native text exceeds the sparse-text threshold',async()=>{
 const bytes=Buffer.from('%PDF-long-native-and-scan');
 const raw=nativeResult(bytes,[{index:0,text:'N'.repeat(100)},{index:1,text:''},{index:2,text:'End of source'}]);
 let ocrCalls=0;
 const result=await extractUpload(bytes,'.pdf',{
  runNative:async()=>raw,
  runOcr:async()=>{ocrCalls++;return {pageCount:3,pages:[{text:'Scanned page text',locator:{pageIndex:1},method:'tesseract-ocr-preview'}],coverage:{units:[{pageIndex:0,status:'needs-review'},{pageIndex:1,status:'ocr'},{pageIndex:2,status:'needs-review'}]}};},
 });
 assert.equal(ocrCalls,1);
 assert.deepEqual(result.pages.map(page=>page.locator),['Page 1','Page 2','Page 3']);
 assert.equal(result.pages[1].text,'Scanned page text');
});

test('PDF merge aggregates duplicate page blocks and preserves section, total and unit caps',async()=>{
 const bytes=Buffer.from('%PDF-duplicate-blocks');
 const blocks=[];
 for(let part=0;part<2;part++)blocks.push({blockId:`p0-${part}`,kind:'page',text:'x'.repeat(9000),locator:{pageIndex:0},provenance:{method:'native-parser',reviewed:false}});
 for(let page=1;page<99;page++)blocks.push({blockId:`p${page}`,kind:'page',text:'y'.repeat(1000),locator:{pageIndex:page},provenance:{method:'native-parser',reviewed:false}});
 const raw={schemaVersion:1,contentSha256:hash(bytes),blocks,coverage:{discoveredUnits:99,attemptedUnits:99,completedUnits:blocks.length,skipped:[],failures:[]},warnings:[]};
 const result=await extractUpload(bytes,'.pdf',{runNative:async()=>raw,runOcr:async()=>{throw new Error('OCR should not run for fully native pages');}});
 assert.equal(result.pages.length,33,'the 48,000-character aggregate limit bounds the returned sections');
 assert(result.pages.every(page=>page.locator.startsWith('Page ')));
 assert(result.pages.every(page=>page.text.length<=16000));
 assert(result.pages.reduce((sum,page)=>sum+page.text.length,0)<=48000);
 assert.equal(result.pages[0].text.length,16000,'same-page native blocks combine into one section capped at 16,000 characters');
});

test('PDF merge does not exceed one hundred review sections',async()=>{
 const bytes=Buffer.from('%PDF-one-hundred-sections');
 const blocks=Array.from({length:100},(_,page)=>({blockId:`p${page}`,kind:'page',text:'source',locator:{pageIndex:page},provenance:{method:'native-parser',reviewed:false}}));
 const raw={schemaVersion:1,contentSha256:hash(bytes),blocks,coverage:{discoveredUnits:100,attemptedUnits:100,completedUnits:100,skipped:[],failures:[]},warnings:[]};
 const result=await extractUpload(bytes,'.pdf',{runNative:async()=>raw,runOcr:async()=>{throw new Error('OCR should not run for fully native pages');}});
 assert.equal(result.pages.length,100);
});

test('image OCR retains string locator and reports known OCR coverage',async()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10,1]);
 const result=await extractUpload(png,'.png',{runOcr:async()=>({pageCount:1,pages:[{text:'Image notes',locator:'Page 1',method:'tesseract-ocr-preview'}],coverage:{units:[{pageIndex:0,status:'ocr'}]}})});
 assert.equal(result.pages[0].locator,'Page 1');
 assert.equal(result.coverage.units[0].status,'ocr');
});

test('unknown document length is surfaced instead of inventing page coverage',()=>{
 const coverage=buildCoverage({pageCount:null,nativePages:[{locator:{pageIndex:0},text:'Known text'}]});
 assert.equal(coverage.units.length,1);
 assert(coverage.warnings.some(warning=>/unknown/.test(warning)));
});
