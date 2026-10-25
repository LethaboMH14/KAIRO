import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nativeReview} from '../workspace/native-extraction.mjs';
const exec=promisify(execFile),repo=fileURLToPath(new URL('../../../',import.meta.url));
export const allowedExtensions=new Set(['.pdf','.docx','.pptx','.xlsx','.txt','.md','.png','.jpg','.jpeg']);
export function admit(bytes,ext){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>8*1024*1024||!allowedExtensions.has(ext))throw new TypeError('Choose a supported file up to 8 MB.');
 if(ext==='.pdf'&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw new TypeError('This file does not have a PDF signature.');
 if(['.docx','.pptx','.xlsx'].includes(ext)&&!bytes.subarray(0,2).equals(Buffer.from('PK')))throw new TypeError('This Office file is not a valid package.');
 if(ext==='.png'&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new TypeError('Invalid PNG signature.');
 if(['.jpg','.jpeg'].includes(ext)&&!(bytes[0]===255&&bytes[1]===216&&bytes[2]===255))throw new TypeError('Invalid JPEG signature.');
 return {sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,kind:ext==='.pdf'?'pdf':['.png','.jpg','.jpeg'].includes(ext)?'image':'download',mediaType:ext==='.pdf'?'application/pdf':ext==='.png'?'image/png':['.jpg','.jpeg'].includes(ext)?'image/jpeg':'application/octet-stream'};
}
export function buildCoverage({nativePages=[],ocrPages=[],pageCount=null,ocrLimit=4}={}){
 const byPage=new Map();
 for(const page of nativePages){const index=page?.locator?.pageIndex;if(Number.isSafeInteger(index)&&index>=0){const hasText=String(page.text||'').trim();const limited=!hasText&&index>=ocrLimit;byPage.set(index,{locator:`Page ${index+1}`,status:hasText?'text':limited?'skipped':'needs-review',reason:hasText?undefined:limited?'No native text; outside the four-page OCR limit.':'No native text was extracted; OCR may be required.'});}}
 let ocrUsed=0;const ocrSeen=new Set();
 for(const page of ocrPages){const match=typeof page?.locator==='string'?/^Page (\d+)$/.exec(page.locator):null;const index=Number.isSafeInteger(page?.locator?.pageIndex)?page.locator.pageIndex:match?Number(match[1])-1:null;if(!Number.isSafeInteger(index)||index<0||index>=ocrLimit)continue;const prior=byPage.get(index);if(prior?.status==='text')continue;const text=String(page.text||'').trim();if(ocrSeen.has(index)){if(prior?.status==='needs-review'&&text)byPage.set(index,{locator:`Page ${index+1}`,status:'ocr'});continue;}if(ocrUsed>=ocrLimit)break;ocrSeen.add(index);ocrUsed++;byPage.set(index,{locator:`Page ${index+1}`,status:text?'ocr':'needs-review',reason:text?undefined:'OCR was attempted but returned no text.'});}
 const warnings=[];
 if(pageCount===null)warnings.push('Total page count is unknown; coverage is incomplete.');
 else if(Number.isSafeInteger(pageCount)&&pageCount>0){for(let i=0;i<pageCount;i++)if(!byPage.has(i))byPage.set(i,{locator:`Page ${i+1}`,status:'skipped',reason:i>=100?'Outside the 100-unit native extraction limit.':i>=ocrLimit?'Outside the four-page OCR limit; not checked for scanned text.':'No extraction result was returned for this page.'});}
 const units=[...byPage.entries()].sort((a,b)=>a[0]-b[0]).map(([,u])=>u);
 if(units.some(u=>u.status==='skipped'))warnings.push('Some pages were not checked because of processing limits or unavailable extraction results.');
 if(units.some(u=>u.status==='needs-review'))warnings.push('Some pages may need manual review against the original.');
 if(units.some(u=>u.status==='ocr'))warnings.push('OCR text may contain recognition errors; compare it with the original.');
 return {schemaVersion:1,units,warnings,visualUnderstanding:false};
}
function mergePdfPages(nativeBlocks=[],ocrPages=[],ocrLimit=4){
 const grouped=new Map();
 for(const block of nativeBlocks){const index=block?.locator?.pageIndex;if(!Number.isSafeInteger(index)||index<0||typeof block.text!=='string'||!block.text.trim())continue;const current=grouped.get(index)||'';const joined=current?`${current}\n${block.text}`:block.text;grouped.set(index,joined);}
 const ocrByPage=new Map();
 for(const page of ocrPages){const index=page?.locator?.pageIndex;if(!Number.isSafeInteger(index)||index<0||index>=ocrLimit||grouped.has(index)||typeof page.text!=='string'||!page.text.trim()||ocrByPage.has(index))continue;ocrByPage.set(index,page.text.slice(0,16000));}
 const result=[];let characters=0,bytes=0;const all=new Map([...grouped].map(([i,text])=>[i,{text,method:'native-parser'}]));for(const [i,text] of ocrByPage)if(!all.has(i))all.set(i,{text,method:'tesseract-ocr-preview'});
 for(const [index,{text,method}] of [...all.entries()].sort((a,b)=>a[0]-b[0])){
  if(result.length>=100||characters>=48000||bytes>=65536)break;
  const room=Math.min(16000,48000-characters,65536-bytes);let value=text.slice(0,room);
  while(value&&Buffer.byteLength(value)>65536-bytes)value=value.slice(0,-1);
  if(!value.trim())continue;result.push({text:value,locator:`Page ${index+1}`,method});characters+=value.length;bytes+=Buffer.byteLength(value);
 }
 const sourceCharacters=[...all.values()].reduce((sum,item)=>sum+item.text.length,0);
 return {pages:result,characters,bytes,omittedCharacters:Math.max(0,sourceCharacters-characters)};
}
export async function extractUpload(bytes,ext,{runNative,runOcr}={}){
 admit(bytes,ext);const dir=await mkdtemp(join(tmpdir(),'kairo-cloud-import-'));
 try{
  const file=join(dir,'material'+ext);await writeFile(file,bytes,{flag:'wx'});
  const python=process.env.KAIRO_PYTHON||(process.platform==='win32'?join(repo,'tools/course_sources/.venv-ocr/Scripts/python.exe'):'python3');
  const invokeNative=runNative|| (async()=>{const out=await exec(python,[join(repo,'tools/material_ingestion/extract.py'),'--input',file,'--max-units','100'],{windowsHide:true,timeout:120000,maxBuffer:1100000,env:{...process.env,PYTHONIOENCODING:'utf-8'}});return JSON.parse(out.stdout);});
  const invokeOcr=runOcr|| (async()=>{const out=await exec(python,[fileURLToPath(new URL('./ocr.py',import.meta.url)),file],{windowsHide:true,timeout:120000,maxBuffer:1100000,env:{...process.env,PYTHONIOENCODING:'utf-8'}});return JSON.parse(out.stdout);});
  let raw=null,nativePdfFailure=false;
  if(!['.png','.jpg','.jpeg'].includes(ext)){
   try{raw=await invokeNative(file);}catch(error){if(ext!=='.pdf')throw error;nativePdfFailure=true;}
  }
  let result=raw?nativeReview(raw,createHash('sha256').update(bytes).digest('hex')):null;
  const nativePdfPages=(raw?.blocks||[]).filter(b=>Number.isSafeInteger(b.locator?.pageIndex)).map(b=>({locator:b.locator,text:b.text}));
  const nativePageIndexes=new Set(nativePdfPages.filter(p=>String(p.text||'').trim()).map(p=>p.locator.pageIndex));
  const needsPdfOcr=ext==='.pdf'&&(!result||result.extraction.reviewCharacters<80||nativePdfPages.some(p=>p.locator.pageIndex<4&&!String(p.text||'').trim())||Array.from({length:4},(_,i)=>i).some(i=>!nativePageIndexes.has(i)&&i<(raw?.coverage?.discoveredUnits||0)));
  if(ext==='.pdf'){
   const value=needsPdfOcr?await invokeOcr(file):{pages:[],pageCount:raw?.coverage?.discoveredUnits,coverage:{units:[]}};
   const merged=mergePdfPages(raw?.blocks||[],value.pages||[]),pages=merged.pages;
   if(!pages.length)throw new TypeError('No readable text was found. Paste a passage or try a clearer file.');
   const pageCount=Number.isSafeInteger(value.pageCount)?value.pageCount:Number.isSafeInteger(raw?.coverage?.discoveredUnits)?raw.coverage.discoveredUnits:null;
   const coverage=buildCoverage({nativePages:Array.from({length:pageCount||0},(_,i)=>({locator:{pageIndex:i},text:nativePdfPages.filter(p=>p.locator.pageIndex===i).map(p=>p.text).join('\n')})),ocrPages:value.coverage?.units?.filter(u=>u.status==='ocr'||u.status==='needs-review').map(u=>({locator:{pageIndex:u.pageIndex},text:(value.pages||[]).find(p=>p.locator?.pageIndex===u.pageIndex)?.text||''}))||value.pages||[],pageCount,ocrLimit:4});
   const nativeFailureWarning=nativePdfFailure?'Native PDF text extraction was unavailable; OCR preview was used for up to four pages. Compare it with the original.':null;
   if(nativeFailureWarning)coverage.warnings.push(nativeFailureWarning);
   const ocrUnits=value.coverage?.units?.filter(u=>Number.isSafeInteger(u.pageIndex)&&u.pageIndex>=0&&u.pageIndex<4)||[];
   const attemptedOcrIndexes=new Set(ocrUnits.map(u=>u.pageIndex));
   for(const page of value.pages||[])if(Number.isSafeInteger(page?.locator?.pageIndex)&&page.locator.pageIndex>=0&&page.locator.pageIndex<4)attemptedOcrIndexes.add(page.locator.pageIndex);
   const nativeFailureSummary=nativePdfFailure?{schemaVersion:1,discoveredUnits:pageCount,attemptedUnits:attemptedOcrIndexes.size,completedUnits:new Set((value.pages||[]).filter(p=>Number.isSafeInteger(p?.locator?.pageIndex)&&p.locator.pageIndex>=0&&p.locator.pageIndex<4&&String(p.text||'').trim()).map(p=>p.locator.pageIndex)).size,skippedCount:pageCount===null?0:Math.max(0,pageCount-attemptedOcrIndexes.size),failureCount:1}:{};
   result={...(result||{}),pages,extraction:{...(result?.extraction||nativeFailureSummary),reviewSections:pages.length,reviewCharacters:merged.characters,omittedReviewCharacters:merged.omittedCharacters,warnings:[...(result?.extraction?.warnings||[]),...(nativeFailureWarning?[nativeFailureWarning]:[]),...(merged.omittedCharacters?'Merged review content was omitted by the 100-section / 16,000-per-section / 48,000-character / 64 KiB limits.':[])]},limitNote:nativePdfFailure?'Native PDF text extraction was unavailable. OCR preview is limited to four pages and may contain recognition errors. Compare it with the original; formulas, figures and visual meaning have not been analysed.':'Text preview combines native PDF text with OCR for up to four pages when needed. Check OCR, formulas and figures against the original. Visual meaning has not been analysed.',coverage};
  }else if(result)result.coverage={schemaVersion:1,units:[],warnings:['Per-page coverage is unavailable for this source format.'],visualUnderstanding:false};
  if(!result||!result.pages?.some(p=>p.text?.trim())){
   const value=await invokeOcr(file);if(!value.pages?.some(p=>p.text?.trim()))throw new TypeError('No readable text was found. Paste a passage or try a clearer file.');
   result={pages:value.pages,limitNote:'OCR preview of up to four pages. Check formulas and figures against the original. Visual meaning has not been analysed.',coverage:buildCoverage({ocrPages:value.pages,pageCount:value.pageCount,ocrLimit:4})};
  }
  if(!result.pages?.length)throw new TypeError('No readable text was found. Paste a passage instead.');return result;
 }finally{await rm(dir,{recursive:true,force:true});}
}
