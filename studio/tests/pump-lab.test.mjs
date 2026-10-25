import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as P from '../src/pump-lab/physics.ts';
import * as I from '../src/pump-lab/instruments.ts';
import * as K from '../src/pump-lab/cases.ts';
import * as S from '../src/pump-lab/session.ts';
import * as R from '../src/pump-lab/report.ts';
import * as L from '../src/pump-lab/layout.ts';
import * as O from '../src/pump-lab/readout.ts';
import * as IF from '../src/pump-lab/interface.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

let clock = Date.parse('2026-10-23T08:00:00Z');
const at = () => new Date((clock += 1000)).toISOString();
const fresh = (caseId = 'baseline-commissioning', seed = 7, id = 'test-session') => S.initialState(id, seed, caseId);
const step = (state, action) => S.transition(state, action, at());
const play = (state, ...actions) => actions.reduce(step, state);
const cond = (over = {}) => ({ speedRpm: 1450, valvePct: 100, tanks: { ...P.INITIAL_TANKS }, fault: { ...P.HEALTHY }, ...over });
const throwsCode = (fn, code) => assert.throws(fn, e => e instanceof P.PumpLabError && e.code === code, `expected ${code}`);

// ---------------------------------------------------------------- physics

test('constants: units and conversions are the documented ones', () => {
  assert.equal(P.CONST.g, 9.80665);
  assert.ok(Math.abs(P.KPA_PER_M - 9.80665) < 1e-12);
  assert.ok(Math.abs(P.NPSH_ATM_HEAD_M - 10.0933) < 0.001, 'atmosphere minus vapour pressure in metres of water');
  assert.equal(P.LITRES_PER_M, 3000);
  assert.equal(P.TOTAL_WATER_L, 9000);
  assert.equal(P.valveK(100), 0.01);
  assert.ok(Math.abs(P.valveK(50) - 0.04) < 1e-12);
  assert.ok(Math.abs(P.pumpCurveHead(1450, 10) - (22 - 6)) < 1e-12);
});

test('operating point: pump head equals system head at the solution, across the whole domain', () => {
  let n = 0;
  for (const level of [{ sourceL: 7500, destL: 1500 }, { sourceL: 3000, destL: 6000 }, { sourceL: 900, destL: 8100 }]) {
    for (let rpm = 600; rpm <= 1450; rpm += 50) {
      for (let v = 5; v <= 100; v += 5) {
        for (const fault of [P.HEALTHY, { ...P.HEALTHY, valveStuckMaxPct: 15 }, { ...P.HEALTHY, suctionK: 0.14 }, { ...P.HEALTHY, impellerHeadFactor: 0.62 }]) {
          const c = cond({ speedRpm: rpm, valvePct: v, tanks: level, fault });
          const op = P.operatingPoint(c);
          if (op.flowLps === 0) continue;
          const sumK = fault.suctionK + P.CIRCUIT.kPipe + P.valveK(op.valveActualPct);
          const systemHead = op.staticLiftM + sumK * op.flowLps ** 2;
          assert.ok(Math.abs(op.pumpHeadM - systemHead) < 1e-6, `${rpm}/${v}: ${op.pumpHeadM} vs ${systemHead}`);
          n++;
        }
      }
    }
  }
  assert.ok(n > 1000);
});

test('operating point: matches the closed-form solution wherever the pump is not cavitating', () => {
  for (let rpm = 700; rpm <= 1450; rpm += 75) {
    for (let v = 20; v <= 100; v += 20) {
      const c = cond({ speedRpm: rpm, valvePct: v });
      const op = P.operatingPoint(c);
      if (op.flowLps === 0 || op.cavitating) continue;
      const nn = rpm / 1450;
      const sumK = P.CIRCUIT.kIn + P.CIRCUIT.kPipe + P.valveK(v);
      const closed = Math.sqrt((nn * nn * P.PUMP.h0 - op.staticLiftM) / (P.PUMP.c + sumK));
      assert.ok(Math.abs(op.flowLps - closed) < 1e-9, `${rpm}/${v}`);
    }
  }
});

test('affinity law: with no static lift and no cavitation, flow is proportional to speed', () => {
  const tanks = { sourceL: 9000, destL: 0 }; // lift = 3 + 0 - 3 = 0
  const hi = P.operatingPoint(cond({ speedRpm: 1450, tanks }));
  const half = P.operatingPoint(cond({ speedRpm: 725, tanks }));
  assert.equal(hi.staticLiftM, 0);
  assert.ok(Math.abs(hi.flowLps / half.flowLps - 2) < 1e-9);
});

test('monotonic: more speed or a wider valve never reduces flow', () => {
  for (const fault of [P.HEALTHY, { ...P.HEALTHY, valveStuckMaxPct: 15 }, { ...P.HEALTHY, impellerHeadFactor: 0.62 }]) {
    for (let v = 10; v <= 100; v += 10) {
      let prev = -1;
      for (let rpm = 600; rpm <= 1450; rpm += 25) {
        const q = P.operatingPoint(cond({ speedRpm: rpm, valvePct: v, fault })).flowLps;
        assert.ok(q >= prev - 1e-9, `speed ${rpm} valve ${v}`);
        prev = q;
      }
    }
    for (let rpm = 800; rpm <= 1450; rpm += 150) {
      let prev = -1;
      for (let v = 0; v <= 100; v += 5) {
        const q = P.operatingPoint(cond({ speedRpm: rpm, valvePct: v, fault })).flowLps;
        assert.ok(q >= prev - 1e-9, `valve ${v} speed ${rpm}`);
        prev = q;
      }
    }
  }
});

test('energy: hydraulic power never exceeds shaft power; efficiency stays between 0 and 1', () => {
  for (let rpm = 600; rpm <= 1450; rpm += 50) {
    for (let v = 5; v <= 100; v += 5) {
      const op = P.operatingPoint(cond({ speedRpm: rpm, valvePct: v }));
      assert.ok(op.hydraulicKw <= op.shaftKw + 1e-12);
      assert.ok(op.efficiency >= 0 && op.efficiency < 1, `${rpm}/${v}: ${op.efficiency}`);
    }
  }
});

test('pressures are consistent with heads and with the valve loss', () => {
  const op = P.operatingPoint(cond({ speedRpm: 1230, valvePct: 60 }));
  assert.ok(Math.abs(op.dischargeKpa - op.suctionKpa - op.pumpHeadM * P.KPA_PER_M) < 1e-9);
  assert.ok(Math.abs(op.dischargeKpa - op.postValveKpa - op.valveLossM * P.KPA_PER_M) < 1e-9);
  assert.ok(op.suctionKpa < op.dischargeKpa && op.postValveKpa < op.dischargeKpa);
});

