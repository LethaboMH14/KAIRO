import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const py=path.join(root,'tools/course_sources/.venv-ocr/Scripts/python.exe');
const script=path.join(root,'tools/material_ingestion/extract.py');

test('DOCX top-level body preserves paragraph and table order with cell locators',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ingest-order-'));
 try {
  const target=path.join(d,'order.docx');
  const fixture=path.join(d,'make.py');
  fs.writeFileSync(fixture,`from docx import Document\nd=Document();d.add_paragraph('before');t=d.add_table(rows=1,cols=2);t.cell(0,0).text='left';t.cell(0,1).text='right';d.add_paragraph('after');d.save(r'${target.replaceAll('\\','\\\\')}')`);
  const made=spawnSync(py,[fixture],{encoding:'utf8',timeout:15000});
  assert.equal(made.status,0,made.stderr);
  const run=spawnSync(py,[script,'--input',target],{encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(run.stdout);
  assert.deepEqual(out.blocks.map(b=>b.text),['before','left','right','after']);
  assert.deepEqual(out.blocks.map(b=>b.locator),[
   {paragraphIndex:0},{tableIndex:0,rowIndex:0,cellIndex:0},
   {tableIndex:0,rowIndex:0,cellIndex:1},{paragraphIndex:1}
  ]);
  assert.equal(out.coverage.completedUnits,4);
  assert.match(out.warnings.join(' '),/headers, footnotes, comments, nested tables/);
 } finally {fs.rmSync(d,{recursive:true,force:true});}
});

test('formula-only sparse XLSX reports formula text and exact cell coordinates',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ingest-formula-'));
 try {
  const target=path.join(d,'formula.xlsx');
  const fixture=path.join(d,'make.py');
  fs.writeFileSync(fixture,`from openpyxl import Workbook\nw=Workbook();s=w.active;s.title='Forecast';s['B2']='=SUM(B3:B5)';s['XFD1048576']='=1+2';w.save(r'${target.replaceAll('\\','\\\\')}')`);
  const made=spawnSync(py,[fixture],{encoding:'utf8',timeout:15000});
  assert.equal(made.status,0,made.stderr);
  const run=spawnSync(py,[script,'--input',target],{encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(run.stdout);
  assert.deepEqual(out.blocks.map(b=>[b.text,b.locator.sheet,b.locator.range]),[
   ['=SUM(B3:B5)','Forecast','B2'],['=1+2','Forecast','XFD1048576']
  ]);
  assert.equal(out.coverage.discoveredUnits,2);
  assert.equal(out.coverage.completedUnits,2);
  assert.equal(out.blocks.some(b=>b.text==='3'),false,'cached/calculated results are not inferred from formula text');
 } finally {fs.rmSync(d,{recursive:true,force:true});}
});

test('PPTX text locator includes slide shape and speaker-note shape indexes',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ingest-noteloc-'));
 try {
  const target=path.join(d,'notes.pptx');
  const fixture=path.join(d,'make.py');
  fs.writeFileSync(fixture,`from pptx import Presentation\nfrom pptx.util import Inches\nr=Presentation();s=r.slides.add_slide(r.slide_layouts[6]);sh=s.shapes.add_textbox(0,0,Inches(2),Inches(1));sh.text='slide-anchor';s.notes_slide.notes_text_frame.text='note-anchor';r.save(r'${target.replaceAll('\\','\\\\')}')`);
  const made=spawnSync(py,[fixture],{encoding:'utf8',timeout:15000});
  assert.equal(made.status,0,made.stderr);
  const run=spawnSync(py,[script,'--input',target],{encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(run.stdout);
  assert.equal(out.coverage.discoveredUnits,1);
  assert.equal(out.blocks.length,1);
  const loc=out.blocks[0].locator;
  assert.equal(loc.slideIndex,0);
  assert(loc.elements.some(e=>e.slideIndex===0&&Number.isInteger(e.shapeIndex)));
  assert(loc.elements.some(e=>e.slideIndex===0&&Number.isInteger(e.notesIndex)));
  assert(out.blocks[0].text.indexOf('slide-anchor')<out.blocks[0].text.indexOf('note-anchor'));
 } finally {fs.rmSync(d,{recursive:true,force:true});}
});

test('DOCX nested table contents remain outside supported top-level coverage',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ingest-nested-'));
 try {
  const target=path.join(d,'nested.docx');
  const fixture=path.join(d,'make.py');
  fs.writeFileSync(fixture,`from docx import Document\nd=Document();outer=d.add_table(rows=1,cols=1);outer.cell(0,0).text='outer-cell';nested=outer.cell(0,0).add_table(rows=1,cols=1);nested.cell(0,0).text='nested-secret';d.save(r'${target.replaceAll('\\','\\\\')}')`);
  const made=spawnSync(py,[fixture],{encoding:'utf8',timeout:15000});
  assert.equal(made.status,0,made.stderr);
  const run=spawnSync(py,[script,'--input',target],{encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(run.stdout);
  assert.deepEqual(out.blocks.map(b=>[b.text,b.locator]),[
   ['outer-cell\n',{tableIndex:0,rowIndex:0,cellIndex:0}]
  ]);
  assert.equal(out.coverage.completedUnits,1);
  assert.match(out.warnings.join(' '),/nested tables/);
 } finally {fs.rmSync(d,{recursive:true,force:true});}
});
