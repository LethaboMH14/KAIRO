import { SCENARIOS, LABELS, EVIDENCE_STATUS, newRecord,
  appendAttempt, replayRecord, importRecord, exportRecord } from './model.mjs';

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function optionSelect(label, values, selected) {
  const wrap = el('label', label, 'field');
  const select = el('select');
  select.required = true;
  for (const value of values) {
    const option = el('option', String(value));
    option.value = String(value);
    select.append(option);
  }
  if (selected !== undefined) select.value = String(selected);
  wrap.append(select);
  return { wrap, select };
}
function intervalGraphic(outcome, unit) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 640 126');
  svg.setAttribute('class', 'interval-chart');
  svg.setAttribute('aria-hidden', 'true');
  const low = Math.min(outcome.expected.low, outcome.measured.low);
  const high = Math.max(outcome.expected.high, outcome.measured.high);
  const padding = Math.max((high - low) * 0.15, 0.25);
  const min = low - padding;
  const max = high + padding;
  const x = (value) => 90 + ((value - min) / (max - min)) * 510;
  const ns = 'http://www.w3.org/2000/svg';
  const add = (name, attributes, text) => {
    const item = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, String(value));
    if (text !== undefined) item.textContent = text;
    svg.append(item);
  };
  add('line', { x1: 90, y1: 104, x2: 600, y2: 104, stroke: '#718399', 'stroke-width': 2 });
  for (const [name, band, y, color] of [
    ['Model', outcome.expected, 34, '#54dbc2'], ['Gauge', outcome.measured, 76, '#ffbe6b'],
  ]) {
    add('text', { x: 8, y: y + 5, fill: '#f4f7ff', 'font-size': 16 }, name);
    add('line', { x1: x(band.low), y1: y, x2: x(band.high), y2: y,
      stroke: color, 'stroke-width': 13, 'stroke-linecap': 'round' });
    for (const value of [band.low, band.high]) add('line', {
      x1: x(value), y1: y - 13, x2: x(value), y2: y + 13, stroke: color, 'stroke-width': 3,
    });
  }
  add('text', { x: 90, y: 122, fill: '#b9c6da', 'font-size': 13 }, `${min.toFixed(1)} ${unit}`);
  add('text', { x: 545, y: 122, fill: '#b9c6da', 'font-size': 13 }, `${max.toFixed(1)} ${unit}`);
  return svg;
}
function resultCard(outcome, index) {
  const scenario = SCENARIOS[index];
  const card = el('section', undefined, 'result-card');
  const title = el('h3', `Round ${index + 1}: ${scenario.title}`);
  title.tabIndex = -1;
  title.dataset.resultFocus = String(index);
  card.append(title);
  card.append(el('p', `Your prediction: ${LABELS[outcome.prediction]}. Model result: ${LABELS[outcome.classification]}. ${outcome.correct ? 'Matched.' : 'Different—review the intervals.'}`, 'feedback'));
  card.append(intervalGraphic(outcome, scenario.unit));
  const table = el('table');
  const caption = el('caption', 'Equivalent numerical reading of the visual intervals');
  table.append(caption);
  const tbody = el('tbody');
  for (const [label, value] of [
    ['Prepared model', `${scenario.expected} ± ${scenario.modelError} ${scenario.unit}`],
    ['Model interval', `${outcome.expected.low} to ${outcome.expected.high} ${scenario.unit}`],
    ['Fictional gauge', `${outcome.reading} ± ${outcome.error} ${scenario.unit}`],
    ['Gauge interval', `${outcome.measured.low} to ${outcome.measured.high} ${scenario.unit}`],
    ['Comparison', LABELS[outcome.classification]],
  ]) {
    const row = el('tr');
    const th = el('th', label); th.scope = 'row';
    row.append(th, el('td', value)); tbody.append(row);
  }
  table.append(tbody);
  card.append(table);
  const reasoning = el('p', 'Your explanation: ');
  reasoning.append(el('strong', outcome.explanation));
  card.append(reasoning);
  card.append(el('p', 'A separated band is evidence of disagreement with this prepared model, not a diagnosis of a pump fault. Overlap is inconclusive; containment is not proof that equipment is healthy.', 'limit'));
  return card;
}

