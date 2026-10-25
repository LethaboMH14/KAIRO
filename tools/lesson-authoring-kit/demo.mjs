import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {fixture} from './fixtures.mjs';
import {proposeChange,applyChange,undoChange,renderReadingReport} from './contract.mjs';
const folder=fileURLToPath(new URL('../../docs/authoring-kit-20261023/demo/',import.meta.url));
await mkdir(folder,{recursive:true});
const {source,lesson}=fixture(),next=structuredClone(lesson);next.version++;next.layout='reading';next.blocks[0].text='Explain the rule in your own words, then check an authored calculation.';
const proposal=proposeChange(lesson,next,source);
// Scripted fixture approval, not evidence that a learner reviewed this proposal.
const applied=applyChange(lesson,proposal,{approvedDigest:proposal.afterDigest},source);
const undone=undoChange(applied.lesson,applied.undo,source);
for(const [name,data] of Object.entries({source,lesson,proposal,applied,undone}))await writeFile(folder+name+'.json',JSON.stringify(data,null,2)+'\n');
await writeFile(folder+'reading-report.html',renderReadingReport(applied.lesson,source));
console.log('Synthetic offline fixture: source -> validated blocks -> proposed edit -> scripted approval -> reading report -> undo revision. No model or live app used.');