test('no-flow states are labelled with their reason', () => {
  assert.equal(P.operatingPoint(cond({ valvePct: 0 })).noFlowReason, 'valve-closed');
  assert.equal(P.operatingPoint(cond({ speedRpm: 100 })).noFlowReason, 'speed-below-minimum');
  assert.equal(P.operatingPoint(cond({ tanks: { sourceL: 300, destL: 8700 } })).noFlowReason, 'source-low');
  assert.equal(P.operatingPoint(cond({ speedRpm: 600, tanks: { sourceL: 600, destL: 8400 } })).noFlowReason, 'head-below-lift');
  assert.equal(P.operatingPoint(cond({ tanks: { sourceL: 0, destL: 9000 } })).noFlowReason, 'source-low');
  for (const op of [P.operatingPoint(cond({ valvePct: 0 }))]) assert.equal(op.flowLps, 0);
});

test('conservation: litres taken from the source equal litres added to the destination', () => {
  for (const c of [cond({ speedRpm: 1230 }), cond({ speedRpm: 900, valvePct: 40 }), cond({ fault: { ...P.HEALTHY, suctionK: 0.14 } })]) {
    for (const seconds of [1, 30, 600]) {
      const r = P.runTransfer(c, seconds);
      const total = r.tanks.sourceL + r.tanks.destL;
      assert.ok(Math.abs(total - P.TOTAL_WATER_L) < 1e-6, `total ${total}`);
      assert.ok(Math.abs(c.tanks.sourceL - r.tanks.sourceL - r.movedL) < 1e-6);
      assert.ok(Math.abs(r.tanks.destL - c.tanks.destL - r.movedL) < 1e-6);
      assert.ok(r.tanks.sourceL >= 0 && r.tanks.destL <= P.TANK_CAPACITY_L);
      assert.equal(r.trace.length, seconds);
    }
  }
});

test('bounds: the source cannot be pumped below the suction cut-off, the destination cannot overfill', () => {
  let c = cond({ speedRpm: 1230, tanks: { sourceL: 900, destL: 8100 } });
  let r = P.runTransfer(c, 600);
  assert.ok(r.tanks.sourceL >= P.CIRCUIT.minSuctionLevelM * P.LITRES_PER_M - 1e-9);
  assert.ok(['clamp-source', 'source-low'].includes(r.stoppedBy));
  c = cond({ speedRpm: 1450, tanks: { sourceL: 8700, destL: 300 } });
  r = P.runTransfer({ ...c, tanks: { sourceL: 8700, destL: 300 } }, 600);
  assert.ok(r.tanks.destL <= P.TANK_CAPACITY_L + 1e-9);
  const full = P.runTransfer(cond({ speedRpm: 1450, tanks: { sourceL: 100 + 500, destL: 8400 } }), 600);
  assert.ok(full.tanks.destL <= P.TANK_CAPACITY_L + 1e-9);
});

test('physics rejects non-finite, out-of-range and non-integer input', () => {
  for (const bad of [NaN, Infinity, -Infinity, '1450', null, undefined, {}]) {
    assert.throws(() => P.operatingPoint(cond({ speedRpm: bad })), e => e instanceof P.PumpLabError);
    assert.throws(() => P.operatingPoint(cond({ valvePct: bad })), e => e instanceof P.PumpLabError);
    assert.throws(() => P.runTransfer(cond(), bad), e => e instanceof P.PumpLabError);
  }
  throwsCode(() => P.operatingPoint(cond({ speedRpm: 1451 })), 'out-of-range');
  throwsCode(() => P.operatingPoint(cond({ valvePct: 101 })), 'out-of-range');
  throwsCode(() => P.operatingPoint(cond({ valvePct: -1 })), 'out-of-range');
  throwsCode(() => P.runTransfer(cond(), 0), 'out-of-range');
  throwsCode(() => P.runTransfer(cond(), 601), 'out-of-range');
  throwsCode(() => P.runTransfer(cond(), 1.5), 'not-integer');
  throwsCode(() => P.operatingPoint(cond({ tanks: { sourceL: -1, destL: 0 } })), 'out-of-range');
  throwsCode(() => P.operatingPoint(cond({ fault: { ...P.HEALTHY, impellerHeadFactor: 0 } })), 'out-of-range');
});

// ---------------------------------------------------------------- the twist: turning the speed up does not fix every fault

test('every authored fault still fails at full speed with the valve fully open', () => {
  for (const id of K.CASE_IDS) {
    const spec = K.CASES[id];
    const op = P.operatingPoint(cond({ fault: spec.fault }));
    const ok = P.evaluateConstraints(op);
    assert.equal(ok.all, false, `${id} should not be fixed by full speed`);
  }
  // the healthy circuit at full speed also breaks a limit (motor rating), so the lesson is about the limits, not only the fault
  const healthy = P.evaluateConstraints(P.operatingPoint(cond()));
  assert.equal(healthy.target, true);
  assert.equal(healthy.power, false);
});

test('each fault fails for its documented reason at full speed', () => {
  const stuck = P.operatingPoint(cond({ fault: K.CASES['valve-handle-open'].fault }));
  assert.ok(stuck.flowLps < P.LIMITS.targetFlowLps && stuck.dischargeKpa > P.LIMITS.maxDischargeKpa, 'stuck gate: low flow and over pressure');
  const strainer = P.operatingPoint(cond({ fault: K.CASES['noisy-suction'].fault }));
  assert.ok(strainer.cavitating && strainer.flowLps < P.LIMITS.targetFlowLps, 'blocked strainer: cavitation and low flow');
  const worn = P.operatingPoint(cond({ fault: K.CASES['weak-delivery'].fault }));
  assert.ok(worn.flowLps < P.LIMITS.targetFlowLps && worn.shaftKw > P.LIMITS.motorRatedKw, 'worn impeller: low flow and an overloaded motor');
});

test('a limit-respecting setting exists for the healthy circuit, and every repair restores it', () => {
  const good = P.operatingPoint(cond({ speedRpm: 1230, valvePct: 100 }));
  assert.equal(P.evaluateConstraints(good).all, true);
  for (const id of K.CASE_IDS) {
    const healed = P.operatingPoint(cond({ speedRpm: 1230, fault: { ...P.HEALTHY } }));
    assert.equal(P.evaluateConstraints(healed).all, true, id);
  }
});

// ---------------------------------------------------------------- instruments

test('noise is bounded, stateless and reproducible from the seed', () => {
  for (let seed = 0; seed < 300; seed++) for (let seq = 1; seq <= 6; seq++) for (let ch = 0; ch < 5; ch++) {
    const u = I.noiseUnit(seed * 9973, seq, ch);
    assert.ok(u >= -1 && u < 1);
    assert.equal(u, I.noiseUnit(seed * 9973, seq, ch));
  }
  assert.notEqual(I.noiseUnit(1, 1, 0), I.noiseUnit(2, 1, 0));
});

