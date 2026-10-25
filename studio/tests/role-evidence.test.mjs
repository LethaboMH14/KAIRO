import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRoleEvidence,isSafeRoleLink} from '../server/role-evidence/index.mjs';

// All source, provider and learner details in these tests are invented.
const requirement = (overrides={}) => ({
  id:'business-need',text:'Describe a testable need',priority:'essential',
  providerExcerpt:'State the business requirement and how it will be tested.',
  sourceLocator:'Synthetic example requirements section',
  rubric:[{id:'questions',label:'Ask clarifying questions'},{id:'tests',label:'Write testable acceptance checks'}],
  practice:{title:'Fictional client brief',instructions:'Interview an invented shop owner; record assumptions and an acceptance test.',href:'/practice'},
  ...overrides
});
const role = (overrides={}) => ({
  version:1,id:'invented-role',title:'Fictional business analyst role',
  provider:'Example Organisation (fictional)',
  source:{officialUrl:'https://careers.example.org/role/demo',checkedAt:'2026-10-24',
    verification:'official',status:'open',closesAt:'2026-11-01',...overrides.source},
  requirements:[requirement(),requirement({
    id:'writing',text:'Write project handovers',priority:'unspecified',
    providerExcerpt:'Document the work completed for colleagues.',
    sourceLocator:'Synthetic example team section',
    rubric:[{id:'handoff',label:'Create a handover document'}],practice:null
  })],
  ...Object.fromEntries(Object.entries(overrides).filter(([k])=>k!=='source'))
});
const evidence = (overrides={}) => ({
  id:'practice-one',requirementId:'business-need',rubricIds:['questions'],
  kind:'practice',reviewStatus:'self-reported',
  note:'Fictional interview questions and limitation note',reference:'run-123',...overrides
});
const run = (args={}) => evaluateRoleEvidence({role:role(),evidence:[],
  now:'2026-10-25T10:00:00.000Z',...args});

test('no evidence means unknown, not inability, match percent or hiring prediction', () => {
  const result=run();
  assert.equal(result.source.state,'dated-provider-summary');
  assert.equal(result.listingState,'deadline-ahead-unconfirmed');
  assert.ok(result.requirements.every(r=>r.status==='unknown'));
  assert.ok(result.requirements.every(r=>r.rubric.every(c=>c.status==='unknown')));
  assert.equal(result.requirements[1].priority,'unspecified');
  assert.deepEqual(result.nextPractice.map(p=>p.requirementId),['business-need']);
  assert.equal(Object.hasOwn(result,'score'),false);
  assert.equal(Object.hasOwn(result,'eligibility'),false);
});

test('evidence is traceable by exact ID to an explicit rubric row; never independently verified', () => {
  const partial=run({evidence:[evidence()]});
  const row=partial.requirements[0];
  assert.equal(row.status,'partially-documented');
  assert.deepEqual(row.rubric[0].evidenceIds,['practice-one']);
  assert.equal(row.rubric[1].status,'unknown');
  assert.deepEqual(partial.nextPractice[0].missingRubric,['Write testable acceptance checks']);
  assert.equal(row.evidence[0].reviewStatus,'self-reported');
  const complete=run({evidence:[evidence({rubricIds:['questions','tests'],reviewStatus:'reported-feedback'})]});
  assert.equal(complete.requirements[0].status,'documented-for-review');
  assert.match(complete.requirements[0].explanation,/not eligibility/i);
  assert.equal(complete.requirements[0].evidence[0].reviewStatus,'reported-feedback');
});

test('removing notes resets evidence to unknown and restores practice', () => {
  const had=run({evidence:[evidence({rubricIds:['questions','tests']})]});
  assert.equal(had.requirements[0].status,'documented-for-review');
  assert.equal(had.nextPractice.length,0);
  assert.equal(run().requirements[0].status,'unknown');
  assert.equal(run().nextPractice.length,1);
});

test('stale and discovery-only sources do not produce a confirmed requirement state', () => {
  const stale=run({now:'2026-11-15T10:00:00.000Z',role:role({source:{status:'unknown',closesAt:null}}),evidence:[evidence()]});
  assert.equal(stale.source.state,'stale');
  assert.equal(stale.listingState,'unknown');
  assert.equal(stale.requirements[0].status,'source-needs-recheck');
  assert.deepEqual(stale.requirements[0].rubric[0].evidenceIds,['practice-one']);
  const discovery=run({role:role({source:{verification:'discovery-only'}})});
  assert.equal(discovery.source.state,'discovery-only');
  assert.equal(discovery.listingState,'unknown');
  assert.ok(discovery.requirements.every(r=>r.status==='source-needs-recheck'));
});

