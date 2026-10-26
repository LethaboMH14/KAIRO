import { CASES, OUTCOMES, SOURCE_URL, appendAttempt, newReplay, parseReplay, replay, solve, trace } from './model.mjs';

const outcomeLabels = {
  contained: 'No spill or unmet demand',
  spill: 'Spill beyond the reservoir capacity',
  'unmet-demand': 'Unmet requested outlet demand'
};

const format = (number) => new Intl.NumberFormat('en-ZA').format(number);

function tankDiagram(initialL, finalL, capacityL, reveal) {
  const firstHeight = Math.round(initialL / capacityL * 168);
  const lastHeight = Math.round(finalL / capacityL * 168);
  return `<svg viewBox="0 0 350 238" role="img" aria-label="Fictional reservoir, initially ${initialL} of ${capacityL} litres${reveal ? `, ending at ${finalL} litres` : '; ending volume hidden until prediction'}">
    <title>Fictional water level comparison</title>
    <rect x="28" y="18" width="110" height="174" rx="13" fill="#f3f8fa" stroke="#5b7886" stroke-width="3"/>
    <rect x="33" y="${187-firstHeight}" width="100" height="${firstHeight}" rx="7" fill="#22b8c8"/>
    <rect x="210" y="18" width="110" height="174" rx="13" fill="#f3f8fa" stroke="#5b7886" stroke-width="3"/>
    ${reveal ? `<rect x="215" y="${187-lastHeight}" width="100" height="${lastHeight}" rx="7" fill="#7e64e8"/>` : '<text x="265" y="112" text-anchor="middle" font-size="27" fill="#30445b">?</text>'}
    <text x="83" y="211" text-anchor="middle" fill="currentColor" font-size="15">Start: ${initialL} L</text>
    <text x="265" y="211" text-anchor="middle" fill="currentColor" font-size="15">${reveal ? `End: ${finalL} L` : 'Predict the end'}</text>
  </svg>`;
}

function renderResult(host, attempt, moveFocus = true) {
  const { result } = attempt;
  const titleId = `tank-result-${result.caseId}`;
  const traceId = `tank-trace-${result.caseId}`;
  const readoutId = `tank-readout-${result.caseId}`;
  host.innerHTML = `<section class="result" aria-labelledby="${titleId}">
    <h3 id="${titleId}" tabindex="-1">Revealed calculation — ${result.caseId === 'inflow-change' ? 'round 1' : 'round 2'}</h3>
    <div class="tank-visual">${tankDiagram(result.initialL, result.finalL, result.capacityL, true)}</div>
    <p><strong>Actual final storage:</strong> ${format(result.finalL)} L; <strong>outcome:</strong> ${outcomeLabels[result.outcome]}.</p>
    <p>Your prediction: ${format(attempt.prediction)} L (${format(attempt.differenceL)} L difference). Outcome ${attempt.outcomeMatches ? 'matched' : 'did not match'} the model. This is local practice, not a grade.</p>
    <details open><summary>Read the complete conservation trace</summary><ol id="${traceId}"></ol></details>
    <table><caption>Numeric reading alternative</caption><tbody id="${readoutId}"></tbody></table>
    <p class="assumption">Fictional, constant-rate, one-step balance. No real equipment, telemetry or verified learner record.</p>
  </section>`;
  const list = host.querySelector(`#${traceId}`);
  for (const line of trace(result)) {
    const item = document.createElement('li'); item.textContent = line; list.append(item);
  }
  const readout = [
    ['Initial storage', result.initialL], ['Capacity', result.capacityL],
    ['Inflow (L/min)', result.inflowLpm], ['Requested outflow (L/min)', result.outflowLpm],
    ['Duration (min)', result.durationMin], ['Total inlet', result.inletL],
    ['Requested outlet', result.requestedOutletL], ['Delivered outlet', result.deliveredOutletL],
    ['Spill', result.spillL], ['Unmet demand', result.unmetDemandL], ['Final storage', result.finalL]
  ];
  for (const [label, value] of readout) {
    const row = document.createElement('tr');
    const heading = document.createElement('th'); heading.scope = 'row'; heading.textContent = label;
    const cell = document.createElement('td'); cell.textContent = format(value);
    row.append(heading, cell); host.querySelector(`#${readoutId}`).append(row);
  }
  if (moveFocus) host.querySelector(`#${titleId}`).focus();
}

