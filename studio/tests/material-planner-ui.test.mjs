import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const brief={goal:'Explain the idea',depth:'standard',approach:'read'};
const citation={locator:'Page 4, paragraph 2',quote:'Synthetic fixture quote only.',sourceId:'synthetic-source',revision:'synthetic-r1'};
const cards=[{title:'Synthetic fixture: motor field',steps:['Read the passage','Explain the field direction'],citation,status:'reviewed-source'},{title:'Synthetic fixture: pump flow',steps:['Compare inlet and outlet'],citation:null,status:'draft'}];
let server,Planner;
test('load actual MaterialPlanner through Vite SSR',async()=>{server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});try{({default:Planner}=await server.ssrLoadModule('/src/material-planner-ui/MaterialPlanner.tsx'));}catch(e){await server.close();throw e;}});
const render=(props={})=>renderToStaticMarkup(React.createElement(Planner,{brief,onChange(){},cards,busy:false,reviewed:true,cloudAvailable:true,...props}));

test('controlled goal/depth/approach inputs expose current state and selection labels',()=>{const html=render();assert.match(html,/Your goal/);assert.match(html,/Explain the idea/);assert.match(html,/aria-pressed="true">Standard/);assert.match(html,/aria-pressed="true">Read/);assert.match(html,/Planning outline/);});
test('actual component handlers emit bounded controlled changes',()=>{let next;const root=Planner({brief,onChange:value=>next=value,cards,busy:false,reviewed:true,cloudAvailable:true});const children=root.props.children;const textarea=children.find(child=>child?.type==='textarea');textarea.props.onChange({target:{value:'x'.repeat(350)}});assert.equal(next.goal.length,300);const fieldsets=children.filter(child=>child?.type==='fieldset');const deep=fieldsets[0].props.children[1].props.children.find(child=>child.props.children==='More detail');deep.props.onClick();assert.equal(next.depth,'deep');const practice=fieldsets[1].props.children[1].props.children.find(child=>child.props.children==='Practise');practice.props.onClick();assert.equal(next.approach,'practice');});
test('busy disables controls and direct event handlers cannot emit changes',()=>{let calls=0;const root=Planner({brief,onChange(){calls++},cards,busy:true,reviewed:true,cloudAvailable:true});const fieldsets=root.props.children.filter(child=>child?.type==='fieldset');fieldsets.forEach(group=>group.props.children[1].props.children.forEach(button=>button.props.onClick()));assert.equal(calls,0);assert.match(render({busy:true}),/disabled/);});
test('citations require reviewed source and exact passage context; drafts show review instruction',()=>{const html=render();assert.match(html,/Page 4, paragraph 2/);assert.match(html,/title="synthetic-r1">version synthet</);assert.match(html,/Synthetic fixture quote only/);assert.match(html,/Review and save your source to attach a citation/);assert.doesNotMatch(render({reviewed:false}),/Synthetic fixture quote only/);});
test('outline is not presented as a generated lesson and has empty state',()=>{assert.match(render(),/planning outline, not a generated lesson/);assert.match(render({cards:[]}),/No outline cards yet/);assert.match(render({cards:[]}),/role="status"/);});
test('learner copy and source content are escaped; no fake score or model claim',()=>{const evil={title:'<script>bad()</script>',steps:['<img src=x onerror=bad()>'],citation:{...citation,quote:'<b>bad</b>'},status:'reviewed-source'};const html=render({cards:[evil]});assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);assert.match(html,/&lt;b&gt;bad/);assert.doesNotMatch(html,/<script>|<img|<b>/);assert.doesNotMatch(html,/confidence|AI score|mastery \d+%/i);});
test('card list is bounded to three and local reading keeps exact passages',()=>{assert.equal((render({cards:[...cards,...cards]}).match(/class="mp-card"/g)||[]).length,3);assert.match(render({cloudAvailable:false}),/Cloud request unavailable/);assert.match(render({cloudAvailable:false}),/local reading uses the exact source passages/);});
test('close SSR server',async()=>{await server.close();server=undefined;});
