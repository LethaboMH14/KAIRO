import { SCENARIOS, OFFSETS_KPA, SOURCE, newSession, replaySession, submitAttempt, exportSession } from './model.mjs';

const $ = (id) => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
let session = newSession();
let visibleIndex = 0; // Keep a submitted result visible until the learner chooses Next.

function option(value, label) {
  const node = document.createElement('option');
  node.value = String(value);
  node.textContent = label;
  return node;
}
function row(table, label, value) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.scope = 'row'; th.textContent = label;
  const td = document.createElement('td');
  td.textContent = value;
  tr.append(th, td); table.append(tr);
}
function chart(result, scenario) {
  const svg = $('chart');
  svg.replaceChildren();
  const max = Math.max(scenario.baselineKpa, scenario.referenceKpa, scenario.indicatedKpa, result.learnerCorrectedKpa, 1);
  const entries = [
    ['Baseline', scenario.baselineKpa, '#7f91a4'],
    ['Reference', scenario.referenceKpa, '#4fcebc'],
    ['Your correction', result.learnerCorrectedKpa, '#f5b870'],
  ];
  svg.setAttribute('viewBox', '0 0 500 160');
  svg.setAttribute('aria-label', `Pressure comparison in fictional kPa. Baseline ${scenario.baselineKpa}; reference ${scenario.referenceKpa}; your corrected reading ${result.learnerCorrectedKpa}.`);
  entries.forEach(([name, value, color], i) => {
    const y = 12 + i * 50;
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', '0'); label.setAttribute('y', String(y + 13));
    label.setAttribute('fill', '#e7f4ff'); label.setAttribute('font-size', '13');
    label.textContent = name;
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '125'); rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(Math.max(0, (value / max) * 280)));
    rect.setAttribute('height', '19'); rect.setAttribute('rx', '5');
    rect.setAttribute('fill', color);
    const number = document.createElementNS(ns, 'text');
    number.setAttribute('x', '415'); number.setAttribute('y', String(y + 14));
    number.setAttribute('fill', '#e7f4ff'); number.setAttribute('font-size', '13');
    number.textContent = `${value} kPa`;
    svg.append(label, rect, number);
  });
}
function render() {
  const { attempts } = replaySession(session);
  const index = visibleIndex;
  const scenario = SCENARIOS[index];
  const revealed = attempts.length > index;
  $('round-title').textContent = scenario.title;
  $('round-prompt').textContent = scenario.prompt;
  $('round-progress').textContent = `${attempts.length} of ${SCENARIOS.length} independent attempts submitted · local-unverified`;
  $('source-label').textContent = `Concept reference: NIST calibration concepts. KAIRO fictional revision ${SOURCE.revision}; not reviewed measurements.`;
  const tbody = $('measurement-rows'); tbody.replaceChildren();
  row(tbody, 'Previous reference (baseline)', `${scenario.baselineKpa} kPa`);
  row(tbody, 'Current independent reference', `${scenario.referenceKpa} kPa`);
  row(tbody, 'Current suspect display', `${scenario.indicatedKpa} kPa`);
  row(tbody, 'Zero-check reading (expected 0)', `${scenario.zeroCheckKpa} kPa`);
  $('entry').hidden = revealed;
  $('result').hidden = !revealed;
  $('next').hidden = !(revealed && index === 0 && attempts.length === 1);
  $('finished').hidden = attempts.length !== SCENARIOS.length;
  if (revealed) {
    const result = attempts[index];
    $('score').textContent = `${result.correctCount} of 3 predictions matched the fictional model.`;
    $('check-offset').textContent = result.checks.offset ? 'Offset: matched' : 'Offset: revisit the zero-check';
    $('check-diagnosis').textContent = result.checks.diagnosis ? 'Explanation category: matched' : 'Explanation category: revisit the reference';
    $('check-prediction').textContent = result.checks.prediction ? 'Corrected pressure: matched' : 'Corrected pressure: revisit the subtraction';
    $('trace').replaceChildren(...result.trace.map((line) => { const li = document.createElement('li'); li.textContent = line; return li; }));
    const rows = $('result-rows'); rows.replaceChildren();
    row(rows, 'Reference', `${scenario.referenceKpa} kPa`);
    row(rows, 'Your selected correction', `${session.actions[index].selectedOffsetKpa} kPa`);
    row(rows, 'Your resulting corrected display', `${result.learnerCorrectedKpa} kPa`);
    row(rows, 'Model-corrected display', `${result.expectedCorrectedKpa} kPa`);
    row(rows, 'Change confirmed by reference', `${result.processDeltaKpa} kPa`);
    chart(result, scenario);
  } else {
    $('entry-form').reset();
    $('offset').replaceChildren(option('', 'Choose an offset'), ...OFFSETS_KPA.map((v) => option(v, `${v > 0 ? '+' : ''}${v} kPa`)));
  }
  if (attempts.length === SCENARIOS.length) {
    $('total-score').textContent = `Both rounds complete: ${attempts.reduce((sum, a) => sum + a.correctCount, 0)} of 6 checks matched. This is practice, not a grade.`;
  }
}
$('entry-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const index = session.actions.length;
    session = submitAttempt(session, {
      roundId: SCENARIOS[index].id,
      selectedOffsetKpa: Number($('offset').value),
      diagnosis: $('diagnosis').value,
      predictedKpa: Number($('prediction').value),
      explanation: $('explanation').value,
    }).session;
    $('status').textContent = 'Prediction committed. The model trace is now visible.';
    render(); $('result-heading').focus();
  } catch (error) { $('status').textContent = `Not submitted: ${error.message}`; }
});
$('next').addEventListener('click', () => {
  visibleIndex = 1;
  $('status').textContent = 'Second independent round ready.';
  render(); $('round-title').focus();
});
$('export').addEventListener('click', () => {
  const blob = new Blob([exportSession(session)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'kairo-fictional-sensor-practice.json';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('status').textContent = 'Local-unverified practice exported. No account evidence was created.';
});
$('import').addEventListener('click', () => {
  try {
    const restored = replaySession($('import-json').value);
    session = restored.session;
    visibleIndex = restored.attempts.length === SCENARIOS.length ? 1 : 0;
    $('status').textContent = `Imported ${restored.attempts.length} locally replayed attempt(s). No verification or grade is implied.`;
    render(); $('round-title').focus();
  } catch (error) { $('status').textContent = `Import rejected: ${error.message}`; }
});
render();
