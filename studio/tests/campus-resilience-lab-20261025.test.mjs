import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ACTION_VERSION, DEFAULT_ORDER, LOADS, MODEL_VERSION, SCENARIOS, SCENARIO_VERSION,
  compareAttempts, newAction, replayAttempt, runAttempt, simulateScenario,
  validateAction, validateOptionalLessonAssociation, validateScenario
} from '../src/campus-resilience-lab-20261025/model.mjs';

const eps = (actual, expected, message = 'numeric mismatch') =>
  assert.ok(Math.abs(actual - expected) < 1e-7, message + ': ' + actual + ' vs ' + expected);
const baseline = () => runAttempt(newAction('baseline', DEFAULT_ORDER, 'none'));
const cloud = () => runAttempt(newAction('cloud', DEFAULT_ORDER, 'none'));
const fixture = changes => {
  const original = SCENARIOS.baseline;
  return { ...original, ...changes,
    battery: { ...original.battery, ...(changes.battery || {}) },
    grid: [...(changes.grid || original.grid)],
    solarKw: [...(changes.solarKw || original.solarKw)],
    demandFactor: [...(changes.demandFactor || original.demandFactor)] };
};
const simulate = (changes, order = DEFAULT_ORDER) => simulateScenario(fixture(changes), newAction('baseline', order, 'none'));

// Independent aggregate oracle. It does NOT call the dispatch engine and
// calculates each energy budget algebraically before comparing results.
// Greedy service order changes per-load shares but cannot change aggregate
// delivery under these single-bus/zero-grid-charging assumptions.
function oracle(scenario) {
  const b = scenario.battery, h = scenario.stepHours;
  let stored = b.initialKwh;
  const expected = [];
  for (let i = 0; i < 6; i++) {
    const requested = LOADS.reduce((sum, load) => sum + load.kw, 0) * scenario.demandFactor[i] * h;
    const sun = scenario.solarKw[i] * h;
    const grid = scenario.grid[i] ? scenario.gridMaxKw * h : 0;
    const direct = Math.min(requested, sun + grid);
    const requiredFromStorage = requested - direct;
    const fromBattery = Math.min(requiredFromStorage, stored * b.dischargeEfficiency, b.dischargeLimitKw * h);
    const fulfilled = direct + fromBattery;
    stored -= fromBattery / b.dischargeEfficiency;
    const surplusSun = Math.max(0, sun - requested);
    const batteryInput = Math.min(surplusSun, b.chargeLimitKw * h, (b.capacityKwh - stored) / b.chargeEfficiency);
    stored += batteryInput * b.chargeEfficiency;
    expected.push({ fulfilled, unmet: requested - fulfilled, stored });
  }
  return expected;
}

test('prepared six-hour scenarios and version/units are explicit', () => {
  assert.equal(ACTION_VERSION, 1);
  assert.match(MODEL_VERSION, /educational/);
  assert.match(SCENARIO_VERSION, /prepared/);
  assert.equal(LOADS.length, 4);
  for (const scene of Object.values(SCENARIOS)) {
    validateScenario(scene);
    assert.equal(scene.hours, 6);
    assert.equal(scene.stepHours, 1);
    assert.equal(scene.grid.filter(Boolean).length, 2);
  }
});

test('independent aggregate oracle agrees in EVERY hourly step for both skies and varied priority', () => {
  for (const [id, scene] of Object.entries(SCENARIOS)) {
    const reference = oracle(scene);
    for (const order of [DEFAULT_ORDER, [...DEFAULT_ORDER].reverse(), ['connect', 'leisure', 'teach', 'study']]) {
      const actual = runAttempt(newAction(id, order, 'none'));
      assert.equal(actual.steps.length, 6);
      actual.steps.forEach((s, i) => {
        eps(s.servedKwh, reference[i].fulfilled, 'served ' + id + '/' + i);
        eps(s.unmetKwh, reference[i].unmet, 'unmet ' + id + '/' + i);
        eps(s.endingKwh, reference[i].stored, 'SOC ' + id + '/' + i);
      });
    }
  }
});

