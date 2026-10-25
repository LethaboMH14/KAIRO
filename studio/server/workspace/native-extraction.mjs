const integer=value=>Number.isSafeInteger(value)&&value>=0;
const bounded=(value,max)=>typeof value==='string'&&value.length<=max;
export function nativeReview(result,expectedHash){
 if(result?.schemaVersion!==1||!/^[a-f0-9]{64}$/.test(result.contentSha256||'')||result.contentSha256!==expectedHash||!Array.isArray(result.blocks)||result.blocks.length>200)throw new TypeError('The extraction could not be matched to this upload.');
 const c=result.coverage;
 if(!c||(c.discoveredUnits!==null&&!integer(c.discoveredUnits))||!integer(c.attemptedUnits)||!integer(c.completedUnits)||!Array.isArray(c.skipped)||!Array.isArray(c.failures)||c.skipped.length>20000||c.failures.length>20000||!Array.isArray(result.warnings))throw new TypeError('Extraction coverage is invalid.');
 if(c.completedUnits!==result.blocks.length)throw new TypeError('Extraction coverage does not match its blocks.');
 const seen=new Set();const pages=[];let remaining=48000,remainingBytes=65536,omitted=0;
 function locator(l){
  if(!l||typeof l!=='object'||Array.isArray(l))throw new TypeError('Extraction locator is missing.');
  if(integer(l.pageIndex))return `Page ${l.pageIndex+1}`;
  if(integer(l.slideIndex))return `Slide ${l.slideIndex+1}`;
  if(bounded(l.sheet,200)&&bounded(l.range,30))return `Sheet ${l.sheet} · ${l.range}`;
  if(integer(l.paragraphIndex))return `Paragraph ${l.paragraphIndex+1}`;
  if(integer(l.tableIndex)&&integer(l.rowIndex)&&integer(l.cellIndex))return `Table ${l.tableIndex+1}, row ${l.rowIndex+1}, cell ${l.cellIndex+1}`;
  if(integer(l.sectionIndex))return `Section ${l.sectionIndex+1}`;
  throw new TypeError('Extraction locator is unsupported.');
 }
 for(const block of result.blocks){
  if(!bounded(block.blockId,100)||!block.blockId||seen.has(block.blockId)||!bounded(block.text,12000)||!bounded(block.provenance?.method,100)||block.provenance?.reviewed!==false)throw new TypeError('Extraction block is invalid.');
  seen.add(block.blockId);const label=locator(block.locator);
  if(!block.text.trim())continue;
  let included=pages.length<100?Math.min(block.text.length,remaining):0;
  if(Buffer.byteLength(block.text.slice(0,included))>remainingBytes){
    let low=0,high=included;while(low<high){const middle=Math.ceil((low+high)/2);if(Buffer.byteLength(block.text.slice(0,middle))<=remainingBytes)low=middle;else high=middle-1;}included=low;
  }
  if(included>0&&/[\uD800-\uDBFF]/.test(block.text[included-1]))included--;
  omitted+=block.text.length-included;
  if(included){const selected=block.text.slice(0,included);pages.push({text:selected,locator:label,method:block.provenance.method});remaining-=included;remainingBytes-=Buffer.byteLength(selected);}
 }
 const warnings=result.warnings.filter(x=>typeof x==='string').map(x=>x.slice(0,350)).slice(0,12);
 if(c.failures.length)warnings.push('Some source units could not be extracted. Compare them with your original.');
 if(c.skipped.length)warnings.push('Some content was skipped or needs OCR. Native text extraction does not interpret diagrams.');
 if(omitted)warnings.push('The review workspace has a 48,000-character / 64 KiB text limit; additional extracted text is not included in this review.');
 const extraction={schemaVersion:1,discoveredUnits:c.discoveredUnits,attemptedUnits:c.attemptedUnits,completedUnits:c.completedUnits,reviewSections:pages.length,reviewCharacters:48000-remaining,omittedReviewCharacters:omitted,skippedCount:c.skipped.length,failureCount:c.failures.length,warnings};
 return {pages,extraction,limitNote:`Native text: ${c.completedUnits} unit(s) extracted; ${pages.length} review section(s), ${extraction.reviewCharacters.toLocaleString('en-US')} characters. ${c.discoveredUnits===null?'Total source units unknown after the processing limit.':`${c.discoveredUnits} source unit(s) found.`} ${c.skipped.length?'Some content was skipped. ':''}${omitted?'The review text is capped at 48,000 characters / 64 KiB. ':''}Images, diagrams and scanned text need a separate check. This text is not yet reviewed.`};
}
