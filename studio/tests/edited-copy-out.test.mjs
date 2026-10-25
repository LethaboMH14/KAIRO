import test from 'node:test';
import assert from 'node:assert/strict';
import { addReadingPack, emptyMemory, packMarkdown, parseMemory } from '../src/continuity/model.ts';
import { emptyProgress, exportNotes } from '../src/workspace/learning.ts';

const sourceId='b'.repeat(24), lessonId='a'.repeat(24), revision='d'.repeat(64);
const quoteOne='A source passage used to explain the relationship between the two ideas.';
const quoteTwo='A second source passage supports a worked example and practice prompt.';
const blocks=[
  {id:'chapter-0-explanation~part.one',kind:'explanation',title:'Build the connection',text:'Read the first idea, then connect it to the second.',citationIds:['E1'],origin:'authored'},
  {id:'chapter-0-worked-example',kind:'worked-example',title:'Try an example',text:'Compare the keys before combining the rows.',citationIds:['E2'],origin:'generated'},
  {id:'question-0',kind:'question',title:'Check the link',text:'Which action checks the relationship?',citationIds:['E2'],origin:'generated',question:{options:['Compare the keys','Guess the result','Skip the source','Copy a heading'],correct:0,supportQuote:'Compare the keys before combining the rows.'}},
  {id:'reflection-1',kind:'reflection',title:'My explanation',text:'I would compare the keys before joining these tables.',citationIds:[],origin:'authored'},
];
const lesson={
  id:lessonId,sourceId,sourceTitle:'Database notes',title:'Join two tables',objective:'Explain how a join connects rows.',
  chapters:blocks.slice(0,2).map(b=>({title:b.title,explanation:b.text,example:'',citationIds:b.citationIds})),
  quiz:[{question:blocks[2].text,options:blocks[2].question.options,correct:0,explanation:'Compare the key values first.',citationIds:['E2'],supportQuote:blocks[2].question.supportQuote}],
  evidence:[
    {id:'E1',sourceId,title:'Database notes',locator:'Page 4',quote:quoteOne,start:0,end:quoteOne.length,edited:false},
    {id:'E2',sourceId,title:'Database notes',locator:'Page 5',quote:quoteTwo,start:0,end:quoteTwo.length,edited:false},
  ],mode:'local-extractive',model:null,revision,createdAt:'2026-10-23T10:00:00.000Z',coverage:'Reviewed passages only.',
  reviewWarning:'Citations provide traceability; they are not an independent fact check.',
  editorDocument:{schemaVersion:1,lessonId,sourceId,sourceRevision:revision,title:'Join two tables',layout:'split',blocks},
};

test('published edited copy saves, parses and exports the ordered safe reading projection',()=>{
  const saved=addReadingPack(emptyMemory(),lesson,'2026-10-23T10:05:00.000Z');
  const reopened=parseMemory(JSON.stringify(saved)).packs[0];
  assert.equal(reopened.editedReading.layout,'split');
  assert.deepEqual(reopened.editedReading.blocks.map(b=>b.kind),['explanation','worked-example','question','reflection']);
  assert.deepEqual(reopened.editedReading.blocks[0].citationIds,['E1']);
  assert.equal(reopened.editedReading.blocks[0].id,undefined);
  assert.deepEqual(reopened.editedReading.blocks[2].options,['Compare the keys','Guess the result','Skip the source','Copy a heading']);
  assert.equal('correct' in reopened.editedReading.blocks[2],false);
  assert.equal('supportQuote' in reopened.editedReading.blocks[2],false);
  assert.equal(reopened.editedReading.blocks[3].text,blocks[3].text);
  assert.deepEqual(reopened.citations.map(c=>c.id),['E1','E2']);

  const progress={...emptyProgress(),notes:'My separate study note.',attempts:[{question:0,choice:0,correct:true,at:'2026-10-23T10:01:00.000Z'}]};
  const md=packMarkdown({...reopened,notes:'My saved reading note.'});
  const exported=exportNotes(lesson,progress);
  for(const output of [md,exported]){
    assert.match(output,/Original arrangement recorded: Split view/);
    assert.ok(output.indexOf('Build the connection')<output.indexOf('Try an example'));
    assert.ok(output.indexOf('Try an example')<output.indexOf('Which action checks the relationship'));
    assert.match(output,/Personal reflection \(ungraded\): My explanation/);
    assert.match(output,/Options \(answer key not included\)/);
    assert.match(output,/Source references: E2/);
    assert.match(output,/E1[\s\S]*A source passage used to explain/);
    assert.match(output,/E2[\s\S]*A second source passage supports/);
    assert.doesNotMatch(output,/supportQuote|correct: 0/);
  }
  assert.match(md,/E1 · Page 4[\s\S]*A source passage used to explain/);
  assert.match(md,/E2 · Page 5[\s\S]*A second source passage supports/);
  assert.match(md,/My saved reading note/);
  assert.match(exported,/My separate study note/);
  assert.match(exported,/Question 1, option 1, supported answer/);
});

test('legacy reading packs still parse and export using the previous chapter layout',()=>{
  const legacy={id:'legacy-lesson',revision:'r1',title:'Old lesson',objective:'Read the source.',sourceTitle:'Old notes',savedAt:'2026-10-23T10:00:00.000Z',chapters:[{title:'Chapter',explanation:'Legacy explanation',example:'Legacy example'}],citations:[{locator:'Page 1',quote:'Exact legacy quote'}],warning:'Legacy warning',notes:'Legacy note'};
  const parsed=parseMemory(JSON.stringify({version:1,theme:'paper',goal:'',packs:[legacy]})).packs[0];
  assert.equal(parsed.editedReading,undefined);
  assert.match(packMarkdown(parsed),/Legacy explanation[\s\S]*Legacy example/);
  assert.match(packMarkdown(parsed),/Page 1[\s\S]*Exact legacy quote/);
  assert.equal(parsed.notes,'Legacy note');
});

test('edited-copy projection strips answer keys and rejects hostile fields, unknown citations and oversized blocks',()=>{
  const valid=addReadingPack(emptyMemory(),lesson,'2026-10-23T10:05:00.000Z');
  const attack=structuredClone(valid);
  attack.packs[0].editedReading.blocks[0].onClick='fetch(secret)';
  assert.throws(()=>parseMemory(JSON.stringify(attack)),/could not be opened/);
  const badCitation=structuredClone(valid);
  badCitation.packs[0].editedReading.blocks[0].citationIds=['private-source'];
  assert.throws(()=>parseMemory(JSON.stringify(badCitation)),/could not be opened/);
  const tooMany=structuredClone(lesson);
  tooMany.editorDocument.blocks=Array.from({length:41},(_,i)=>({...blocks[3],id:`reflection-${i}`}));
  assert.throws(()=>addReadingPack(emptyMemory(),tooMany,'2026-10-23T10:05:00.000Z'),/could not be saved/);
  const tooLarge=structuredClone(lesson);
  tooLarge.editorDocument.blocks=Array.from({length:30},(_,i)=>({...blocks[3],id:`reflection-${i}`,text:'🙂'.repeat(1200)}));
  assert.throws(()=>addReadingPack(emptyMemory(),tooLarge,'2026-10-23T10:05:00.000Z'),/too large/);
});