test('every hour obeys solar and demand conservation, SOC, power limits and efficiency losses', () => {
  for (const scene of Object.values(SCENARIOS)) {
    const run = runAttempt(newAction(scene.id));
    let soc = scene.battery.initialKwh;
    for (const step of run.steps) {
      eps(step.demandKwh, step.servedKwh + step.unmetKwh);
      eps(step.solarKwh + step.gridToLoadKwh + step.batteryToLoadKwh,
        step.servedKwh + step.solarToBatteryKwh + step.curtailedKwh);
      eps(step.solarKwh, step.solarToLoadKwh + step.solarToBatteryKwh + step.curtailedKwh);
      eps(step.batteryWithdrawnKwh * scene.battery.dischargeEfficiency, step.batteryToLoadKwh);
      eps(step.batteryStoredKwh, step.solarToBatteryKwh * scene.battery.chargeEfficiency);
      eps(step.endingKwh, soc + step.batteryStoredKwh - step.batteryWithdrawnKwh);
      eps(step.batteryLossKwh, step.batteryWithdrawnKwh - step.batteryToLoadKwh +
        step.solarToBatteryKwh - step.batteryStoredKwh);
      assert.ok(step.endingKwh >= -1e-8 && step.endingKwh <= scene.battery.capacityKwh + 1e-8);
      assert.ok(step.solarToBatteryKwh <= scene.battery.chargeLimitKw * scene.stepHours + 1e-8);
      assert.ok(step.batteryToLoadKwh <= scene.battery.dischargeLimitKw * scene.stepHours + 1e-8);
      if (!step.gridOnline) eps(step.gridToLoadKwh, 0);
      for (const load of step.loads) {
        eps(load.demandKwh, load.servedKwh + load.unmetKwh);
        assert.ok(load.servedKwh >= 0 && load.unmetKwh >= 0);
      }
      soc = step.endingKwh;
    }
  }
});

test('zero solar and zero battery while grid out results in unmet demand', () => {
  const run = simulate({ solarKw: [0,0,0,0,0,0], grid: [false,false,false,false,false,false],
    battery: { initialKwh: 0 } });
  for (const step of run.steps) {
    eps(step.servedKwh, 0);
    eps(step.unmetKwh, 22);
    eps(step.endingKwh, 0);
    eps(step.curtailedKwh, 0);
  }
});

test('large solar and zero demand charge to battery limit then curtail without creation', () => {
  const run = simulate({ solarKw: [60,60,60,60,60,60], grid: [false,false,false,false,false,false],
    demandFactor: [0,0,0,0,0,0], battery: { initialKwh: 27 } });
  eps(run.steps[0].solarToBatteryKwh, 1 / 0.9);
  eps(run.steps[0].endingKwh, 28);
  eps(run.steps[0].curtailedKwh, 60 - 1/0.9);
  for (const step of run.steps) {
    eps(step.servedKwh, 0);
    eps(step.unmetKwh, 0);
    eps(step.endingKwh, 28);
  }
});

test('outage all six hours and grid restored: grid usage follows exact timeline', () => {
  const blackout = simulate({ grid: [false,false,false,false,false,false] });
  eps(blackout.steps[0].gridToLoadKwh, 0);
  eps(blackout.steps[5].gridToLoadKwh, 0);
  const restored = simulate({ grid: [false,false,false,false,false,true] });
  eps(restored.steps[5].gridToLoadKwh, 22);
  assert.equal(restored.steps[5].gridOnline, true);
});

test('large demand never results in negative stored energy or over-supply', () => {
  const run = simulate({ solarKw:[0,0,0,0,0,0],grid:[false,false,false,false,false,false],
    demandFactor:[4,4,4,4,4,4],battery:{initialKwh:1} });
  eps(run.steps[0].servedKwh, 0.9);
  eps(run.steps[0].unmetKwh, 88 - 0.9);
  run.steps.forEach(s => {assert.ok(s.endingKwh >= -1e-8);assert.ok(s.unmetKwh <= 88);});
});

test('priorities change WHICH services receive the SAME limited total energy', () => {
  const a = runAttempt(newAction('baseline', DEFAULT_ORDER, 'none'));
  const b = runAttempt(newAction('baseline', [...DEFAULT_ORDER].reverse(), 'none'));
  eps(a.totals.servedKwh, b.totals.servedKwh);
  const targetA = a.steps[4].loads.find(x => x.id === 'leisure');
  const targetB = b.steps[4].loads.find(x => x.id === 'leisure');
  assert.ok(targetB.servedKwh > targetA.servedKwh);
  assert.notDeepEqual(a.services, b.services);
});

