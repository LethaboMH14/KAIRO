// Verification for the Engineering Studio calculations (ENG-001, supply experiments ENG-002A).
// Run from the project root:  node --test docs/engineering/checks/
// Node strips the TypeScript types, so these tests exercise the studio's own code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEMO, NORMAL_SUPPLY, PHASES, PHASE_AXES, SUPPORTED_POLES, demoAngles, easeInOutCubic, explodeDuration, fieldTurning,
  northPoleAngle, peakCurrents, phaseCurrents, readNumber, slotFieldNorthAngle, stageProgress, statorField, statorMmf, synchronousSpeed,
  turningParts, windingCurrents, wrapAngle,
} from '../../../studio/src/engineering/fieldMath.ts';

const geometry = JSON.parse(readFileSync(new URL('../../../studio/src/engineering/motorGeometry.json', import.meta.url), 'utf8'));
const DEG = Math.PI / 180;

// Independent reference: Engineering ToolBox, "Induction Motors - No. of Poles and
// Synchronous vs. Full Load Speed" (synchronous columns), checked 21 Oct 2026.
const REFERENCE_SPEEDS = [
  [50, 2, 3000], [50, 4, 1500], [50, 6, 1000], [50, 8, 750],
  [60, 2, 3600], [60, 4, 1800], [60, 6, 1200], [60, 8, 900],
];

test('synchronous speed matches the published reference table', () => {
  for (const [f, p, expected] of REFERENCE_SPEEDS) {
    const result = synchronousSpeed(f, p);
    assert.equal(result.ok, true, `${f} Hz, ${p} poles`);
    assert.equal(result.rpm, expected, `${f} Hz, ${p} poles`);
    assert.equal(result.revPerSecond, expected / 60);
  }
});

test('brief and contract examples', () => {
  assert.equal(synchronousSpeed(50, 4).rpm, 1500);
  assert.equal(synchronousSpeed(50, 2).rpm, 3000);
  assert.equal(synchronousSpeed(60, 4).rpm, 1800);
});

test('invalid frequency is rejected before any division', () => {
  for (const f of [Number.NaN, Infinity, -Infinity, 0, -50, 0.5, 400.01, 1e9]) {
    const result = synchronousSpeed(f, 4);
    assert.equal(result.ok, false, `frequency ${f}`);
    assert.equal(result.field, 'frequency');
  }
});

test('only explicit even pole counts are accepted', () => {
  for (const p of [Number.NaN, Infinity, 0, -4, 1, 3, 5, 2.5, 14, 100]) {
    const result = synchronousSpeed(50, p);
    assert.equal(result.ok, false, `poles ${p}`);
    assert.equal(result.field, 'poles');
  }
  for (const p of SUPPORTED_POLES) assert.equal(synchronousSpeed(50, p).ok, true);
});

test('every accepted result is finite and positive', () => {
  for (let f = 1; f <= 400; f += 0.5) {
    for (const p of SUPPORTED_POLES) {
      const result = synchronousSpeed(f, p);
      assert.ok(result.ok && Number.isFinite(result.rpm) && result.rpm > 0);
    }
  }
});

test('typed numbers: decimal comma accepted, malformed text rejected', () => {
  assert.equal(readNumber('50'), 50);
  assert.equal(readNumber(' 50,5 '), 50.5);
  assert.equal(readNumber('5.'), 5);
  assert.equal(readNumber('.5'), 0.5);
  for (const text of ['', ' ', 'abc', '1e3', '50Hz', '5,0,0', '--5', 'NaN', 'Infinity']) {
    assert.ok(Number.isNaN(readNumber(text)), JSON.stringify(text));
  }
});

test('balanced phase currents sum to zero', () => {
  for (let a = 0; a < 2 * Math.PI; a += 0.01) {
    const i = phaseCurrents(a);
    assert.ok(Math.abs(i.U + i.V + i.W) < 1e-12);
  }
});

test('idealised field keeps a constant 3/2 magnitude and turns at f / pole pairs', () => {
  for (let e = 0; e < 4 * Math.PI; e += 0.05) {
    let best = -Infinity;
    let bestPhi = 0;
    for (let s = 0; s < 3600; s++) {
      const phi = (2 * Math.PI * s) / 3600;
      const value = statorMmf(phi, e);
      if (value > best) { best = value; bestPhi = phi; }
    }
    assert.ok(Math.abs(best - 1.5) < 1e-4, `amplitude ${best}`);
    const expected = northPoleAngle(e);
    const gap = Math.abs(wrapAngle(bestPhi - expected + Math.PI / 2, Math.PI) - Math.PI / 2);
    assert.ok(gap < 0.2 * DEG, `peak ${bestPhi / DEG} vs ${expected / DEG}`);
  }
});