test('measured values stay within the stated instrument error of the truth', () => {
  for (const id of K.CASE_IDS) {
    const c = cond({ speedRpm: 1230, fault: K.CASES[id].fault });
    const op = P.operatingPoint(c);
    for (let seed = 0; seed < 400; seed++) {
      const m = I.measure(op, 100, 1230, seed * 2654435761 % 4294967296, 1);
      assert.ok(Math.abs(m.flowLps - op.flowLps) <= 0.015 * op.flowLps + 0.05 + 1e-9, 'flow');
      assert.ok(Math.abs(m.suctionKpa - op.suctionKpa) <= 2.5 + 1e-9, 'suction');
      assert.ok(Math.abs(m.dischargeKpa - op.dischargeKpa) <= 2.5 + 1e-9, 'discharge');
      assert.ok(Math.abs(m.postValveKpa - op.postValveKpa) <= 2.5 + 1e-9, 'post valve');
      assert.ok(Math.abs(m.shaftKw - op.shaftKw) <= 0.035 + 1e-9, 'power');
    }
  }
});

test('a learner can tell the faults apart from the supplied readings, and a healthy circuit is never accused', () => {
  const sig = (m) => Object.fromEntries(I.analyse(m).map(c => [c.section, c.flag]));
  let healthyChecked = 0, stuckChecked = 0, strainerChecked = 0, wornChecked = 0;
  for (let seed = 0; seed < 150; seed++) {
    const s = (seed * 2654435761) % 4294967296;
    for (let rpm = 800; rpm <= 1450; rpm += 50) {
      for (let v = 30; v <= 100; v += 10) {
        const run = (fault) => {
          const op = P.operatingPoint(cond({ speedRpm: rpm, valvePct: v, fault }));
          return { op, m: I.measure(op, v, rpm, s, 1 + (rpm + v) % 5) };
        };
        const h = run(P.HEALTHY);
        if (h.m.flowLps >= 4) {
          assert.deepEqual(sig(h.m), { suction: 'as-expected', pump: 'as-expected', valve: 'as-expected' }, `healthy ${rpm}/${v}/${s}`);
          healthyChecked++;
        }
        const st = run(K.CASES['valve-handle-open'].fault);
        if (st.m.flowLps >= 4) {
          assert.deepEqual(sig(st.m), { suction: 'as-expected', pump: 'as-expected', valve: 'higher' }, `stuck ${rpm}/${v}/${s}`);
          stuckChecked++;
        }
        const sn = run(K.CASES['noisy-suction'].fault);
        if (sn.m.flowLps >= 4) {
          const g = sig(sn.m);
          assert.equal(g.suction, 'higher', `strainer ${rpm}/${v}/${s}`);
          assert.equal(g.valve, 'as-expected');
          assert.ok(['as-expected', 'lower'].includes(g.pump), 'pump flag may drop only through cavitation');
          if (!sn.op.cavitating) assert.equal(g.pump, 'as-expected');
          strainerChecked++;
        }
        const wn = run(K.CASES['weak-delivery'].fault);
        if (wn.m.flowLps >= 4) {
          assert.deepEqual(sig(wn.m), { suction: 'as-expected', pump: 'lower', valve: 'as-expected' }, `worn ${rpm}/${v}/${s}`);
          wornChecked++;
        }
      }
    }
  }
  assert.ok(healthyChecked > 500 && stuckChecked > 300 && strainerChecked > 300 && wornChecked > 500, `${healthyChecked}/${stuckChecked}/${strainerChecked}/${wornChecked}`);
});

test('a blocked strainer and a worn impeller both look weak at the pump, but only the suction loss separates them', () => {
  const rpm = 1450;
  const sn = P.operatingPoint(cond({ speedRpm: rpm, valvePct: 100, fault: K.CASES['noisy-suction'].fault }));
  const wn = P.operatingPoint(cond({ speedRpm: rpm, valvePct: 100, fault: K.CASES['weak-delivery'].fault }));
  const m1 = I.measure(sn, 100, rpm, 3, 1), m2 = I.measure(wn, 100, rpm, 3, 1);
  const a1 = Object.fromEntries(I.analyse(m1).map(c => [c.section, c.flag]));
  const a2 = Object.fromEntries(I.analyse(m2).map(c => [c.section, c.flag]));
  assert.equal(a1.pump, 'lower');
  assert.equal(a2.pump, 'lower');
  assert.notEqual(a1.suction, a2.suction);
});

test('sections cannot be judged below the minimum informative flow', () => {
  const op = P.operatingPoint(cond({ speedRpm: 600, valvePct: 10 }));
  const m = I.measure(op, 10, 600, 1, 1);
  assert.ok(m.flowLps < 4);
  for (const c of I.analyse(m)) { assert.equal(c.flag, 'unclear'); assert.equal(c.reason, 'flow-too-low'); }
});

test('limit checks mark a value inside instrument error as too close to call', () => {
  const m = { flowLps: 12.0, suctionKpa: 20, dischargeKpa: 100, postValveKpa: 80, shaftKw: 1.5, speedRpm: 1230, valveHandlePct: 100, sourceLevelM: 2.5, destLevelM: 0.5, crackling: false };
  assert.equal(I.limitChecks(m).find(l => l.key === 'flow').status, 'close');
  assert.equal(I.limitChecks({ ...m, flowLps: 13.5 }).find(l => l.key === 'flow').status, 'met');
  assert.equal(I.limitChecks({ ...m, flowLps: 9 }).find(l => l.key === 'flow').status, 'not-met');
  assert.equal(I.limitChecks({ ...m, shaftKw: 2.5 }).find(l => l.key === 'power').status, 'not-met');
});

// ---------------------------------------------------------------- session: determinism, reset, validation

