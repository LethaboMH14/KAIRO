import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

test('recovery copy initially discloses personal data and cannot read or download before learner action',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let reads=0;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){reads++;throw new Error('must not read on render');}}});
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:RecoveryCopy}=await server.ssrLoadModule('/src/profile-recovery/RecoveryCopy.tsx');
  const html=renderToStaticMarkup(React.createElement(RecoveryCopy));
  assert.equal(reads,0);assert.match(html,/disabled=""[^>]*>Download recovery copy/);
  assert.match(html,/personal information/);assert.match(html,/does not repair or restore/);
  assert.doesNotMatch(html,/<a[^>]+download|blob:|<script|<iframe/);
 }finally{await server.close();if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
});