test('phase axes agree with the slot table exported from the 3D model', () => {
  assert.equal(geometry.slots.length, 36);
  for (let e = 0; e < 2 * Math.PI; e += Math.PI / 24) {
    const fromSlots = slotFieldNorthAngle(geometry.slots, e);
    const analytic = northPoleAngle(e);
    const gap = Math.abs(wrapAngle(fromSlots - analytic + Math.PI / 2, Math.PI) - Math.PI / 2);
    // Three-slot phase belts give a stepped field; allow half a slot pitch.
    assert.ok(gap <= 5 * DEG, `electrical ${(e / DEG).toFixed(1)}: slots ${(fromSlots / DEG).toFixed(2)} vs analytic ${(analytic / DEG).toFixed(2)}`);
  }
  assert.ok(PHASE_AXES.V - PHASE_AXES.U === 60 * DEG || Math.abs(PHASE_AXES.V - PHASE_AXES.U - 60 * DEG) < 1e-12);
  assert.ok(Math.abs(PHASE_AXES.W - PHASE_AXES.V - 60 * DEG) < 1e-12);
});

test('slot table is a balanced four-pole, three-phase winding', () => {
  for (const phase of PHASES) {
    const slots = geometry.slots.filter(s => s.phase === phase);
    assert.equal(slots.length, 12, phase);
    assert.equal(slots.reduce((sum, s) => sum + s.sign, 0), 0, `${phase} go and return`);
  }
  assert.equal(geometry.machine.poles, 4);
});

test('demonstration: rotor lags the field by the stated slip; pausing is a pure function of time', () => {
  const a = demoAngles(3.2);
  const fieldTurned = a.electrical / 2;
  assert.ok(Math.abs(a.rotor - (1 - DEMO.slip) * fieldTurned) < 1e-12);
  assert.ok(Math.abs(a.cage - DEMO.bearingCageRatio * a.rotor) < 1e-12);
  assert.deepEqual(demoAngles(3.2), a);
  assert.ok(Math.abs(demoAngles(0).north - PHASE_AXES.U) < 1e-12);
});

test('explode staging returns exactly to assembly and is monotonic', () => {
  const stages = [[0, 0.4], [0.1, 0.5], [0.2, 0.6], [0.45, 1]];
  for (const stage of stages) {
    assert.equal(stageProgress(0, stage), 0);
    assert.equal(stageProgress(1, stage), 1);
    let previous = 0;
    for (let e = 0; e <= 1.0000001; e += 0.001) {
      const value = stageProgress(e, stage);
      assert.ok(value >= previous - 1e-15 && value >= 0 && value <= 1);
      previous = value;
    }
    // A long run of reversals still lands exactly on the assembled value.
    let e = 0;
    for (let k = 0; k < 500; k++) e = k % 2 ? 0 : Math.random();
    assert.equal(stageProgress(e, stage), 0);
  }
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(explodeDuration(0, 1, false), 650);
  assert.equal(explodeDuration(1, 0, true), 0);
});

// Supply experiments (ENG-002A). Expected values are worked by hand from the
// idealised currents: line k carries cos(θ − 120°·k); a swapped pair exchanges two
// windings' currents; with line k open the other two windings are in series across
// their line-to-line voltage and twice the impedance, carrying (v_a − v_b) / 2.
const SWAPS = { UV: { kind: 'swapped', lines: ['U', 'V'] }, VW: { kind: 'swapped', lines: ['V', 'W'] }, WU: { kind: 'swapped', lines: ['W', 'U'] } };
const OPENS = { U: { kind: 'open', line: 'U' }, V: { kind: 'open', line: 'V' }, W: { kind: 'open', line: 'W' } };
const HALF_ROOT3 = Math.sqrt(3) / 2;
const near = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
/** Angle between two north poles of a four-pole field, which repeat every 180 mechanical degrees. */
const poleGap = (a, b) => Math.abs(wrapAngle(a - b + Math.PI / 2, Math.PI) - Math.PI / 2);