function fullJourney(caseId, { seed = 7, sessionId = 'journey', hints = 0, wrongFirst = false } = {}) {
  clock = Date.parse('2026-10-23T09:00:00Z');
  let s = fresh(caseId, seed, sessionId);
  const spec = K.CASES[caseId];
  s = play(s, { type: 'predict', flowLps: 10 }, { type: 'take-reading' });
  const informative = { type: 'set-settings', speedRpm: 1230, valvePct: 100 };
  if (s.readings[0].measured.flowLps < 4) s = play(s, informative, { type: 'predict', flowLps: 10 }, { type: 'take-reading' });
  const rid = s.readings[s.readings.length - 1].id;
  for (const section of ['suction', 'pump', 'valve']) s = step(s, { type: 'inspect-section', readingId: rid, section });
  for (let h = 1; h <= hints; h++) s = step(s, { type: 'show-hint', level: h });
  if (wrongFirst) s = step(s, { type: 'submit-explanation', cause: 'speed-too-low', evidenceIds: [], note: 'guess' });
  const ids = s.inspections.filter(i => i.readingId === rid).map(i => i.id);
  s = step(s, { type: 'submit-explanation', cause: spec.trueCause, evidenceIds: ids, note: 'The comparison shows it.' });
  if (spec.repair) {
    s = step(s, { type: 'apply-repair', repair: spec.repair });
    s = play(s, { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 12.5 }, { type: 'take-reading' });
    const after = s.readings[s.readings.length - 1].id;
    s = step(s, { type: 'compare', a: s.readings[0].id, b: after });
  } else {
    s = play(s, { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 12.5 }, { type: 'take-reading' });
    s = step(s, { type: 'compare', a: s.readings[0].id, b: s.readings[s.readings.length - 1].id });
  }
  return step(s, { type: 'complete-case' });
}

test('learner journey: every case can be solved end to end', () => {
  for (const id of K.CASE_IDS) {
    const s = fullJourney(id);
    assert.ok(s.completed, id);
    const a = S.assess(s);
    assert.equal(a.complete, true);
    assert.ok(a.checks.every(c => c.met), `${id}: ${JSON.stringify(a.checks.filter(c => !c.met))}`);
    assert.equal(a.assistance, 'none');
  }
});

test('determinism: the same actions and seed give byte-identical state, and a replay matches', () => {
  const a = fullJourney('noisy-suction', { seed: 99, sessionId: 'd' });
  const b = fullJourney('noisy-suction', { seed: 99, sessionId: 'd' });
  assert.equal(JSON.stringify(a.readings), JSON.stringify(b.readings));
  assert.equal(S.serialize(a), S.serialize(b));
  const restored = S.restore(S.serialize(a));
  assert.deepEqual(restored, a);
  assert.equal(R.fnv1a(JSON.stringify(restored)), R.fnv1a(JSON.stringify(a)));
});

test('determinism: a different seed changes the instrument noise but not the underlying result', () => {
  const a = fullJourney('weak-delivery', { seed: 1, sessionId: 'x' });
  const b = fullJourney('weak-delivery', { seed: 2, sessionId: 'x' });
  assert.notDeepEqual(a.readings.map(r => r.measured), b.readings.map(r => r.measured));
  assert.deepEqual(a.readings.map(r => r.meetsAll), b.readings.map(r => r.meetsAll));
  assert.deepEqual(a.tanks, b.tanks);
  assert.ok(b.completed);
});

test('reset restores the exact starting state', () => {
  let s = fullJourney('valve-handle-open', { hints: 3, wrongFirst: true });
  assert.notDeepEqual(s, fresh('valve-handle-open', 7, 'journey'));
  const r = S.resetRun(s);
  assert.deepEqual(r, S.initialState('journey', 7, 'valve-handle-open'));
  assert.equal(r.readings.length + r.hints.length + r.explanations.length + r.actions.length + r.log.length, 0);
  assert.deepEqual(r.tanks, P.INITIAL_TANKS);
  assert.equal(r.epoch, 0);
  assert.deepEqual(r.fault, K.CASES['valve-handle-open'].fault);
});

test('transition never mutates its input', () => {
  const s = fresh();
  const before = JSON.stringify(s);
  step(s, { type: 'predict', flowLps: 10 });
  assert.equal(JSON.stringify(s), before);
});

test('invalid actions are rejected with a stable code and leave the state untouched', () => {
  const s = play(fresh('noisy-suction'), { type: 'predict', flowLps: 8 }, { type: 'take-reading' });
  const snap = JSON.stringify(s);
  const bad = (action, code) => { throwsCode(() => S.transition(s, action, at()), code); assert.equal(JSON.stringify(s), snap); };
  for (const v of [NaN, Infinity, -Infinity, '1230', null, undefined, {}, [], true]) {
    assert.throws(() => S.transition(s, { type: 'set-settings', speedRpm: v, valvePct: 50 }, at()), e => e instanceof P.PumpLabError);
    assert.throws(() => S.transition(s, { type: 'set-settings', speedRpm: 1000, valvePct: v }, at()), e => e instanceof P.PumpLabError);
    assert.throws(() => S.transition(s, { type: 'predict', flowLps: v }, at()), e => e instanceof P.PumpLabError);
    assert.throws(() => S.transition(s, { type: 'run-transfer', seconds: v }, at()), e => e instanceof P.PumpLabError);
  }
  bad({ type: 'set-settings', speedRpm: 599, valvePct: 50 }, 'out-of-range');
  bad({ type: 'set-settings', speedRpm: 1000.5, valvePct: 50 }, 'not-integer');
  bad({ type: 'set-settings', speedRpm: 1000, valvePct: 101 }, 'out-of-range');
  bad({ type: 'predict', flowLps: -1 }, 'out-of-range');
  bad({ type: 'predict', flowLps: 31 }, 'out-of-range');
  bad({ type: 'run-transfer', seconds: 0 }, 'out-of-range');
  bad({ type: 'inspect-section', readingId: 'R9', section: 'pump' }, 'unknown-reading');
  bad({ type: 'inspect-section', readingId: 'R1', section: 'tank' }, 'unknown-section');
  bad({ type: 'inspect-part', part: 'motor' }, 'unknown-part');
  bad({ type: 'compare', a: 'R1', b: 'R1' }, 'bad-comparison');
  bad({ type: 'compare', a: 'R1', b: 'R2' }, 'unknown-reading');
  bad({ type: 'show-hint', level: 2 }, 'hint-order');
  bad({ type: 'show-hint', level: 4 }, 'bad-hint');
  bad({ type: 'submit-explanation', cause: 'gremlins', evidenceIds: [], note: '' }, 'unknown-cause');
  bad({ type: 'submit-explanation', cause: 'no-fault', evidenceIds: [], note: '' }, 'no-evidence');
  bad({ type: 'apply-repair', repair: 'turn-it-off-and-on' }, 'unknown-repair');
  bad({ type: 'apply-repair', repair: 'clear-strainer' }, 'explain-first');
  bad({ type: 'complete-case' }, 'repair-required');
  bad({ type: 'launch-missiles' }, 'bad-action');
  assert.throws(() => S.transition(s, null, at()), e => e instanceof P.PumpLabError);
  assert.throws(() => S.transition(s, { type: 'take-reading' }, 'yesterday'), e => e instanceof P.PumpLabError && e.code === 'bad-time');
  assert.throws(() => S.transition(s, { type: 'take-reading' }, '2026-02-30T10:00:00Z'), e => e instanceof P.PumpLabError && e.code === 'bad-time');
  assert.throws(() => S.initialState('', 1, 'noisy-suction'), e => e.code === 'bad-session-id');
  assert.throws(() => S.initialState('a', -1, 'noisy-suction'), e => e.code === 'bad-seed');
  assert.throws(() => S.initialState('a', 1.5, 'noisy-suction'), e => e.code === 'bad-seed');
  assert.throws(() => S.initialState('a', 2 ** 32, 'noisy-suction'), e => e.code === 'bad-seed');
  assert.throws(() => S.initialState('a', 1, 'nope'), e => e.code === 'unknown-case');
});