export function mount(root) {
  if (!(root instanceof HTMLElement)) throw new TypeError('A real HTML root is required');
  let record = newRecord();
  let message = '';
  let focusTarget = null;
  function render() {
    const outcomes = replayRecord(record);
    root.replaceChildren();
    const header = el('header', undefined, 'hero');
    header.append(el('p', 'KAIRO • ENGINEERING STUDIO / PREPARED SIMULATION', 'eyebrow'));
    header.append(el('h1', 'When a gauge disagrees'));
    header.append(el('p', 'Is the difference real—or could it be measurement uncertainty? Predict before revealing the interval comparison.'));
    root.append(header);
    const warning = el('aside', `Status: ${EVIDENCE_STATUS}. Fictional readings and uncertainty choices; the source is an internally authored, unreviewed teaching model. This is not equipment advice, fault detection or authenticated learning evidence.`, 'notice');
    root.append(warning);
    for (let index = 0; index < outcomes.length; index++) root.append(resultCard(outcomes[index], index));
    if (outcomes.length < SCENARIOS.length) {
      const scenario = SCENARIOS[outcomes.length];
      const form = el('form', undefined, 'challenge');
      form.append(el('h2', `Round ${outcomes.length + 1} of ${SCENARIOS.length}: ${scenario.title}`));
      form.append(el('p', scenario.context));
      form.append(el('p', `Prepared model: ${scenario.expected} ± ${scenario.modelError} ${scenario.unit}. Choose a fictional reading and its uncertainty.`, 'model-note'));
      const reading = optionSelect(`Fictional gauge reading (${scenario.unit})`, scenario.readings, scenario.readings[0]);
      const error = optionSelect(`Assumed gauge uncertainty (± ${scenario.unit})`, scenario.errors, scenario.errors[0]);
      form.append(reading.wrap, error.wrap);
      const choices = el('fieldset');
      choices.append(el('legend', 'Before revealing the answer, predict the relationship between the intervals'));
      for (const [key, label] of Object.entries(LABELS)) {
        const labelEl = el('label', undefined, 'radio');
        const input = el('input'); input.type = 'radio'; input.name = 'prediction'; input.value = key;
        input.required = true;
        labelEl.append(input, document.createTextNode(label)); choices.append(labelEl);
      }
      form.append(choices);
      const explainLabel = el('label', 'Explain your prediction using the upper and lower bounds (12–500 characters)', 'field');
      const explain = el('textarea'); explain.required = true; explain.minLength = 12; explain.maxLength = 500;
      explain.rows = 3; explainLabel.append(explain); form.append(explainLabel);
      const submit = el('button', 'Reveal the comparison and save this local attempt');
      submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const prediction = form.querySelector('input[name="prediction"]:checked')?.value;
        try {
          record = appendAttempt(record, { scenarioId: scenario.id, reading: Number(reading.select.value),
            error: Number(error.select.value), prediction, explanation: explain.value.trim() });
          message = `Round ${record.actions.length} saved locally in this page only.`;
          focusTarget = `result-${record.actions.length - 1}`;
          render();
        } catch (err) { const status = root.querySelector('[role="status"]'); status.textContent = `Could not record attempt: ${err.message}`; status.focus(); }
      });
      root.append(form);
    } else root.append(el('p', 'Both rounds complete. Compare your reasoning, then copy the local-unverified record if you wish.', 'complete'));
    const tools = el('section', undefined, 'record-tools');
    tools.append(el('h2', 'Local practice record'));
    tools.append(el('p', 'Only your chosen actions and written explanations are included. No score, owner identity or verified evidence is stored or transmitted.'));
    const textArea = el('textarea'); textArea.rows = 7; textArea.setAttribute('aria-label', 'Local record JSON for copying or importing');
    textArea.placeholder = 'Export to copy your JSON here, or paste an earlier local record to import.';
    tools.append(textArea);
    const exportButton = el('button', 'Show record JSON'); exportButton.type = 'button';
    exportButton.addEventListener('click', () => { textArea.value = exportRecord(record); textArea.focus(); });
    const importButton = el('button', 'Import and validate record'); importButton.type = 'button';
    importButton.addEventListener('click', () => {
      try { record = importRecord(textArea.value); message = 'Record validated and recomputed from actions.'; focusTarget = 'message'; render(); }
      catch (err) { const status = root.querySelector('[role="status"]'); status.textContent = `Import rejected: ${err.message}`; status.focus(); }
    });
    const resetButton = el('button', 'Start again'); resetButton.type = 'button';
    resetButton.addEventListener('click', () => { record = newRecord(); message = 'Local rounds reset.'; focusTarget = 'message'; render(); });
    tools.append(exportButton, importButton, resetButton); root.append(tools);
    const live = el('p', message, 'live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
    live.tabIndex = -1; live.dataset.messageFocus = 'true'; root.append(live);
    const target = focusTarget === 'message' ? live : focusTarget?.startsWith('result-')
      ? root.querySelector(`[data-result-focus="${focusTarget.slice(7)}"]`) : null;
    focusTarget = null;
    target?.focus();
  }
  render();
  return { getRecord: () => importRecord(exportRecord(record)) };
}
if (typeof document !== 'undefined') {
  const root = document.getElementById('pump-uncertainty-app');
  if (root) mount(root);
}
