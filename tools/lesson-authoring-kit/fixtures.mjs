import {createHash} from 'node:crypto';
export function fixture(){
 const text='Synthetic fixture for contract tests. Synchronous field speed equals 120 times frequency in hertz divided by the total number of poles. This is a rotating field calculation, not a measured shaft speed.';
 const reviewedPages=[{text,locator:'Synthetic fixture, section 1',method:'authored-test'}];
 const source={id:'a'.repeat(24),title:'Synthetic fixture only',reviewed:true,reviewedPages,revision:createHash('sha256').update(JSON.stringify(reviewedPages)).digest('hex')};
 const start=text.indexOf('Synchronous'),end=text.indexOf(' This is');
 const citation={page:0,locator:reviewedPages[0].locator,start,end,quote:text.slice(start,end)};
 const lesson={schemaVersion:1,id:'b'.repeat(24),version:1,sourceId:source.id,sourceRevision:source.revision,title:'Synthetic fixture: predict rotating field speed',layout:'split-studio',blocks:[
  {id:'goal',type:'objective',title:'What you will work through',provenance:'authored',citations:[],text:'Predict field speed, check the rule, and explain one limit.'},
  {id:'source-rule',type:'explanation',title:'Check the source rule',provenance:'excerpt',citations:[citation],text:citation.quote},
  {id:'example',type:'worked-example',title:'An authored calculation',provenance:'authored',citations:[citation],text:'With authored inputs 50 Hz and four poles: 120 × 50 ÷ 4 = 1,500 rpm. This is calculated synchronous field speed.'},
  {id:'try',type:'activity',title:'Predict before changing a value',provenance:'authored',citations:[citation],prompt:'Predict field speed for 50 Hz and six poles, then check the local calculator when integrated.',activity:{kind:'motor-field-speed',frequencyHz:50,poles:6}},
  {id:'check',type:'question',title:'Check your reasoning',provenance:'authored',citations:[citation],prompt:'Using the rule with authored inputs 50 Hz and four poles, which result is the synchronous field speed?',options:['1,000 rpm','1,500 rpm','3,000 rpm'],correct:1},
  {id:'reflect',type:'reflection',title:'Explain the limit',provenance:'authored',citations:[],text:'Explain why a calculated rotating-field value should not be presented as measured equipment behaviour.'}
 ]};
 return {source,lesson};
}