test('prediction comes before the first reading, and the matching prediction is scored', () => {
  const s0 = fresh('baseline-commissioning');
  throwsCode(() => step(s0, { type: 'take-reading' }), 'prediction-required');
  const s = play(s0, { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 12 }, { type: 'take-reading' });
  assert.equal(s.predictions[0].readingId, 'R1');
  assert.equal(s.predictions[0].errorLps, Math.round((s.readings[0].measured.flowLps - 12) * 10) / 10);
  assert.equal(s.readings[0].predictionId, 'P1');
  // a later reading at different settings does not need a fresh prediction but is not scored against the old one
  const t = play(s, { type: 'set-settings', speedRpm: 1000, valvePct: 80 }, { type: 'take-reading' });
  assert.equal(t.readings[1].predictionId, null);
});

test('the repair starts a new condition that needs its own prediction', () => {
  const spec = K.CASES['valve-handle-open'];
  let s = play(fresh('valve-handle-open'), { type: 'predict', flowLps: 10 }, { type: 'take-reading' });
  for (const section of ['suction', 'pump', 'valve']) s = step(s, { type: 'inspect-section', readingId: 'R1', section });
  s = step(s, { type: 'submit-explanation', cause: spec.trueCause, evidenceIds: ['R1.valve'], note: '' });
  s = step(s, { type: 'apply-repair', repair: spec.repair });
  assert.equal(s.epoch, 1);
  throwsCode(() => step(s, { type: 'take-reading' }), 'prediction-required');
  throwsCode(() => step(s, { type: 'submit-explanation', cause: spec.trueCause, evidenceIds: ['R1.valve'], note: '' }), 'after-repair');
  throwsCode(() => step(s, { type: 'apply-repair', repair: spec.repair }), 'already-repaired');
  assert.deepEqual(s.fault, P.HEALTHY);
});

test('opening a part waits for evidence, and a wrong repair changes nothing', () => {
  let s = fresh('weak-delivery');
  throwsCode(() => step(s, { type: 'inspect-part', part: 'impeller' }), 'evidence-first');
  s = play(s, { type: 'predict', flowLps: 11 }, { type: 'take-reading' }, { type: 'inspect-section', readingId: 'R1', section: 'pump' });
  s = step(s, { type: 'inspect-part', part: 'impeller' });
  assert.match(s.teardowns[0].text, /eroded/);
  throwsCode(() => step(s, { type: 'inspect-part', part: 'impeller' }), 'already-inspected');
  s = play(s, { type: 'inspect-section', readingId: 'R1', section: 'suction' }, { type: 'inspect-section', readingId: 'R1', section: 'valve' });
  s = step(s, { type: 'submit-explanation', cause: 'impeller-worn', evidenceIds: ['R1.pump', 'R1.suction', 'R1.valve'], note: '' });
  const before = JSON.stringify(s.fault);
  s = step(s, { type: 'apply-repair', repair: 'clear-strainer' });
  assert.equal(s.repairs[0].effective, false);
  assert.equal(JSON.stringify(s.fault), before);
  assert.equal(s.epoch, 0);
});

test('finishing needs a real comparison and every limit met', () => {
  let s = play(fresh('baseline-commissioning'), { type: 'predict', flowLps: 15 }, { type: 'take-reading' });
  for (const section of ['suction', 'pump', 'valve']) s = step(s, { type: 'inspect-section', readingId: 'R1', section });
  s = step(s, { type: 'submit-explanation', cause: 'no-fault', evidenceIds: ['R1.suction', 'R1.pump', 'R1.valve'], note: '' });
  throwsCode(() => step(s, { type: 'complete-case' }), 'compare-first');
  s = play(s, { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 12.5 }, { type: 'take-reading' });
  throwsCode(() => step(s, { type: 'complete-case' }), 'compare-first');
  const failing = play(s, { type: 'set-settings', speedRpm: 1450, valvePct: 100 }, { type: 'predict', flowLps: 15 }, { type: 'take-reading' }, { type: 'compare', a: 'R1', b: 'R3' });
  throwsCode(() => step(failing, { type: 'complete-case' }), 'limits-not-met');
  const ok = step(s, { type: 'compare', a: 'R1', b: 'R2' });
  assert.ok(step(ok, { type: 'complete-case' }).completed);
  throwsCode(() => step(step(ok, { type: 'complete-case' }), { type: 'take-reading' }), 'case-complete');
});

// ---------------------------------------------------------------- explanation, evidence and help

test('explanation: the right cause needs the deciding comparison from before the repair', () => {
  let s = play(fresh('noisy-suction'), { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 11 }, { type: 'take-reading' });
  s = step(s, { type: 'inspect-section', readingId: 'R1', section: 'pump' });
  s = step(s, { type: 'submit-explanation', cause: 'strainer-blocked', evidenceIds: ['R1.pump'], note: '' });
  assert.equal(s.explanations[0].outcome, 'right-cause-weak-evidence');
  assert.match(s.explanations[0].feedback.join(' '), /deciding comparison is on the suction line/i);
  s = step(s, { type: 'inspect-section', readingId: 'R1', section: 'suction' });
  s = step(s, { type: 'submit-explanation', cause: 'strainer-blocked', evidenceIds: ['R1.suction', 'R1.pump'], note: 'Suction loss is far above the datasheet.' });
  assert.equal(s.explanations[1].outcome, 'supported');
  assert.match(s.explanations[1].feedback.join(' '), /starved|suction loss/i);
});

