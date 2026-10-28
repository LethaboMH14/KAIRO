import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

test('unknown storage scope is explicit, actionable, and makes no privacy promise',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,optimizeDeps:{noDiscovery:true,include:[]},plugins:[reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{
  const {StorageScopeNote}=await server.ssrLoadModule('/src/source-workflow-ui/SourceWorkflowPanels.tsx');
  const html=renderToStaticMarkup(React.createElement(StorageScopeNote,{scope:'unknown',label:null}));
  assert.match(html,/Storage location unknown/);
  assert.match(html,/role="status"/);
  assert.match(html,/Check its storage settings before adding private material/);
  assert.doesNotMatch(html,/Stored in your|Stored in this|private cloud/i);
 }finally{await server.close();}
});
