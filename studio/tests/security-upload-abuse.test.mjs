import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {admit,extractUpload} from '../server/learner-workspace/extraction.mjs';
import {nativeReview} from '../server/workspace/native-extraction.mjs';
import {testPython} from './helpers/python-interpreter.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const python=testPython;
const extractor=path.join(projectRoot,'tools/material_ingestion/extract.py');
const MAX_FIXTURE_BYTES=1024*1024;
const pythonScript=String.raw;

function runExtractor(input,extra=[]){
 const run=spawnSync(python,[extractor,'--input',input,...extra],{encoding:'utf8',timeout:12000,maxBuffer:1100000,windowsHide:true});
 assert.equal(run.error,undefined,run.error?.message);
 assert.equal(run.signal,null,`extractor terminated by ${run.signal}`);
 assert.equal(run.status,0,run.stderr);
 assert(Buffer.byteLength(run.stdout)<=1000000,'extractor output must respect its one-megabyte contract');
 return JSON.parse(run.stdout);
}

test('actual upload admission rejects executable and active-document extensions',()=>{
 for(const extension of ['.html','.htm','.svg','.exe','.dll','.js','.mjs','.zip','.7z','.doc','.xls','.ppt']){
  assert.throws(()=>admit(Buffer.from('MZ not executable'),extension),TypeError,extension);
 }
});

test('actual upload admission rejects signature and extension mismatches for supported binary types',()=>{
 for(const [extension,bytes] of [
  ['.pdf',Buffer.from('PK fake office package')],
  ['.docx',Buffer.from('%PDF-1.7')],
  ['.pptx',Buffer.from('MZ')],
  ['.xlsx',Buffer.from('<html>')],
  ['.png',Buffer.from('MZ executable')],
  ['.jpg',Buffer.from('<svg>')],
  ['.jpeg',Buffer.from('GIF89a')],
 ]) assert.throws(()=>admit(bytes,extension),TypeError,extension);
});

test('actual upload admission enforces byte type, nonempty input and eight MiB limit',()=>{
 assert.throws(()=>admit(new Uint8Array([1]),'.txt'),TypeError,'only Buffer is accepted');
 assert.throws(()=>admit(Buffer.alloc(0),'.txt'),TypeError,'empty upload');
 assert.throws(()=>admit(Buffer.alloc(8*1024*1024+1),'.txt'),TypeError,'one byte over the limit');
 const within=admit(Buffer.from('plain UTF-8 study text'),'.txt');
 assert.equal(within.kind,'download');
 assert.equal(within.mediaType,'application/octet-stream');
});

test('actual Python extractor reports a malformed ZIP Office package without publishing blocks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kairo-security-malformed-office-'));
 try{
  const input=path.join(dir,'broken.docx');
  fs.writeFileSync(input,Buffer.from('PK\x03\x04truncated-package'));
  admit(fs.readFileSync(input),'.docx');
  const result=runExtractor(input);
  assert.equal(result.blocks.length,0);
  assert.equal(result.coverage.completedUnits,0);
  assert.equal(result.coverage.failures.length,1);
  assert.match(result.warnings.join(' '),/BadZipFile|not a zip/i);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual Python extractor rejects declared ZIP expansion above its metadata bound before parsing',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kairo-security-zip-metadata-'));
 try{
  const input=path.join(dir,'declared-large.docx');
  const builder=path.join(dir,'build.py');
  const script=pythonScript`import struct,sys,zipfile
from pathlib import Path
target=Path(sys.argv[1])
# Tiny archive payload; only the local/central uncompressed-size metadata is
# raised above the extractor's 80 MiB package-expansion guard.
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_STORED) as z:
    z.writestr('word/document.xml','<w:document/>')
data=bytearray(target.read_bytes())
local=data.find(b'PK\x03\x04')
central=data.find(b'PK\x01\x02')
assert local>=0 and central>=0
struct.pack_into('<I',data,local+22,80*1024*1024+1)
struct.pack_into('<I',data,central+24,80*1024*1024+1)
target.write_bytes(data)
if target.stat().st_size>1024*1024: raise SystemExit('fixture unexpectedly large')
`;
  fs.writeFileSync(builder,script);
  const made=spawnSync(python,[builder,input],{encoding:'utf8',timeout:8000,maxBuffer:20000,windowsHide:true});
  assert.equal(made.error,undefined,made.error?.message);
  assert.equal(made.status,0,made.stderr);
  assert(fs.statSync(input).size<MAX_FIXTURE_BYTES,'fixture must remain below one MiB');
  admit(fs.readFileSync(input),'.docx');
  const result=runExtractor(input);
  assert.equal(result.blocks.length,0);
  assert.equal(result.coverage.failures.length,1);
  assert.match(result.warnings.join(' '),/package expands beyond safety limit/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual extractor output cannot be rebound to another uploaded file hash',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kairo-security-extraction-hash-'));
 try{
  const input=path.join(dir,'lesson.txt');
  fs.writeFileSync(input,'A small synthetic passage has enough characters for safe extraction.');
  const result=runExtractor(input);
  const expected=admit(fs.readFileSync(input),'.txt').sha256;
  const reviewed=nativeReview(result,expected);
  assert.equal(reviewed.pages.length,1);
  assert.throws(()=>nativeReview(result,'0'.repeat(64)),/matched to this upload/);
  const tampered=structuredClone(result);
  tampered.blocks[0].provenance.reviewed=true;
  assert.throws(()=>nativeReview(tampered,expected),/block is invalid/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual image extraction rejects truncated payloads that pass the cheap signature prefilter',async()=>{
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('<html>not a PNG')]);
 const jpeg=Buffer.from([255,216,255,0x3c,0x73,0x76,0x67,0x3e]);
 assert.equal(admit(png,'.png').mediaType,'image/png');
 assert.equal(admit(jpeg,'.jpeg').mediaType,'image/jpeg');
 await assert.rejects(extractUpload(png,'.png'),/cannot identify image file|UnidentifiedImageError/i);
});
