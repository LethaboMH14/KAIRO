import { SCENARIOS, SOURCE, newRecord, appendAttempt, replayRecord, importRecord, exportRecord } from './model.mjs';

// Standalone development preview only: no authenticated learner route or cloud write.
const el = (id) => document.getElementById(id);
const node = (tag, value) => {
  const result = document.createElement(tag);
  if (value !== undefined) result.textContent = String(value);
  return result;
};
const para = (parent, value) => parent.append(node('p', value));
const fmt = (number) => Number(number).toFixed(2);
let record = newRecord();
const form = el('predictionForm');

function options(select, values, suffix = '') {
  select.replaceChildren();
  for (const value of values) {
    const option = node('option', `${value}${suffix}`);
    option.value = String(value);
    select.append(option);
  }
}
function showRound() {
  el('error').hidden = true;
  el('result').hidden = true;
  el('resultBody').replaceChildren();
  if (record.attempts.length >= SCENARIOS.length) return showResult();
  const scenario = SCENARIOS[record.attempts.length];
  el('roundTitle').textContent = scenario.title;
  el('scheduleA').textContent = `A: ${scenario.a.powerKw} kW of fictional constant shaft power for ${scenario.a.hours} hours.`;
  options(el('bPowerKw'), scenario.bPowerKw, ' kW');
  options(el('bHours'), scenario.bHours, ' hours');
  form.reset();
  el('lowerEnergy').value = 'A';
  el('differenceKwh').value = '';
  form.hidden = false;
  el('roundTitle').focus();
}
function comparisonTable(parent, result) {
  const table = node('table');
  table.append(node('caption', 'Recomputed shaft energy; every number is also readable as text'));
  const head = node('tr');
  for (const label of ['Fictional schedule', 'Power (kW)', 'Time (hours)', 'Shaft energy (kWh)']) head.append(node('th', label));
  const thead = node('thead'); thead.append(head); table.append(thead);
  const body = node('tbody');
  for (const row of [['A', result.aPowerKw, result.aHours, result.aKwh], ['B', result.bPowerKw, result.bHours, result.bKwh]]) {
    const tr = node('tr');
    tr.append(node('th', row[0]));
    for (const number of row.slice(1)) tr.append(node('td', fmt(number)));
    body.append(tr);
  }
  table.append(body); parent.append(table);
  const bars = node('div'); bars.className = 'bars';
  for (const [label, energy] of [['A', result.aKwh], ['B', result.bKwh]]) {
    const wrapper = node('div');
    const meterLabel = node('label', `${label}: ${fmt(energy)} kWh`);
    const meter = node('meter'); meter.min = 0; meter.max = 6; meter.value = energy;
    meter.id = `energy-${result.scenarioId}-${label}`; meterLabel.htmlFor = meter.id;
    wrapper.append(meterLabel, meter); bars.append(wrapper);
  }
  parent.append(bars);
}
function showResult() {
  const history = replayRecord(record);
  const body = el('resultBody'); body.replaceChildren();
  for (const { attempt, result, correctDirection, withinHalfKwh } of history) {
    const section = node('section');
    section.append(node('h4', SCENARIOS.find((s) => s.id === attempt.scenarioId).title));
    para(section, `Your prediction: ${attempt.prediction.lowerEnergy} uses less shaft energy (or equal), by ${fmt(attempt.prediction.differenceKwh)} kWh. The direction ${correctDirection ? 'matches' : 'does not match'} this fictional model; the difference is ${withinHalfKwh ? 'within' : 'more than'} 0.5 kWh of the recomputed result.`);
    comparisonTable(section, result);
    para(section, `Trace: A = ${fmt(result.aPowerKw)} kW × ${fmt(result.aHours)} h = ${fmt(result.aKwh)} kWh; B = ${fmt(result.bPowerKw)} kW × ${fmt(result.bHours)} h = ${fmt(result.bKwh)} kWh. ${result.lowerEnergy === 'equal' ? 'They are equal.' : `${result.lowerEnergy} uses less fictional shaft energy.`} Absolute difference = ${fmt(result.differenceKwh)} kWh.`);
    para(section, result.caveat);
    section.append(node('h5', 'Your explanation'));
    para(section, attempt.explanation);
    body.append(section);
  }
  form.hidden = true;
  el('result').hidden = history.length === 0;
  el('nextRound').hidden = history.length !== 1;
  if (history.length === 2) para(body, 'Both independent rounds are complete. This local practice is not a verified grade or learning outcome.');
  if (history.length) el('resultTitle').focus();
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const index = record.attempts.length;
    record = appendAttempt(record, {
      scenarioId: SCENARIOS[index].id,
      bPowerKw: Number(el('bPowerKw').value), bHours: Number(el('bHours').value),
      prediction: { lowerEnergy: el('lowerEnergy').value, differenceKwh: Number(el('differenceKwh').value) },
      explanation: el('explanation').value,
    });
    el('error').hidden = true;
    el('recordStatus').textContent = `${record.attempts.length} of 2 local, unverified attempts recorded.`;
    showResult();
  } catch (error) {
    el('error').textContent = error.message;
    el('error').hidden = false;
  }
});
el('nextRound').addEventListener('click', showRound);
el('resetRecord').addEventListener('click', () => {
  record = newRecord();
  el('recordStatus').textContent = 'Local record reset. No account data was changed.';
  showRound();
});
el('exportRecord').addEventListener('click', () => {
  const blob = new Blob([exportRecord(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = node('a'); link.href = url; link.download = 'kairo-pump-duty-local-unverified.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  el('recordStatus').textContent = 'Action-only JSON exported locally; nothing uploaded.';
});
el('importFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 12_000) throw new RangeError('File exceeds 12 KB');
    record = importRecord(await file.text());
    el('recordStatus').textContent = `Replayed ${record.attempts.length} local, unverified attempts. No account identity or grade imported.`;
    if (record.attempts.length) showResult(); else showRound();
  } catch (error) {
    el('recordStatus').textContent = `Import rejected: ${error.message}`;
  } finally {
    event.target.value = '';
  }
});
el('sourceRevision').textContent = `${SOURCE.title}; ${SOURCE.status}. Source revision: ${SOURCE.revision}.`;
showRound();