test('prediction is measured against uninterrupted service across EVERY outage hour', () => {
  const no = baseline();
  const selected = runAttempt(newAction('baseline', ['connect','study','teach','leisure'], 'connect'));
  assert.equal(selected.predictionCorrect, true);
  assert.ok(selected.sustained.includes('connect'));
  assert.equal(no.predictionCorrect, no.sustained.length === 0);
});

test('deterministic replay and strict tampering rejection', () => {
  const run = baseline();
  assert.deepEqual(replayAttempt(run), run);
  assert.deepEqual(runAttempt(newAction('baseline')), runAttempt(newAction('baseline')));
  const tampered = structuredClone(run);
  tampered.steps[2].batteryToLoadKwh += 0.01;
  assert.throws(() => replayAttempt(tampered), /mismatch|tamper/);
  const forged = structuredClone(run); forged.verified = true;
  assert.throws(() => replayAttempt(forged), /Not a local/);
});

test('actions reject duplicates, extra keys, wrong scenario, invalid predictions', () => {
  const original = newAction('baseline');
  assert.throws(() => validateAction({ ...original, priority:['study','study','teach','leisure'] },'baseline'));
  assert.throws(() => validateAction({ ...original, priority:[...DEFAULT_ORDER,'connect'] },'baseline'));
  assert.throws(() => validateAction({ ...original, prediction:'grid' },'baseline'));
  assert.throws(() => validateAction({ ...original, verified:true },'baseline'));
  assert.throws(() => validateAction({ ...original, version:2 },'baseline'));
  assert.throws(() => validateAction(original,'cloud'));
  assert.throws(() => runAttempt(newAction('unknown')));
});

test('invalid scenarios fail closed: NaN, negatives, SOC overflow, duration and grid flags', () => {
  const invalid = [
    { solarKw:[NaN,0,0,0,0,0] }, { solarKw:[-1,0,0,0,0,0] },
    { solarKw:[1,2] }, { demandFactor:[1,-1,1,1,1,1] },
    { stepHours:0 }, { hours:7 }, { grid:[1,true,true,true,true,true] },
    { battery:{initialKwh:1000} }, { battery:{dischargeEfficiency:0} },
    { gridMaxKw:Infinity }, { version:'forged' }
  ];
  for (const changes of invalid) assert.throws(() => validateScenario(fixture(changes)), JSON.stringify(changes));
});

test('two independent attempts require exact scenario order and replay identity', () => {
  const a = baseline(), b = cloud();
  const c = compareAttempts(a,b);
  eps(c.unmetDeltaKwh, b.totals.unmetKwh - a.totals.unmetKwh);
  assert.equal(c.services.length, 4);
  assert.throws(() => compareAttempts(a,a));
  assert.throws(() => compareAttempts(b,a));
});

test('optional lesson pointer never claims backend verification', () => {
  assert.equal(validateOptionalLessonAssociation(null),null);
  const association = validateOptionalLessonAssociation({
    contractVersion:1,lessonId:'lesson_1',sourceId:'source_1',revision:'rev_1',reviewed:true
  });
  assert.equal(association.evidenceStatus,'local-unverified');
  assert.equal(association.associationStatus,'unverified-local-reference');
  assert.throws(() => validateOptionalLessonAssociation({ ...association, evidenceStatus:'verified' }));
  assert.throws(() => validateOptionalLessonAssociation({ contractVersion:1,lessonId:'bad/slash',sourceId:'id',revision:'v1',reviewed:true }));
});

test('equivalent keyboard and reading interface has no mandatory drag or canvas dependency', () => {
  const file = fileURLToPath(new URL('../src/campus-resilience-lab-20261025/CampusResilienceLab.tsx',import.meta.url));
  const cssFile = fileURLToPath(new URL('../src/campus-resilience-lab-20261025/campus.css',import.meta.url));
  const ui = readFileSync(file,'utf8'), css = readFileSync(cssFile,'utf8');
  assert.match(ui, /<button/);
  assert.match(ui, /<select/);
  assert.match(ui, /<table/);
  assert.match(ui, /aria-live="polite"/);
  assert.match(ui, /resultHeading\.current\?\.focus\(\)/);
  assert.match(ui, /aria-label=\{overall\}/);
  assert.doesNotMatch(ui, /draggable=|onDrag|WebGL|THREE\./);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/@media\(max-width:720px\)/);
});