test('explanation: a wrong cause is explained from the learner\'s own evidence without naming the answer', () => {
  let s = play(fresh('valve-handle-open'), { type: 'predict', flowLps: 10 }, { type: 'take-reading' }, { type: 'inspect-section', readingId: 'R1', section: 'valve' });
  s = step(s, { type: 'submit-explanation', cause: 'speed-too-low', evidenceIds: ['R1.valve'], note: '' });
  const e = s.explanations[0];
  assert.equal(e.outcome, 'wrong-cause');
  const text = e.feedback.join(' ');
  assert.match(text, /full speed|1450 rpm/i);
  assert.doesNotMatch(text, /valve gate|stuck/i, 'must not give away the cause');
  s = step(s, { type: 'submit-explanation', cause: 'strainer-blocked', evidenceIds: [], note: '' });
  assert.match(s.explanations[1].feedback.join(' '), /not compared that section yet/i);
  s = step(s, { type: 'inspect-section', readingId: 'R1', section: 'suction' });
  s = step(s, { type: 'submit-explanation', cause: 'strainer-blocked', evidenceIds: ['R1.suction'], note: '' });
  assert.match(s.explanations[2].feedback.join(' '), /R1 comparison says it is as expected/i);
});

test('explanation: evidence can only cite comparisons the learner made, once each', () => {
  const s = play(fresh('weak-delivery'), { type: 'predict', flowLps: 10 }, { type: 'take-reading' }, { type: 'inspect-section', readingId: 'R1', section: 'pump' });
  throwsCode(() => step(s, { type: 'submit-explanation', cause: 'impeller-worn', evidenceIds: ['R1.valve'], note: '' }), 'unknown-evidence');
  throwsCode(() => step(s, { type: 'submit-explanation', cause: 'impeller-worn', evidenceIds: ['R1.pump', 'R1.pump'], note: '' }), 'bad-evidence');
  throwsCode(() => step(s, { type: 'submit-explanation', cause: 'impeller-worn', evidenceIds: ['R1.pump'], note: 'x'.repeat(401) }), 'bad-note');
});

test('help used stays in the evidence', () => {
  const none = fullJourney('noisy-suction');
  const hinted = fullJourney('noisy-suction', { hints: 2, wrongFirst: true });
  const worked = fullJourney('noisy-suction', { hints: 3 });
  assert.equal(S.assess(none).assistance, 'none');
  assert.equal(S.assess(hinted).assistance, 'hint');
  assert.equal(S.assess(worked).assistance, 'worked-example');
  assert.equal(S.assess(hinted).firstTrySupported, false);
  assert.equal(S.assess(none).firstTrySupported, true);
  for (const [state, level] of [[none, 'none'], [hinted, 'hint'], [worked, 'worked-example']]) {
    const item = R.toEvidenceItem(state);
    assert.equal(item.assistanceUsed.level, level);
    assert.deepEqual(item.assistanceUsed.hintLevels, state.hints.map(h => h.level));
    const report = R.buildReport(state);
    assert.equal(report.assistance.level, level);
    const text = R.reportText(report);
    if (level === 'worked-example') assert.match(text, /worked comparison/);
    if (level === 'hint') assert.match(text, /hints up to level 2/);
    if (level === 'none') assert.match(text, /Help used: none/);
  }
});

test('opening a part before the explanation is supported is recorded as such', () => {
  let s = play(fresh('weak-delivery'), { type: 'predict', flowLps: 10 }, { type: 'take-reading' }, { type: 'inspect-section', readingId: 'R1', section: 'pump' }, { type: 'inspect-part', part: 'impeller' });
  assert.equal(S.assess(s).directInspectionBeforeSupported, true);
  s = play(s, { type: 'inspect-section', readingId: 'R1', section: 'suction' }, { type: 'inspect-section', readingId: 'R1', section: 'valve' }, { type: 'submit-explanation', cause: 'impeller-worn', evidenceIds: ['R1.pump', 'R1.suction', 'R1.valve'], note: '' });
  assert.equal(R.toEvidenceItem(s).assistanceUsed.openedPartsBeforeSupportedExplanation, true);
  assert.match(R.reportText(R.buildReport(s)), /opened a part before the explanation was supported/);
});

test('hints are one at a time and carry no hidden-cause names', () => {
  for (const id of K.CASE_IDS) {
    assert.equal(K.CASES[id].hints.length, 3);
    for (const h of K.CASES[id].hints.slice(0, 2)) assert.doesNotMatch(h, /stuck|blocked|worn out|seized/i, `${id} hint names the cause`);
  }
});

// ---------------------------------------------------------------- serialization

test('restore rebuilds a session by replay and rejects anything malformed or tampered', () => {
  const good = S.serialize(fullJourney('valve-handle-open'));
  assert.ok(S.restore(good));
  const parsed = JSON.parse(good);
  const mutate = (fn) => { const p = structuredClone(parsed); fn(p); return JSON.stringify(p); };
  const bads = [
    '', 'null', '[]', '{', 'x'.repeat(300000),
    mutate(p => { p.schema = 'other/1'; }),
    mutate(p => { p.seed = 'seven'; }),
    mutate(p => { p.seed = -5; }),
    mutate(p => { p.caseId = 'unknown'; }),
    mutate(p => { p.sessionId = ''; }),
    mutate(p => { p.actions = 'nope'; }),
    mutate(p => { p.actions[0].at = 'not a date'; }),
    mutate(p => { p.actions[0].action.type = 'teleport'; }),
    mutate(p => { p.actions.splice(0, 1); }),
    mutate(p => { p.actions.find(a => a.action.type === 'set-settings') && (p.actions.find(a => a.action.type === 'set-settings').action.speedRpm = 99999); }),
    mutate(p => { p.actions.push(...Array.from({ length: 401 }, () => structuredClone(p.actions[0]))); }),
  ];
  for (const b of bads) assert.equal(S.restore(b), null);
  for (const nonString of [null, undefined, 5, {}, []]) assert.equal(S.restore(nonString), null);
  assert.equal(S.restore('{"schema":"kairo-pump-lab-session/1","sessionId":"a","seed":1,"caseId":"weak-delivery","actions":[],"__proto__":{"polluted":true}}')?.sessionId, 'a');
  assert.equal({}.polluted, undefined);
});

test('the action log is capped', () => {
  let s = fresh();
  for (let i = 0; i < S.MAX.actions; i++) s = step(s, { type: 'set-settings', speedRpm: 600 + (i % 2), valvePct: 50 });
  throwsCode(() => step(s, { type: 'set-settings', speedRpm: 700, valvePct: 50 }), 'session-full');
});

// ---------------------------------------------------------------- report and evidence