test('close date and explicit closed status override any learner evidence', () => {
  assert.equal(run({now:'2026-11-05T10:00:00.000Z',evidence:[evidence()]}).listingState,'closed');
  assert.equal(run({role:role({source:{status:'closed'}})}).listingState,'closed');
  assert.equal(run({role:role({source:{closesAt:null}})}).listingState,'unknown');
});

test('invalid source dates, missing primary quotes and guessed priority fail closed', () => {
  assert.throws(()=>run({role:role({source:{checkedAt:'2026-02-30'}})}),/check date/i);
  assert.throws(()=>run({role:role({source:{checkedAt:'2026-10-26'}})}),/future/);
  assert.throws(()=>run({role:role({requirements:[requirement({priority:'mandatory'})]})}),/priority/);
  assert.throws(()=>run({role:role({requirements:[requirement({providerExcerpt:''})]})}),/excerpt/);
  assert.throws(()=>run({role:role({requirements:[requirement(),requirement()]})}),/Duplicate requirement/);
  assert.throws(()=>run({role:role({requirements:[requirement({rubric:[{id:'a',label:'a'},{id:'a',label:'b'}]})]})}),/Duplicate rubric/);
});

test('forged learner entries, duplicate IDs and oversize inputs fail closed', () => {
  assert.throws(()=>run({evidence:[evidence({requirementId:'other'})]}),/Unknown evidence requirement/);
  assert.throws(()=>run({evidence:[evidence({rubricIds:['made-up']})]}),/Unknown rubric/);
  assert.throws(()=>run({evidence:[evidence(),evidence()]}),/Duplicate evidence/);
  assert.throws(()=>run({evidence:[evidence({reviewStatus:'verified-by-employer'})]}),/review/);
  assert.throws(()=>run({evidence:[evidence({note:' '})]}),/evidence note/);
  assert.throws(()=>run({evidence:[evidence({note:'x'.repeat(1201)})]}),/evidence note/);
  assert.throws(()=>run({evidence:new Array(121).fill(evidence())}),/Invalid evidence collection/);
  assert.throws(()=>run({role:role({requirements:new Array(31).fill(requirement())})}),/Invalid version 1 role/);
});

test('only explicit safe user-controlled links are accepted', () => {
  for(const u of ['javascript:alert(1)','http://example.org','https://localhost/x',
    'https://127.0.0.1/x','https://[::1]/x','https://user:pass@example.org/x',
    'https://example.org:8080','//external.example.org','/redirect?target=evil']) {
    assert.equal(isSafeRoleLink(u),false,u);
  }
  assert.equal(isSafeRoleLink('/practice'),true);
  assert.equal(isSafeRoleLink('https://careers.example.org/role/3'),true);
  assert.throws(()=>run({role:role({source:{officialUrl:'https://localhost/secret'}})}),/provider URL/);
  assert.throws(()=>run({role:role({requirements:[requirement({practice:{
    title:'unsafe',instructions:'No',href:'javascript:alert(1)'
  }})]})}),/Unsafe practice link/);
});

test('text notes are opaque and cannot become executable actions or clickable references', () => {
  const note='<img src=x onerror=alert(1)>';
  const output=run({evidence:[evidence({note,reference:'local-private-run-id'})]});
  assert.equal(output.requirements[0].evidence[0].note,note);
  assert.equal(output.requirements[0].evidence[0].reference,'local-private-run-id');
  assert.equal(Object.hasOwn(output,'actions'),false);
});

// SSR requires the real studio dependencies; no browser, microphone, camera or network used.
test('UI renders source/date/unknown and inert learner notes with safe optional provider link', async t => {
  let React,renderToStaticMarkup,createServer,reactPlugin;
  try {
    React=(await import('react')).default;
    ({renderToStaticMarkup}=await import('react-dom/server'));
    ({createServer}=await import('vite'));
    reactPlugin=(await import('@vitejs/plugin-react')).default;
  } catch(error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {t.skip('Studio dependencies unavailable in isolated test folder');return;}
    throw error;
  }
  const {fileURLToPath}=await import('node:url');
  const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),
    configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true},appType:'custom'});
  try {
    const {default:View,isSafeRoleHref}=await server.ssrLoadModule('/src/role-evidence/RoleEvidence.tsx');
    assert.equal(isSafeRoleHref('javascript:alert(1)'),false);
    const html=renderToStaticMarkup(React.createElement(View,{
      report:run({evidence:[evidence({note:'<script>alert(1)</script>'})]})
    }));
    assert.match(html,/Dated provider summary/);
    assert.match(html,/Evidence unknown/);
    assert.match(html,/original provider link/);
    assert.match(html,/rel="noopener noreferrer"/);
    assert.doesNotMatch(html,/<script>/);
  } finally {await server.close();}
});