/** Brute-force peak of the MMF around the bore: its height and where it is. */
function mmfPeak(electrical, supply) {
  let best = -Infinity;
  let at = 0;
  for (let s = 0; s < 3600; s++) {
    const phi = (2 * Math.PI * s) / 3600;
    const value = statorMmf(phi, electrical, 2, supply);
    if (value > best) { best = value; at = phi; }
  }
  return { height: best, at };
}

test('swapping two supply lines exchanges the currents in those two windings only', () => {
  const quarter = windingCurrents(Math.PI / 2, SWAPS.VW);
  near(quarter.U, 0, 1e-12, 'U');
  near(quarter.V, -HALF_ROOT3, 1e-12, 'V gets line W');
  near(quarter.W, HALF_ROOT3, 1e-12, 'W gets line V');
  const start = windingCurrents(0, SWAPS.UV);
  near(start.U, -0.5, 1e-12, 'U gets line V');
  near(start.V, 1, 1e-12, 'V gets line U');
  near(start.W, -0.5, 1e-12, 'W unchanged');
});

test('a swapped supply keeps the full 3/2 field but turns it the other way, whichever pair is swapped', () => {
  // At θ = 0 line U peaks, so a north pole sits on the axis of the winding fed by line U;
  // a quarter cycle later it has moved 45 mechanical degrees clockwise.
  const startDeg = { UV: 115, VW: 55, WU: 175 };
  for (const [pair, supply] of Object.entries(SWAPS)) {
    for (const [electricalDeg, expectedDeg] of [[0, startDeg[pair]], [90, startDeg[pair] - 45]]) {
      const peak = mmfPeak(electricalDeg * DEG, supply);
      near(peak.height, 1.5, 1e-4, `${pair} height`);
      assert.ok(poleGap(peak.at, expectedDeg * DEG) < 0.2 * DEG, `${pair} at ${electricalDeg}°: peak ${(peak.at / DEG).toFixed(1)}° vs ${expectedDeg}°`);
      const vector = statorField(windingCurrents(electricalDeg * DEG, supply));
      near(vector.strength, 1.5, 1e-12, `${pair} vector strength`);
      assert.ok(poleGap(vector.north, expectedDeg * DEG) < 1e-9, `${pair} vector north ${(vector.north / DEG).toFixed(3)}° vs ${expectedDeg}°`);
    }
  }
});

test('the normal field turns anticlockwise from the drive end; every swap reverses it; an open line stops it', () => {
  assert.equal(fieldTurning(NORMAL_SUPPLY), 1);
  for (const supply of Object.values(SWAPS)) assert.equal(fieldTurning(supply), -1);
  for (const supply of Object.values(OPENS)) assert.equal(fieldTurning(supply), 0);
  const normal = turningParts(NORMAL_SUPPLY);
  near(normal.forward, 1.5, 1e-12, 'normal forward');
  near(normal.backward, 0, 1e-12, 'normal backward');
  const swapped = turningParts(SWAPS.WU);
  near(swapped.forward, 0, 1e-12, 'swapped forward');
  near(swapped.backward, 1.5, 1e-12, 'swapped backward');
});

test('with one line open its winding carries nothing and the other two carry one current in opposite directions', () => {
  const start = windingCurrents(0, OPENS.W);
  near(start.U, 0.75, 1e-12, 'U at 0°');
  near(start.V, -0.75, 1e-12, 'V at 0°');
  assert.equal(start.W, 0);
  // Peak of (√3/2)·cos(θ + 30°) is at θ = 330°: √3/2 of the normal peak current.
  near(windingCurrents(330 * DEG, OPENS.W).U, HALF_ROOT3, 1e-12, 'U peak');
  for (const [line, supply] of Object.entries(OPENS)) {
    for (let e = 0; e < 2 * Math.PI; e += 0.05) {
      const i = windingCurrents(e, supply);
      assert.equal(i[line], 0, `${line} open`);
      near(i.U + i.V + i.W, 0, 1e-12, `${line} open: currents meet at the star point`);
    }
  }
});

