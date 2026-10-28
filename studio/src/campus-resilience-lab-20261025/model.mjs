/**
 * KAIRO Campus Resilience Lab — deliberately fictional, hourly *educational* model.
 * NREL battery dispatch references support stepping SOC, load-vs-generation comparison,
 * bounded charge/discharge, and efficiency. They DO NOT support our invented numbers,
 * service order, site design or any physical equipment action.
 * Units: instantaneous power kW; energy per interval kWh = kW × hours.
 */
export const MODEL_VERSION = 'campus-resilience-educational/1';
export const SCENARIO_VERSION = 'campus-resilience-prepared/1';
export const ACTION_VERSION = 1;
export const LOADS = Object.freeze([
  { id: 'study', label: 'Student study spaces', kw: 7, description: 'Lights and study desks' },
  { id: 'connect', label: 'Campus connectivity', kw: 4, description: 'Campus learning network' },
  { id: 'teach', label: 'Classroom teaching', kw: 6, description: 'Teaching displays and equipment' },
  { id: 'leisure', label: 'Decorative and recreation', kw: 5, description: 'Optional leisure displays' }
]);
export const LOAD_IDS = Object.freeze(LOADS.map(load => load.id));
export const DEFAULT_ORDER = Object.freeze([...LOAD_IDS]);
export const REFERENCES = Object.freeze([
  { title: 'NREL System Advisor Model: Battery Storage', url: 'https://sam.nrel.gov/index.php?Itemid=360&id=94&option=com_content&view=article' },
  { title: 'NREL: Technoeconomic Modeling of Battery Energy Storage in SAM (NREL/TP-6A20-64641)', url: 'https://www.nrel.gov/docs/fy15osti/64641.pdf' }
]);
const shared = {
  version: SCENARIO_VERSION, hours: 6, stepHours: 1, gridMaxKw: 40,
  battery: { capacityKwh: 28, initialKwh: 18, chargeLimitKw: 8, dischargeLimitKw: 8, chargeEfficiency: 0.9, dischargeEfficiency: 0.9 },
  grid: [true, false, false, false, false, true],
  demandFactor: [1, 1, 1, 1, 1, 1]
};
export const SCENARIOS = Object.freeze({
  baseline: Object.freeze({
    ...shared, id: 'baseline', name: 'Round 1 · Clearer skies',
    solarKw: [0, 7, 13, 10, 5, 0],
    teachingNote: 'A planned four-hour grid interruption is expected from hour 2 to hour 5.'
  }),
  cloud: Object.freeze({
    ...shared, id: 'cloud', name: 'Round 2 · Passing cloud cover',
    solarKw: [0, 3, 8, 5, 3, 0],
    teachingNote: 'The same loads face lower solar supply. Change your strategy before running again.'
  })
});
// Freeze every versioned prepared input: a UI consumer must not mutate a replay.
for (const scenario of Object.values(SCENARIOS)) {
  Object.freeze(scenario.grid);
  Object.freeze(scenario.solarKw);
  Object.freeze(scenario.demandFactor);
  Object.freeze(scenario.battery);
}
const EPS = 1e-8;
const finite = (value, name, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new TypeError(name + ' must be a finite number between ' + min + ' and ' + max);
};
const exactKeys = (value, keys, name) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) throw new TypeError('Invalid ' + name + ' fields');
};
export function validateScenario(scenario) {
  if (!scenario || scenario.version !== SCENARIO_VERSION || typeof scenario.id !== 'string' || !/^[a-z-]{1,32}$/.test(scenario.id)) throw new TypeError('Invalid scenario version or ID');
  if (scenario.hours !== 6) throw new TypeError('A teaching scenario must contain exactly six steps');
  finite(scenario.stepHours, 'stepHours', 0.25, 1);
  finite(scenario.gridMaxKw, 'gridMaxKw', 0, 150);
  const b = scenario.battery;
  if (!b || typeof b !== 'object') throw new TypeError('Missing battery');
  finite(b.capacityKwh, 'capacityKwh', 0, 1000);
  finite(b.initialKwh, 'initialKwh', 0, b.capacityKwh);
  finite(b.chargeLimitKw, 'chargeLimitKw', 0, 150);
  finite(b.dischargeLimitKw, 'dischargeLimitKw', 0, 150);
  finite(b.chargeEfficiency, 'chargeEfficiency', 0.01, 1);
  finite(b.dischargeEfficiency, 'dischargeEfficiency', 0.01, 1);
  for (const key of ['solarKw', 'demandFactor', 'grid']) {
    if (!Array.isArray(scenario[key]) || scenario[key].length !== 6) throw new TypeError('Invalid six-hour ' + key);
  }
  scenario.solarKw.forEach((v, i) => finite(v, 'solarKw[' + i + ']', 0, 150));
  scenario.demandFactor.forEach((v, i) => finite(v, 'demandFactor[' + i + ']', 0, 4));
  if (scenario.grid.some(v => typeof v !== 'boolean')) throw new TypeError('Grid steps must be booleans');
  return scenario;
}
export function validateAction(action, expectedId) {
  exactKeys(action, ['version', 'scenarioId', 'priority', 'prediction'], 'action');
  if (action.version !== ACTION_VERSION || action.scenarioId !== expectedId) throw new TypeError('Scenario/action version mismatch');
  if (!Array.isArray(action.priority) || action.priority.length !== LOAD_IDS.length ||
      new Set(action.priority).size !== LOAD_IDS.length ||
      action.priority.some(x => !LOAD_IDS.includes(x))) throw new TypeError('Priority must be an exact load permutation');
  if (action.prediction !== 'none' && !LOAD_IDS.includes(action.prediction)) throw new TypeError('Invalid prediction');
  return action;
}
export const newAction = (scenarioId, priority = DEFAULT_ORDER, prediction = 'none') => ({
  version: ACTION_VERSION, scenarioId, priority: [...priority], prediction
});
const near = (a, b) => Math.abs(a - b) < EPS;
const clampTiny = x => Math.abs(x) < EPS ? 0 : x;
/**
 * Dispatch order, per 1-hour interval: supply each priority group from solar,
 * then available grid, then battery AC delivery. Afterwards charge any remaining
 * solar (never charge from grid). Never charge and discharge in one interval.
 * This priority/charging policy is a fictional *teaching assumption*.
 */
