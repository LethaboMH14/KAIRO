import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// All labels and values below are synthetic test fixtures, not curricula or learner records.
const attempt = overrides => ({ id: 'synthetic-attempt-1', topicLabel: 'Synthetic fixture: Ohm law', sourceRevision: 'synthetic-r1', outcome: 'correct', assistance: 'none', recordedAt: '2026-10-23T10:00:00Z', ...overrides });
let server, Card;
test('load actual card through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Card } = await server.ssrLoadModule('/src/practice-milestone-ui/PracticeMilestoneCard.tsx')); } catch (error) { await server.close(); throw error; }
});
const html = (item=attempt(), progression=null, props={}) => renderToStaticMarkup(React.createElement(Card, { attempt:item, progression, busy:false, ...props }));
const visibleText = markup => markup.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ');

test('assisted and unassisted correct attempts are distinct and truthful', () => {
  const assisted=html(attempt({assistance:'hint'})); assert.match(assisted,/Correct answer/); assert.match(assisted,/Help was used/); assert.match(assisted,/A hint was used/);
  const unassisted=html(attempt()); assert.match(unassisted,/No help used/); assert.doesNotMatch(unassisted,/Help was used/);
});
test('needs-review, unscored reflection and unknown assistance remain explicit', () => {
  assert.match(html(attempt({outcome:'needs-review',assistance:'worked-example'})),/Needs another look/);
  const reflected=html(attempt({outcome:'unscored',assistance:'unknown'})); assert.match(reflected,/Reflection only · not scored/); assert.match(reflected,/Help used is unknown/); assert.doesNotMatch(reflected,/pass|mastery/i);
  const unknownCorrect=html(attempt({outcome:'correct',assistance:'unknown'})); assert.match(unknownCorrect,/Correct answer/); assert.match(unknownCorrect,/Help used is unknown/); assert.doesNotMatch(unknownCorrect,/Help was used/);
});
test('invalid timestamps and untrusted long text are safely presented as text', () => {
  const rendered=html(attempt({topicLabel:'<img src=x onerror=run()>'.repeat(50),sourceRevision:'<script>bad</script>',recordedAt:'invalid'}));
  assert.match(rendered,/&lt;img/); assert.doesNotMatch(rendered,/<img|<script>/); assert.match(rendered,/Time not available/); assert.match(rendered,/Source revision:/);
});
test('progress appears only for finite valid activity counts, never clamped', () => {
  assert.match(html(attempt(),{completed:2,total:5}),/2 of 5 activities recorded/);
  for(const value of [null,{completed:NaN,total:5},{completed:1,total:Infinity},{completed:-1,total:5},{completed:1.2,total:5},{completed:6,total:5},{completed:0,total:0}]) assert.doesNotMatch(html(attempt(),value),/activities recorded/);
});
test('missing callbacks render no dead controls; provided controls invoke callbacks once', () => {
  assert.doesNotMatch(html(),/<button/); let kept=0, reviewed=0;
  const element=Card({attempt:attempt(),progression:null,busy:false,onKeepWork(){kept++},onReviewSource(){reviewed++}});
  const actions=element.props.children.find(child=>child?.props?.className==='pm-actions');
  actions.props.children[0].props.onClick(); actions.props.children[1].props.onClick(); assert.equal(kept,1); assert.equal(reviewed,1);
});
test('busy disables actions and guards callbacks when handlers are directly invoked', () => {
  let calls=0; const element=Card({attempt:attempt(),progression:null,busy:true,onKeepWork(){calls++},onReviewSource(){calls++}});
  const actions=element.props.children.find(child=>child?.props?.className==='pm-actions');
  for(const button of actions.props.children){assert.equal(button.props.disabled,true);button.props.onClick();} assert.equal(calls,0);
});
test('no scores, levels, certifications, or repeated fixed IDs across instances', () => {
  const one=html(attempt(),{completed:1,total:3}); assert.doesNotMatch(visibleText(one),/XP|Beginner|Advanced|certified|employability probability|mastery \d+%|\b\d{1,3}%/i);
  const both=renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(Card,{attempt:attempt(),progression:null,busy:false}),React.createElement(Card,{attempt:attempt(),progression:null,busy:false})));
  assert.doesNotMatch(both,/id="/);
});
test('native article semantics and callbacks provide labelled controls',()=>{
  const rendered=html(attempt(),null,{onKeepWork(){}}); assert.match(rendered,/<article class="practice-milestone" aria-label="Practice record"/); assert.match(rendered,/Keep my work/); assert.match(rendered,/This is a practice record/);
});
test('close SSR server',async()=>{await server.close();server=undefined;});