test('with one line open the field pulsates on a fixed axis, at right angles electrically to the open winding', () => {
  // Line W open gives (3/2)·cos(θ + 30°)·cos(2(φ − 55°) + 30°): a north pole at 40° or,
  // when the current reverses, at 130°. The axis sits 45 mechanical degrees from the open winding.
  const axesDeg = { U: [100, 10], V: [70, 160], W: [40, 130] };
  for (const [line, supply] of Object.entries(OPENS)) {
    let highest = 0;
    let lowest = Infinity;
    for (let e = 0; e < 2 * Math.PI; e += Math.PI / 36) {
      const peak = mmfPeak(e, supply);
      highest = Math.max(highest, peak.height);
      lowest = Math.min(lowest, peak.height);
      if (peak.height < 0.05) continue;
      const onAxis = axesDeg[line].some(deg => poleGap(peak.at, deg * DEG) < 0.2 * DEG);
      assert.ok(onAxis, `line ${line} open, electrical ${(e / DEG).toFixed(0)}°: peak at ${(peak.at / DEG).toFixed(1)}°`);
      const vector = statorField(windingCurrents(e, supply));
      near(vector.strength, peak.height, 1e-3, `line ${line} vector strength`);
    }
    near(highest, 1.5, 1e-3, `line ${line} open: strongest`);
    near(lowest, 0, 1e-3, `line ${line} open: weakest`);
  }
});

test('a single-phased field is two half-strength fields turning in opposite directions', () => {
  for (const [line, supply] of Object.entries(OPENS)) {
    const parts = turningParts(supply);
    near(parts.forward, 0.75, 1e-12, `line ${line} forward`);
    near(parts.backward, 0.75, 1e-12, `line ${line} backward`);
  }
});

test('peak winding currents: unchanged by a swap; with a phase open, √3/2 of a normal start in the other two', () => {
  for (const supply of [NORMAL_SUPPLY, SWAPS.UV]) {
    for (const phase of PHASES) near(peakCurrents(supply)[phase], 1, 1e-4, `${supply.kind} ${phase}`);
  }
  const open = peakCurrents(OPENS.V);
  near(open.U, HALF_ROOT3, 1e-4, 'U with V open');
  near(open.W, HALF_ROOT3, 1e-4, 'W with V open');
  assert.equal(open.V, 0);
});

test('the field angle stays a finite number when a single-phased field passes through zero', () => {
  // Line W open: (√3/2)·cos(θ + 30°) is zero at θ = 60°.
  const vector = statorField(windingCurrents(60 * DEG, OPENS.W));
  assert.ok(vector.strength < 1e-12, `strength ${vector.strength}`);
  assert.ok(Number.isFinite(vector.north));
});

test('supply experiments agree with the slot table exported from the 3D model', () => {
  for (const supply of [...Object.values(SWAPS), ...Object.values(OPENS)]) {
    for (let e = 0; e < 2 * Math.PI; e += Math.PI / 24) {
      const vector = statorField(windingCurrents(e, supply));
      if (vector.strength < 0.5) continue; // a near-zero pulsating field has no meaningful axis
      const fromSlots = slotFieldNorthAngle(geometry.slots, e, 2, 720, supply);
      assert.ok(poleGap(fromSlots, vector.north) <= 5 * DEG, `${JSON.stringify(supply)} at ${(e / DEG).toFixed(1)}°: slots ${(fromSlots / DEG).toFixed(2)} vs ${(vector.north / DEG).toFixed(2)}`);
    }
  }
});

test('demonstration: a swapped supply runs the rotor backwards; with a line open the rotor stays at rest while the field pulses', () => {
  // 1 s of playback is 180 electrical degrees: the field turns 90° and the rotor 80 % of that.
  near(demoAngles(1, SWAPS.VW).rotor, -0.4 * Math.PI, 1e-12, 'reversed rotor');
  near(demoAngles(1).rotor, 0.4 * Math.PI, 1e-12, 'normal rotor');
  for (const t of [0, 0.3, 1, 7.7]) {
    const at = demoAngles(t, OPENS.W);
    assert.equal(at.rotor, 0, `rotor at ${t} s`);
    assert.equal(at.cage, 0, `bearing cage at ${t} s`);
    near(demoAngles(t).fieldStrength, 1, 1e-12, `normal strength at ${t} s`);
  }
  near(demoAngles(0, OPENS.W).fieldStrength, HALF_ROOT3, 1e-12, 'line W open at 0°: |cos 30°|');
  near(demoAngles(1 / 3, OPENS.W).fieldStrength, 0, 1e-12, 'line W open at 60°');
});
