import { SCENARIOS, SOURCE, newRecord, appendAttempt, replayRecord, importRecord, exportRecord } from './model.mjs';

// Standalone Vite development preview. No global router, cloud API, cookies or shared CSS.
const $ = (id) => document.getElementById(id);
const form = $('predictionForm');
let record = newRecord();
const node = (tag, content) => { const el = document.createElement(tag); if (content !== undefined) el.textContent = String(content); return el; };
const para = (parent, content) => parent.append(node('p', content));
const fmt = (n) => n === null ? 'not defined' : n.toFixed(2);

function updateFlowInput() {
  const positive = $('outcome').value === 'flow';
  $('flowWrap').hidden = !positive;
  $('flowGuess').disabled = !positive;
  $('flowGuess').required = positive;
}
$('outcome').addEventListener('change', updateFlowInput);

function renderTable(parent, row) {
  const wrap = node('div'); wrap.className = 'table-scroll';
  const table = node('table');
  const caption = node('caption', 'Computed educational values; L/s is litres per second'); table.append(caption);
  const thead = node('thead'); const head = node('tr');
  for (const label of ['Quantity', 'Value']) head.append(node('th', label));
  thead.append(head); table.append(thead);
  const tbody = node('tbody');
  for (const [label, value] of [
    ['Baseline flow at 100% speed (L/s)', fmt(row.baseFlowLps)],
    ['Naive speed-scaled flow (L/s)', fmt(row.naiveAffinityFlowLps)],
    ['Pump shutoff head at selected speed (m)', fmt(row.scaledShutoffHeadM)],
    ['System fixed lift (m)', fmt(row.staticHeadM)],
    ['Curve intersection flow (L/s)', row.flowLps === null ? 'No positive-flow intersection' : fmt(row.flowLps)],
    ['Head at intersection (m)', fmt(row.intersectionHeadM)],
  ]) { const tr = node('tr'); tr.append(node('th', label), node('td', value)); tbody.append(tr); }
  table.append(tbody); wrap.append(table); parent.append(wrap);
}

function renderBars(parent, result) {
  // Purely explanatory 2D visual; complete numeric table above is the reading fallback.
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 520 132'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Bar comparison of baseline, naive affinity estimate, and model intersection. Exact values are in the table above.');
  const values = [result.baseFlowLps, result.naiveAffinityFlowLps, result.flowLps];
  const names = ['Baseline', 'Naive', 'Intersection'];
  values.forEach((value, i) => {
    const label = document.createElementNS(ns, 'text'); label.setAttribute('x', '4'); label.setAttribute('y', String(26 + i * 42)); label.textContent = names[i]; svg.append(label);
    if (value !== null) {
      const bar = document.createElementNS(ns, 'rect'); bar.setAttribute('x', '116'); bar.setAttribute('y', String(10 + i * 42));
      bar.setAttribute('width', String(Math.min(340, value / 45 * 340))); bar.setAttribute('height', '24'); bar.setAttribute('fill', i === 2 ? '#247969' : '#668eab'); svg.append(bar);
    }
    const valueText = document.createElementNS(ns, 'text'); valueText.setAttribute('x', '465'); valueText.setAttribute('y', String(26 + i * 42));
    valueText.setAttribute('text-anchor', 'middle'); valueText.textContent = value === null ? 'none' : value.toFixed(1); svg.append(valueText);
  });
  parent.append(svg);
}

function renderResult() {
  const history = replayRecord(record);
  const body = $('resultBody'); body.replaceChildren();
  for (const { attempt, result, correctOutcome, withinTwoLps } of history) {
    const scenario = SCENARIOS.find((s) => s.id === attempt.scenarioId);
    const section = node('section'); section.append(node('h4', scenario.title));
    para(section, `You predicted: ${attempt.prediction.outcome === 'flow' ? `${fmt(attempt.prediction.flowLps)} L/s` : 'no positive-flow intersection'}. Outcome category ${correctOutcome ? 'matches' : 'does not match'} the fictional model.${result.outcome === 'flow' && attempt.prediction.outcome === 'flow' ? ` Your estimate is ${withinTwoLps ? 'within' : 'outside'} 2 L/s of this model.` : ''}`);
    renderTable(section, result);
    renderBars(section, result);
    para(section, `Trace: pump head = 36 × (${result.ratio})² − 0.012 × Q². System head = ${result.staticHeadM} + 0.010 × Q². Set them equal: Q² = (36 × (${result.ratio})² − ${result.staticHeadM}) / (0.012 + 0.010). ${result.outcome === 'no-intersection' ? 'The numerator is not positive, so this model has no positive-flow intersection.' : `The positive root is ${fmt(result.flowLps)} L/s.`}`);
    para(section, result.caveat);
    section.append(node('h5', 'Your explanation')); para(section, attempt.explanation);
    body.append(section);
  }
  $('result').hidden = history.length === 0;
  form.hidden = history.length > 0;
  $('nextRound').hidden = history.length !== 1;
  if (history.length === 2) para(body, 'Both local rounds completed. Export the action-only record or start over. This is not verified competence.');
  if (history.length) $('resultTitle').focus();
}

function showRound() {
  $('error').hidden = true;
  $('result').hidden = true;
  $('resultBody').replaceChildren();
  if (record.attempts.length >= SCENARIOS.length) { renderResult(); return; }
  const scenario = SCENARIOS[record.attempts.length];
  $('challengeTitle').textContent = scenario.title;
  $('roundText').textContent = scenario.question;
  $('roundData').textContent = `Fictional curves: pump head H = 36 × speed ratio² − 0.012 × Q²; system head H = ${scenario.staticHeadM} + 0.010 × Q², with Q in L/s and H in metres. Baseline is 100% speed.`;
  form.hidden = false;
  form.reset(); updateFlowInput();
  $('challengeTitle').focus();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const prediction = $('outcome').value;
    const next = appendAttempt(record, {
      scenarioId: SCENARIOS[record.attempts.length].id,
      ratio: Number($('speedRatio').value),
      prediction: { outcome: prediction, flowLps: prediction === 'flow' ? Number($('flowGuess').value) : null },
      explanation: $('explanation').value,
    });
    record = next; $('error').hidden = true;
    $('recordStatus').textContent = `${record.attempts.length} of 2 local attempts recorded. Not authenticated or graded.`;
    renderResult();
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
});
$('nextRound').addEventListener('click', showRound);
$('resetRecord').addEventListener('click', () => { record = newRecord(); $('recordStatus').textContent = 'Local record reset.'; showRound(); });
$('exportRecord').addEventListener('click', () => {
  const blob = new Blob([exportRecord(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = node('a'); anchor.href = url; anchor.download = 'kairo-static-head-local-unverified.json';
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('recordStatus').textContent = 'Local JSON exported; no server upload.';
});
$('importFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 12_000) throw new RangeError('File exceeds 12 KB');
    const parsed = importRecord(await file.text());
    record = parsed;
    $('recordStatus').textContent = `Imported and recomputed ${record.attempts.length} local attempt(s); not verified.`;
    if (record.attempts.length) renderResult(); else showRound();
  } catch (error) { $('recordStatus').textContent = `Import rejected: ${error.message}`; }
  finally { event.target.value = ''; }
});

showRound();
