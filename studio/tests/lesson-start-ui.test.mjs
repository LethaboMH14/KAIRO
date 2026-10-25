import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const base = { title: 'Synthetic fixture lesson', objective: 'Synthetic test objective only.', chapterCount: 2, questionCount: 1, estimatedMinutes: null, estimateBasis: 'not estimated', sourceState: 'reviewed', capability: 'source-reading', savedStep: null, saving: 'session-only', notices: ['Synthetic fixture notice.'] };
let server, Panel;
test('load actual panel through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Panel } = await server.ssrLoadModule('/src/lesson-start-ui/LessonStartPanel.tsx')); } catch (e) { await server.close(); throw e; }
});
const render = (summary, props={}) => renderToStaticMarkup(React.createElement(Panel, { summary, busy: false, onBeginReading(){}, onReviewSource(){}, ...props }));

test('unknown time estimate, capability, session-only notice and clear first action render', () => {
  const html=render(base); assert.match(html,/Begin reading/); assert.match(html,/Time varies/); assert.match(html,/practice time is not included/i); assert.match(html,/Reading lesson/); assert.match(html,/session only/); assert.doesNotMatch(html,/backup|sync/i);
});
test('save wording describes capability only and gives a conditional next step when unavailable', () => {
  assert.match(render({...base,saving:'device'}),/Progress can be saved on this device/);
  assert.doesNotMatch(render({...base,saving:'device'}),/is saved on this device/);
  const unavailable=render({...base,saving:'unavailable'});
  assert.match(unavailable,/Saving is unavailable\. Download your work before leaving if that option is available/);
  assert.doesNotMatch(unavailable,/Your earlier saved work has not been changed|download your work now/i);
});
test('invalid saved step does not offer resume; valid saved step offers resume and fresh start', () => {
  assert.doesNotMatch(render({...base,savedStep:2}, {onResume(){}}),/Resume lesson/);
  const html=render({...base,savedStep:1},{onResume(){}}); assert.match(html,/Resume lesson/); assert.match(html,/Start reading from the beginning/);
});
test('changed source blocks begin/resume and offers review; unavailable source gates retry callback', () => {
  const changed=render({...base,sourceState:'changed',savedStep:1},{onResume(){}}); assert.match(changed,/Review the current source/); assert.doesNotMatch(changed,/Resume lesson|Begin reading/);
  const absent=render({...base,sourceState:'unavailable'}); assert.match(absent,/source is unavailable/i); assert.doesNotMatch(absent,/<button/);
  assert.match(render({...base,sourceState:'unavailable'},{onRetry(){}}),/Try checking the source again/);
});
test('busy state disables controls and guards callbacks even if called directly', () => {
  let n=0; const element=Panel({summary:{...base,savedStep:0},busy:true,onBeginReading(){n++},onResume(){n++},onReviewSource(){},});
  const action=element.props.children.find(child=>child?.type==='div'&&child.props.className==='lp-actions');
  action.props.children[0].props.onClick(); action.props.children[1].props.onClick(); assert.equal(n,0);
});
test('malicious learner-facing text is escaped and repeated panels have no fixed IDs', () => {
  const attack='<img src=x onerror=run()>', html=render({...base,title:attack,notices:[attack]}); assert.match(html,/&lt;img/); assert.doesNotMatch(html,/<img/);
  const both=renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(Panel,{summary:base,busy:false,onBeginReading(){},onReviewSource(){}}),React.createElement(Panel,{summary:base,busy:false,onBeginReading(){},onReviewSource(){}})));
  assert.equal((both.match(/id="lesson-start-title"/g)||[]).length,0);
});
test('semantic labels and status are native; visible percentage guard excludes styles', () => {
  const html=render({...base,sourceState:'unavailable'}); assert.match(html,/role="status"/); assert.match(html,/<h1/); assert.match(html,/Source unavailable/);
  const text=markup=>markup.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ');
  assert.doesNotMatch(text(html),/\b\d{1,3}%/); assert.match(html,/max-width:100%/);
  assert.match(text('<p>Readiness score 75%</p>'),/75%/);
});
test('close SSR server',async()=>{await server.close();server=undefined;});