test('report and evidence item are honest about what they are', () => {
  const s = fullJourney('weak-delivery', { seed: 11, sessionId: 'rep' });
  const report = R.buildReport(s);
  const text = R.reportText(report);
  assert.equal(report.schema, 'kairo-pump-lab-report/1');
  assert.match(text, /Illustrative simulation/);
  assert.match(text, /no real maintenance was done/);
  assert.match(text, /seed 11/);
  assert.match(text, /not a certificate or a verified competency/);
  assert.match(text, /Limitations/);
  assert.match(text, /not a flow simulation|not computational fluid dynamics/i);
  assert.match(text, /changed the case state/);
  assert.match(text, /\[x\] Reached the target flow within every limit/);
  const item = R.toEvidenceItem(s);
  assert.equal(item.schema, 'kairo-evidence-item/pump-lab-draft-1');
  assert.equal(item.provenance.simulated, true);
  assert.equal(item.feedbackSource, 'deterministic-rule-based');
  assert.equal(item.reviewStatus, 'not reviewed by a domain expert');
  assert.deepEqual(item.events, { practiceCompleted: true, evidenceGenerated: true, competencyExternallyVerified: false });
  assert.equal(item.answer.cause, 'impeller-worn');
  assert.equal(item.itemId, R.toEvidenceItem(S.restore(S.serialize(s))).itemId, 'id is stable across a replay');
  const unfinished = R.toEvidenceItem(play(fresh(), { type: 'predict', flowLps: 5 }));
  assert.equal(unfinished.events.practiceCompleted, false);
  assert.equal(unfinished.answer, null);
});

test('learner-facing text makes no overclaims', () => {
  const strings = [];
  const walk = v => { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(K.CASES); walk(K.CAUSES); walk(K.REPAIRS); walk(K.PARTS); walk(L.TARGETS);
  const op = P.operatingPoint(cond({ fault: K.CASES['noisy-suction'].fault }));
  walk(L.stateCues(op, true)); walk(L.stateCues(op, false));
  walk(R.buildReport(fullJourney('noisy-suction')));
  walk(O.stateSummary(fullJourney('noisy-suction')));
  const banned = /digital twin|\bCFD\b|certified|accredited|guarantee|medical-grade|equipment-grade|real plant|(?<!not )validated against a real/i;
  for (const text of strings) assert.doesNotMatch(text, banned, text);
  assert.ok(strings.length > 100);
});

// ---------------------------------------------------------------- layout, targets, cues

test('scene targets: unique stable IDs, positions in bounds, a role for each', () => {
  assert.equal(new Set(L.TARGET_IDS).size, L.TARGET_IDS.length);
  assert.equal(L.TARGETS.length, L.TARGET_IDS.length);
  for (const t of L.TARGETS) {
    assert.ok(L.isTargetId(t.id));
    assert.equal(t.qualifiedId, `pump-lab/${t.id}`);
    assert.ok(t.label.length > 2 && t.role.length > 10, t.id);
    assert.ok(t.world.every(Number.isFinite) && t.diagram.every(Number.isFinite));
    assert.ok(t.diagram[0] >= 0 && t.diagram[0] <= L.DIAGRAM_VIEWBOX.w && t.diagram[1] >= 0 && t.diagram[1] <= L.DIAGRAM_VIEWBOX.h, t.id);
    assert.ok(Math.abs(t.world[0]) < 6 && t.world[1] >= 0 && t.world[1] < 4.5 && Math.abs(t.world[2]) < 4, t.id);
    assert.ok(O.targetReadout(fresh(), t.id).length >= 1);
  }
  assert.equal(L.isTargetId('pump-lab/valve'), false);
  assert.equal(L.isTargetId('__proto__'), false);
});

test('flow path: continuous, straight pipes, ports line up with the tanks and the pump', () => {
  const p = L.FLOW_PATH;
  for (let i = 1; i < p.length; i++) {
    const moved = [0, 1, 2].filter(k => Math.abs(p[i][k] - p[i - 1][k]) > 1e-9).length;
    assert.equal(moved, 1, `segment ${i} should run along one axis`);
  }
  assert.deepEqual(L.pathPoint(0), p[0]);
  L.pathPoint(1).forEach((v, k) => assert.ok(Math.abs(v - p[p.length - 1][k]) < 1e-9));
  assert.equal(L.SUCTION_PIPE[1][0], p[2][0]);
  assert.deepEqual(L.DISCHARGE_PIPE[0], p[4]);
  assert.equal(p[1][0], L.SOURCE_TANK.centre[0] + L.SOURCE_TANK.size[0] / 2, 'source outlet on the tank wall');
  assert.equal(p[8][0], L.DEST_TANK.centre[0] - L.DEST_TANK.size[0] / 2, 'destination inlet on the tank wall');
  assert.ok(p[8][1] > L.DEST_TANK.centre[1] && p[8][1] < L.DEST_TANK.centre[1] + L.TANK_WALL_Y, 'inlet is inside the destination tank height');
  assert.ok(Math.abs(L.DEST_TANK.centre[1] - P.CIRCUIT.destBaseM * L.SCENE_UNITS_PER_M) < 1e-12, 'elevation drawn to the same scale as the level');
  assert.ok(L.PUMP_PATH_U > 0 && L.PUMP_PATH_U < 1);
  assert.equal(L.zoneAt(0.01), 'suction');
  assert.equal(L.zoneAt(0.99), 'discharge');
  let prev = L.pathPoint(0);
  let total = 0;
  for (let i = 1; i <= 200; i++) { const q = L.pathPoint(i / 200); total += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]); prev = q; }
  assert.ok(Math.abs(total - L.PATH_LENGTH) / L.PATH_LENGTH < 0.01);
});

test('particles move only with flow, at a speed proportional to it', () => {
  for (let i = 0; i < L.PARTICLE_COUNT; i += 7) assert.equal(L.particleU(i, 5, 0), L.particleU(i, 0, 0));
  const a = (L.particleU(3, 1, 6) - L.particleU(3, 0, 6) + 1) % 1;
  const b = (L.particleU(3, 1, 12) - L.particleU(3, 0, 12) + 1) % 1;
  assert.ok(Math.abs(b / a - 2) < 1e-9);
  for (let i = 0; i < L.PARTICLE_COUNT; i++) { const u = L.particleU(i, 123.4, 9.9); assert.ok(u >= 0 && u < 1); }
  assert.deepEqual(L.particleU(5, 2, 8), L.particleU(5, 2, 8));
});

