import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {testPython} from './helpers/python-interpreter.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const studioRoot=fileURLToPath(new URL('../',import.meta.url));
const helperUrl=new URL('./helpers/python-interpreter.mjs',import.meta.url);
const probe=`import {testPython} from ${JSON.stringify(helperUrl.href)}; process.stdout.write(JSON.stringify(testPython));`;

function probeResolver(env){
  const run=spawnSync(process.execPath,['--input-type=module','--eval',probe],{
    cwd:studioRoot,env,encoding:'utf8',timeout:15000,windowsHide:true
  });
  assert.equal(run.error,undefined,run.error?.message);
  assert.equal(run.signal,null,run.stderr);
  assert.equal(run.status,0,run.stderr);
  return JSON.parse(run.stdout);
}

test('CI Python resolver honours an explicit KAIRO_PYTHON override',()=>{
  const sentinel='kairo-explicit-interpreter-path';
  assert.equal(probeResolver({...process.env,KAIRO_PYTHON:sentinel}),sentinel);
});

test('CI Python resolver uses the documented portable fallback',()=>{
  const env={...process.env};
  delete env.KAIRO_PYTHON;
  const expected=process.platform==='win32'
    ? join(repoRoot,'tools','course_sources','.venv-ocr','Scripts','python.exe')
    : 'python3';
  assert.equal(probeResolver(env),expected);
});

test('selected CI Python has the supported extraction and fixture libraries',()=>{
  const check=`import sys
assert sys.version_info >= (3, 11), sys.version
import PIL, pytesseract, pypdf, docx, pptx, openpyxl, pypdfium2, reportlab
print('KAIRO extraction Python ready')`;
  const run=spawnSync(testPython,['-c',check],{encoding:'utf8',timeout:20000,windowsHide:true});
  assert.equal(run.error,undefined,`Python interpreter unavailable: ${run.error?.message}`);
  assert.equal(run.signal,null,run.stderr);
  assert.equal(run.status,0,`Extraction dependencies unavailable: ${run.stderr}`);
  assert.match(run.stdout,/KAIRO extraction Python ready/);
});

test('OCR executable is available to the selected CI Python',()=>{
  const run=spawnSync(testPython,['-c',
    'import pytesseract; print(pytesseract.get_tesseract_version())'],{
      encoding:'utf8',timeout:20000,windowsHide:true
    });
  assert.equal(run.error,undefined,run.error?.message);
  assert.equal(run.signal,null,run.stderr);
  assert.equal(run.status,0,`Tesseract unavailable to Python OCR: ${run.stderr}`);
  assert.match(run.stdout,/\d+\.\d+/);
});
