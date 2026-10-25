import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {mediaLoadKey,mediaPanelDescriptor,shouldMountPlayer} from '../src/media-panel/presenter.ts';

const studioRoot=fileURLToPath(new URL('..',import.meta.url));
const input=(overrides={})=>({videoId:'abcdefghijk',startSeconds:0,title:'Lecture 1: Introduction',sourceContext:'Source: MIT OpenCourseWare, week 1.',...overrides});

test('fixed-origin descriptor constructs embed and canonical URLs from ID only',()=>{
 const atStart=mediaPanelDescriptor(input());
 assert.equal(atStart.valid,true);
 assert.equal(atStart.embedUrl,'https://www.youtube-nocookie.com/embed/abcdefghijk');
 assert.equal(atStart.canonicalUrl,'https://www.youtube.com/watch?v=abcdefghijk');
 assert.doesNotMatch(atStart.embedUrl,/autoplay|origin=|html/i);
 const clip=mediaPanelDescriptor(input({startSeconds:37}));
 assert.equal(clip.embedUrl,'https://www.youtube-nocookie.com/embed/abcdefghijk?start=37');
 assert.equal(clip.canonicalUrl,'https://www.youtube.com/watch?v=abcdefghijk');
});

test('hostile IDs and unsupported starts fail closed without either URL',()=>{
 for(const videoId of ['', 'abcdefghij','abcdefghijkl','abcdefghijk?autoplay=1','abcdefghijk/evil','<iframe src=x>','abcdefghijk#fragment']){
  const value=mediaPanelDescriptor(input({videoId}));assert.equal(value.valid,false,videoId);assert.equal(value.embedUrl,null);assert.equal(value.canonicalUrl,null);
 }
 for(const startSeconds of [-1,1.5,604801,Number.NaN,Number.POSITIVE_INFINITY,'37',null]){
  const value=mediaPanelDescriptor(input({startSeconds}));assert.equal(value.valid,false,String(startSeconds));assert.equal(value.embedUrl,null);assert.equal(value.canonicalUrl,null);
 }
 assert.equal(mediaPanelDescriptor(input({startSeconds:604800})).valid,true);
});

test('load consent is tied to the exact validated video and start time',()=>{
 const first=mediaPanelDescriptor(input()),otherVideo=mediaPanelDescriptor(input({videoId:'zyxwvutsrq1'})),otherStart=mediaPanelDescriptor(input({startSeconds:12}));
 const consent=mediaLoadKey(first);
 assert.equal(shouldMountPlayer(consent,mediaLoadKey(first)),true);
 assert.equal(shouldMountPlayer(consent,mediaLoadKey(otherVideo)),false);
 assert.equal(shouldMountPlayer(consent,mediaLoadKey(otherStart)),false);
 assert.equal(shouldMountPlayer(consent,mediaLoadKey(mediaPanelDescriptor(input({videoId:'bad'})))),false);
});

test('invalid display metadata is bounded and untrusted content remains plain text',()=>{
 assert.equal(mediaPanelDescriptor(input({title:' '.repeat(201)})).valid,false);
 assert.equal(mediaPanelDescriptor(input({sourceContext:'x'.repeat(1201)})).valid,false);
 const value=mediaPanelDescriptor(input({title:'<script>alert(1)</script>',sourceContext:'<img src=x onerror=alert(1)>'}));
 assert.equal(value.valid,true);assert.equal(value.title,'<script>alert(1)</script>');
});

test('initial React render identifies provider and consent but mounts no external player',async()=>{
 const server=await createServer({root:studioRoot,configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:YouTubeMediaPanel}=await server.ssrLoadModule('/src/media-panel/YouTubeMediaPanel.tsx');
  const html=renderToStaticMarkup(React.createElement(YouTubeMediaPanel,input({title:'<script>title</script>',sourceContext:'<img src=x onerror=alert(1)>'})));
  assert.match(html,/Load YouTube video/);assert.match(html,/not available offline/);assert.match(html,/contacts Google\/YouTube/);
  assert.match(html,/https:\/\/www\.youtube\.com\/watch\?v=abcdefghijk/);
  assert.doesNotMatch(html,/<iframe|youtube-nocookie\.com\/embed/);
  assert.match(html,/&lt;script&gt;title&lt;\/script&gt;/);assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  const invalid=renderToStaticMarkup(React.createElement(YouTubeMediaPanel,input({videoId:'bad'})));
  assert.match(invalid,/unsupported/);assert.doesNotMatch(invalid,/<iframe|youtube-nocookie\.com\/embed/);
 }finally{await server.close();}
});

test('multiple pre-consent panels have unique headings and privacy-description targets',async()=>{
 const server=await createServer({root:studioRoot,configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:YouTubeMediaPanel}=await server.ssrLoadModule('/src/media-panel/YouTubeMediaPanel.tsx');
  const html=renderToStaticMarkup(React.createElement('main',null,
   React.createElement(YouTubeMediaPanel,input({title:'First source'})),
   React.createElement(YouTubeMediaPanel,input({videoId:'zyxwvutsrq1',title:'Second source'}))
  ));
  const headings=[...html.matchAll(/<h2 id="([^"]+)">/g)].map(match=>match[1]);
  const labelledHeadings=[...html.matchAll(/<section class="mp-panel" aria-labelledby="([^"]+)"/g)].map(match=>match[1]);
  const privacyNotes=[...html.matchAll(/<p id="([^"]+)"><strong>Connect to YouTube/g)].map(match=>match[1]);
  const descriptions=[...html.matchAll(/aria-describedby="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(headings.length,2);assert.equal(new Set(headings).size,2);
  assert.deepEqual(labelledHeadings,headings);
  assert.equal(privacyNotes.length,2);assert.equal(new Set(privacyNotes).size,2);
  assert.deepEqual(descriptions,privacyNotes);
  assert.doesNotMatch(html,/<iframe|youtube-nocookie\.com\/embed/);
 }finally{await server.close();}
});