/** Isolated Vite preview only; intentionally does not mount in StudioRouter. */
export function mountTankBalance(root) {
  if (!root || typeof root.replaceChildren !== 'function') throw new TypeError('A DOM root is required');
  let log = newReplay();
  let revision = 0;
  const shell = document.createElement('section');
  shell.className = 'tank-lab';
  root.replaceChildren(shell);

  function draw(status = '') {
    const attempts = replay(log);
    const current = CASES[attempts.length];
    shell.innerHTML = `<header><p class="eyebrow">KAIRO · Engineering Studio · reading-first simulation</p>
      <h1>Pump Tank Balance Lab</h1><p>Change a fictional flow, predict the final water level, then reveal the conservation trace.</p>
      <p class="assumption">Educational approximation: fixed flow rates for one time interval; instant spill and unmet demand are accounting outcomes, not equipment advice.</p>
      <p><a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">OpenStax 14.5: flow and mass conservation (concept source)</a>. KAIRO invented the reservoir scenarios.</p></header>
      <p role="status" aria-live="polite" id="tank-status"></p>
      <div class="actions"><button type="button" id="tank-export" ${attempts.length ? '' : 'disabled'}>Export local practice JSON</button>
      <label class="import-label" for="tank-import">Import local practice JSON</label><input id="tank-import" type="file" accept=".json,application/json" />
      <button type="button" id="tank-reset">Start again</button></div>
      <p class="assumption">Local-unverified attempts only. JSON files can be edited; results are recomputed on import. Do not include personal information.</p>
      <p class="progress">${attempts.length} of ${CASES.length} independent rounds complete</p>
      <div id="tank-completed"></div>
      <div id="tank-current"></div>`;
    shell.querySelector('#tank-status').textContent = status;
    const completed = shell.querySelector('#tank-completed');
    attempts.forEach((attempt, index) => {
      const detail = document.createElement('details');
      detail.innerHTML = `<summary>Review round ${index + 1} — ${outcomeLabels[attempt.result.outcome]}</summary><div class="review"></div>`;
      renderResult(detail.querySelector('.review'), attempt, false);
      const note = document.createElement('p');
      note.textContent = `Your explanation: ${attempt.explanation}`;
      detail.querySelector('.review').append(note);
      completed.append(detail);
    });
    const host = shell.querySelector('#tank-current');
    if (!current) {
      host.innerHTML = '<h2 tabindex="-1">Both rounds completed</h2><p>Use the review sections above or export your local practice. No learning outcome has been independently verified.</p>';
      host.querySelector('h2').focus();
    } else {
      host.innerHTML = `<form id="tank-form"><fieldset><legend>${current.title}</legend>
        <p>${current.question}</p>
        <p><strong>Starting storage:</strong> ${current.initialL} L of ${current.capacityL} L capacity; <strong>duration:</strong> ${current.durationMin} minutes.</p>
        <p>Fixed ${current.adjustable === 'inflowLpm' ? 'requested outlet' : 'inlet'}: ${current.adjustable === 'inflowLpm' ? current.outflowLpm : current.inflowLpm} L/min.</p>
        <label for="tank-flow">${current.adjustable === 'inflowLpm' ? 'Inlet flow' : 'Requested outlet flow'} (L/min)</label>
        <select id="tank-flow" name="flow" required>${current.options.map((v) => `<option value="${v}">${v} L/min</option>`).join('')}</select>
        <div class="tank-visual" id="tank-before">${tankDiagram(current.initialL, 0, current.capacityL, false)}</div>
        <label for="tank-prediction">Predict final stored volume (litres)</label>
        <input id="tank-prediction" type="number" min="0" max="${current.capacityL * 2}" step="1" required />
        <label for="tank-outcome">Predict what happens</label><select id="tank-outcome" required>
          <option value="">Choose an outcome</option>${OUTCOMES.map((value) => `<option value="${value}">${outcomeLabels[value]}</option>`).join('')}
        </select><label for="tank-explanation">Explain your reasoning before reveal (10–500 characters)</label>
        <textarea id="tank-explanation" minlength="10" maxlength="500" required placeholder="How do inflow, requested outflow and capacity affect storage?"></textarea>
        <button type="submit">Commit prediction and reveal</button>
        </fieldset></form><div id="tank-result"></div>`;
      host.querySelector('#tank-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const action = {
          kind: 'commit', caseId: current.id,
          flowLpm: Number(form.querySelector('#tank-flow').value),
          predictedFinalL: Number(form.querySelector('#tank-prediction').value),
          predictedOutcome: form.querySelector('#tank-outcome').value,
          explanation: form.querySelector('#tank-explanation').value
        };
        try {
          const next = appendAttempt(log, action);
          const attempt = replay(next).at(-1);
          log = next;
          shell.querySelector('#tank-export').disabled = false;
          // Preserve the visible result until the learner chooses the next round.
          form.hidden = true;
          const resultHost = host.querySelector('#tank-result');
          renderResult(resultHost, attempt);
          const nextButton = document.createElement('button');
          nextButton.type = 'button';
          nextButton.textContent = log.actions.length === CASES.length ? 'Finish and review both rounds' : 'Continue to independent round 2';
          nextButton.addEventListener('click', () => { revision++; draw('Prediction saved locally; no account record was created.'); });
          resultHost.append(nextButton);
          shell.querySelector('#tank-status').textContent = 'Calculation revealed. Your prediction was committed before the result appeared.';
        } catch (error) {
          shell.querySelector('#tank-status').textContent = error.message;
        }
      });
    }
    shell.querySelector('#tank-reset').addEventListener('click', () => {
      revision++; log = newReplay(); draw('Local practice restarted.');
    });
    shell.querySelector('#tank-export').addEventListener('click', () => {
      if (!log.actions.length) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'kairo-fictional-tank-practice.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    shell.querySelector('#tank-import').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const expectedRevision = ++revision;
      if (file.size > 8192) { draw('Import rejected: file exceeds 8 KiB.'); return; }
      try {
        const imported = parseReplay(await file.text());
        if (expectedRevision !== revision) return; // A late read cannot replace a newer reset/import.
        log = imported;
        draw('Imported action log; every result was recalculated. Local-unverified only.');
      } catch (error) {
        if (expectedRevision === revision) draw(`Import rejected: ${error.message}`);
      }
    });
  }
  draw();
  return { reset: () => { revision++; log = newReplay(); draw('Local practice restarted.'); } };
}