export function simulateScenario(scenario, action) {
  validateScenario(scenario);
  validateAction(action, scenario.id);
  let soc = scenario.battery.initialKwh;
  const totals = { demandKwh: 0, servedKwh: 0, unmetKwh: 0, solarKwh: 0,
    solarToLoadKwh: 0, solarToBatteryKwh: 0, curtailedKwh: 0,
    gridToLoadKwh: 0, batteryToLoadKwh: 0, batteryWithdrawnKwh: 0,
    batteryStoredKwh: 0, batteryLossKwh: 0 };
  const steps = [];
  for (let i = 0; i < scenario.hours; i++) {
    const h = scenario.stepHours;
    const beginningKwh = soc;
    const solarKwh = scenario.solarKw[i] * h;
    const gridAvailableKwh = scenario.grid[i] ? scenario.gridMaxKw * h : 0;
    let solarLeft = solarKwh;
    let gridLeft = gridAvailableKwh;
    let batteryLeft = Math.min(scenario.battery.dischargeLimitKw * h, soc * scenario.battery.dischargeEfficiency);
    const loads = {};
    for (const id of action.priority) {
      const definition = LOADS.find(load => load.id === id);
      const demandKwh = definition.kw * scenario.demandFactor[i] * h;
      const solar = Math.min(demandKwh, solarLeft);
      solarLeft -= solar;
      const grid = Math.min(demandKwh - solar, gridLeft);
      gridLeft -= grid;
      const battery = Math.min(demandKwh - solar - grid, batteryLeft);
      batteryLeft -= battery;
      const servedKwh = solar + grid + battery;
      const unmetKwh = clampTiny(demandKwh - servedKwh);
      loads[id] = { demandKwh, servedKwh, unmetKwh, solarKwh: solar, gridKwh: grid,
        batteryKwh: battery, status: near(servedKwh, demandKwh) ? 'supplied' : near(servedKwh, 0) ? 'unmet' : 'partial' };
    }
    const records = LOAD_IDS.map(id => ({ id, ...loads[id] }));
    const batteryToLoadKwh = records.reduce((sum, x) => sum + x.batteryKwh, 0);
    const batteryWithdrawnKwh = batteryToLoadKwh / scenario.battery.dischargeEfficiency;
    soc -= batteryWithdrawnKwh;
    if (soc < -EPS) throw new Error('Model violated battery minimum');
    soc = Math.max(0, soc);
    const solarToBatteryKwh = Math.min(solarLeft, scenario.battery.chargeLimitKw * h,
      (scenario.battery.capacityKwh - soc) / scenario.battery.chargeEfficiency);
    const batteryStoredKwh = solarToBatteryKwh * scenario.battery.chargeEfficiency;
    soc += batteryStoredKwh;
    const curtailedKwh = clampTiny(solarLeft - solarToBatteryKwh);
    const servedKwh = records.reduce((sum, x) => sum + x.servedKwh, 0);
    const demandKwh = records.reduce((sum, x) => sum + x.demandKwh, 0);
    const unmetKwh = records.reduce((sum, x) => sum + x.unmetKwh, 0);
    const solarToLoadKwh = records.reduce((sum, x) => sum + x.solarKwh, 0);
    const gridToLoadKwh = records.reduce((sum, x) => sum + x.gridKwh, 0);
    const batteryLossKwh = clampTiny(batteryWithdrawnKwh - batteryToLoadKwh +
      solarToBatteryKwh - batteryStoredKwh);
    const step = { hour: i + 1, gridOnline: scenario.grid[i], beginningKwh,
      endingKwh: soc, demandKwh, servedKwh, unmetKwh, solarKwh, solarToLoadKwh,
      solarToBatteryKwh, curtailedKwh, gridToLoadKwh, batteryToLoadKwh,
      batteryWithdrawnKwh, batteryStoredKwh, batteryLossKwh, loads: records };
    if (!near(demandKwh, servedKwh + unmetKwh) ||
        !near(solarKwh + gridToLoadKwh + batteryToLoadKwh, servedKwh + solarToBatteryKwh + curtailedKwh) ||
        !near(beginningKwh + batteryStoredKwh - batteryWithdrawnKwh, soc) ||
        soc < -EPS || soc > scenario.battery.capacityKwh + EPS) throw new Error('Energy conservation failure');
    for (const key of Object.keys(totals)) totals[key] += step[key];
    steps.push(step);
  }
  const outageSteps = steps.filter(s => !s.gridOnline);
  const services = LOAD_IDS.map(id => {
    const demandKwh = outageSteps.reduce((s, x) => s + x.loads.find(v => v.id === id).demandKwh, 0);
    const servedKwh = outageSteps.reduce((s, x) => s + x.loads.find(v => v.id === id).servedKwh, 0);
    return { id, demandKwh, servedKwh, coveragePct: demandKwh === 0 ? 100 : 100 * servedKwh / demandKwh,
      continuouslySupplied: outageSteps.every(x => x.loads.find(v => v.id === id).status === 'supplied') };
  });
  const sustained = services.filter(x => x.continuouslySupplied).map(x => x.id);
  const predictionCorrect = action.prediction === 'none' ? sustained.length === 0 : sustained.includes(action.prediction);
  return { modelVersion: MODEL_VERSION, scenarioVersion: scenario.version, actionVersion: ACTION_VERSION,
    status: 'local-unverified', verified: false,
    scenarioId: scenario.id, action: { ...action, priority: [...action.priority] },
    steps, totals, services, sustained, predictionCorrect,
    endingKwh: soc };
}
export function runAttempt(action) {
  if (!action || !Object.hasOwn(SCENARIOS, action.scenarioId)) throw new TypeError('Unknown prepared scenario');
  return simulateScenario(SCENARIOS[action.scenarioId], action);
}
export function replayAttempt(attempt) {
  if (!attempt || attempt.status !== 'local-unverified' || attempt.verified !== false) throw new TypeError('Not a local attempt');
  const replay = runAttempt(attempt.action);
  if (JSON.stringify(replay) !== JSON.stringify(attempt)) throw new TypeError('Attempt replay mismatch or tampering');
  return replay;
}
export function compareAttempts(first, second) {
  const a = replayAttempt(first), b = replayAttempt(second);
  if (a.scenarioId !== 'baseline' || b.scenarioId !== 'cloud') throw new TypeError('Comparison requires two distinct prepared rounds');
  return { round1: a, round2: b, servedDeltaKwh: b.totals.servedKwh - a.totals.servedKwh,
    unmetDeltaKwh: b.totals.unmetKwh - a.totals.unmetKwh,
    services: LOAD_IDS.map(id => ({
      id,
      round1Pct: a.services.find(x => x.id === id).coveragePct,
      round2Pct: b.services.find(x => x.id === id).coveragePct
    })) };
}
/** Optional association metadata ONLY. Does NOT fetch, authenticate, or verify a lesson. */
export function validateOptionalLessonAssociation(value) {
  if (value === null || value === undefined) return null;
  exactKeys(value, ['contractVersion', 'lessonId', 'sourceId', 'revision', 'reviewed'], 'lesson association');
  if (value.contractVersion !== 1 || value.reviewed !== true ||
      ![value.lessonId, value.sourceId, value.revision].every(x => typeof x === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(x))) {
    throw new TypeError('Invalid local lesson reference metadata');
  }
  return { ...value, associationStatus: 'unverified-local-reference', evidenceStatus: 'local-unverified' };
}