test('every cue is tied to a defined state', () => {
  const cueOn = (op, live) => Object.fromEntries(L.stateCues(op, live).map(c => [c.id, c.active]));
  const healthy = P.operatingPoint(cond({ speedRpm: 1230 }));
  assert.deepEqual(cueOn(healthy, true), { 'impeller-spin': true, 'flow-particles': true, 'cavitation-bubbles': false, 'discharge-over-limit': false, 'motor-over-rating': false, 'source-low': false });
  assert.ok(Object.values(cueOn(healthy, false)).every(v => v === false), 'nothing runs before the prediction');
  const strainer = P.operatingPoint(cond({ fault: K.CASES['noisy-suction'].fault }));
  assert.equal(cueOn(strainer, true)['cavitation-bubbles'], true);
  assert.equal(cueOn(healthy, true)['cavitation-bubbles'], false);
  const stuck = P.operatingPoint(cond({ fault: K.CASES['valve-handle-open'].fault }));
  assert.equal(cueOn(stuck, true)['discharge-over-limit'], true);
  const overload = P.operatingPoint(cond());
  assert.equal(cueOn(overload, true)['motor-over-rating'], true);
  const closed = P.operatingPoint(cond({ valvePct: 0 }));
  assert.equal(cueOn(closed, true)['flow-particles'], false);
  const dry = P.operatingPoint(cond({ tanks: { sourceL: 300, destL: 8700 } }));
  assert.equal(cueOn(dry, true)['source-low'], true);
  for (const c of L.stateCues(healthy, true)) { assert.ok(c.meaning.length > 20 && c.text.length > 5); assert.ok(L.isTargetId(c.target)); }
});

test('teacher anchors resolve, or fall back to a highlight rather than a wrong point', () => {
  const ok = L.resolveAnchor('valve', 'diagram');
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.position, L.TARGET_BY_ID.valve.diagram);
  const ok3 = L.resolveAnchor('valve', '3d');
  assert.deepEqual(ok3.position, L.TARGET_BY_ID.valve.world);
  assert.deepEqual(L.resolveAnchor('valve', '3d', false), { ok: false, reason: 'view-unavailable', fallback: 'highlight-list-entry' });
  assert.deepEqual(L.resolveAnchor('rain', 'diagram'), { ok: false, reason: 'unknown-target', fallback: 'highlight-list-entry' });
  assert.equal(L.resolveAnchor('constructor', 'diagram').ok, false);
});

test('gauges show only what the learner has measured, never the live hidden value', () => {
  let s = fresh('valve-handle-open');
  assert.match(O.targetReadout(s, 'gauge-discharge').join(' '), /No reading yet/);
  assert.match(O.targetReadout(s, 'flow-meter').join(' '), /No reading yet/);
  s = play(s, { type: 'predict', flowLps: 10 }, { type: 'take-reading' });
  const text = O.targetReadout(s, 'flow-meter').join(' ');
  assert.match(text, new RegExp(`${s.readings[0].measured.flowLps.toFixed(1)} L/s`));
  const truth = P.operatingPoint({ ...s.settings, tanks: s.tanks, fault: s.fault }).flowLps;
  assert.notEqual(String(truth), String(s.readings[0].measured.flowLps), 'the display is the rounded noisy reading');
  const ctx = O.teacherContext(s, 'valve');
  assert.equal(ctx.selectedTarget, 'pump-lab/valve');
  assert.equal(JSON.stringify(ctx).includes('stuck'), false, 'the teacher context never carries the hidden fault');
  assert.equal(JSON.stringify(ctx).includes('valve-gate-stuck'), false);
});

test('plot curves: datasheet pump curve falls, system curve rises', () => {
  const c = cond({ speedRpm: 1230 });
  const pump = P.curvePoints('pump', c);
  const sys = P.curvePoints('system', c);
  for (let i = 1; i < pump.length; i++) assert.ok(pump[i].h < pump[i - 1].h);
  for (let i = 1; i < sys.length; i++) assert.ok(sys[i].h > sys[i - 1].h);
  assert.deepEqual(P.curvePoints('system', cond({ valvePct: 0 })), []);
});

// ---------------------------------------------------------------- interface, isolation and provenance

test('interface version and scope are fixed', () => {
  assert.equal(IF.PUMP_LAB_INTERFACE_VERSION, 'kairo-pump-lab-interface/1');
  assert.equal(S.SESSION_SCHEMA, 'kairo-pump-lab-session/1');
});

test('the module stays inside its own subtree and keeps three.js out of the entry', () => {
  const dir = join(here, '..', 'src', 'pump-lab');
  const files = ['PumpLab.tsx', 'PumpDiagram.tsx', 'PumpPlots.tsx', 'PumpScene.tsx', 'physics.ts', 'instruments.ts', 'cases.ts', 'session.ts', 'report.ts', 'layout.ts', 'readout.ts', 'interface.ts', 'preview.tsx'];
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    for (const m of src.matchAll(/from\s+'(\.[^']+)'|import\('(\.[^']+)'\)/g)) {
      const spec = m[1] ?? m[2];
      if (f === 'preview.tsx' && spec === '../styles.css') continue;
      assert.ok(!spec.startsWith('..'), `${f} imports outside its subtree: ${spec}`);
    }
  }
  const entry = readFileSync(join(dir, 'PumpLab.tsx'), 'utf8');
  assert.match(entry, /lazy\(\(\) => import\('\.\/PumpScene'\)\)/);
  assert.doesNotMatch(entry, /from 'three'|@react-three/);
  for (const f of ['physics.ts', 'instruments.ts', 'cases.ts', 'session.ts', 'report.ts', 'layout.ts', 'readout.ts']) {
    const src = readFileSync(join(dir, f), 'utf8').split(/\r?\n/).filter(line => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n');
    assert.doesNotMatch(src, /Math\.random|Date\.now|new Date\(|performance\.now/, `${f} must stay deterministic`);
    assert.doesNotMatch(src, /from 'react'|from 'three'/, `${f} must not import UI libraries`);
  }
});

test('asset and source manifest matches the code it describes', () => {
  const path = join(root, 'assets', 'pump-lab', 'manifest.json');
  assert.ok(existsSync(path), 'manifest exists');
  const m = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(m.schema, 'kairo-pump-lab-manifest/1');
  assert.equal(m.modelVersion, P.MODEL_VERSION);
  assert.ok(Array.isArray(m.assets) && m.assets.length >= 1);
  for (const a of m.assets) {
    for (const k of ['id', 'kind', 'origin', 'creator', 'licence', 'file']) assert.ok(a[k], `${a.id} lacks ${k}`);
    assert.equal(a.origin, 'procedural', 'no downloaded meshes or textures in this package');
    assert.ok(existsSync(join(root, a.file)), `${a.file} exists`);
  }
  assert.deepEqual([...m.sceneTargets].sort(), [...L.TARGET_IDS].sort());
  assert.ok(Array.isArray(m.references) && m.references.length >= 3);
  for (const r of m.references) {
    assert.ok(r.title && r.url && r.use && r.retrieved, r.title);
    assert.match(r.url, /^https:\/\//);
    assert.ok(['concept-only', 'constant-only', 'not-used'].includes(r.use), r.title);
  }
  assert.equal(m.downloadedFiles.length, 0);
  assert.equal(m.fonts.bundledByThisPackage, false);
});
