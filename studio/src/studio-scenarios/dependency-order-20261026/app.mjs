import { SCENARIOS, REFERENCE, scenarioForRound, solve, recordAttempt, exportSession, importSession } from './model.mjs';

// Standalone learner preview. No API, telemetry, credentials, or authenticated save.
const byId = (id) => document.getElementById(id);
const elements = {
  heading: byId('round-heading'), form: byId('prediction-form'), exercise: byId('exercise'),
  change: byId('change'), completion: byId('completion'), nextTask: byId('next-task'),
  explanation: byId('explanation'), edges: byId('edges'), result: byId('result'),
  trace: byId('trace'), resultRegion: byId('result-region'), nextRound: byId('next-round'),
  finished: byId('finished'), status: byId('status'), exportButton: byId('export'),
  importFile: byId('import-file'), progress: byId('progress'),
};
let attempts = [];
let currentRound = 1;

function option(value, label) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
}
function listItem(value) {
  const element = document.createElement('li');
  element.textContent = value;
  return element;
}
function announce(value) { elements.status.textContent = value; }

function render() {
  elements.progress.textContent = attempts.length + ' of ' + SCENARIOS.length + ' independent local attempts recorded';
  elements.exportButton.disabled = attempts.length === 0;
  elements.resultRegion.hidden = true;
  if (currentRound > SCENARIOS.length) {
    elements.exercise.hidden = true;
    elements.finished.hidden = false;
    elements.finished.textContent = 'Two local practice attempts recorded. Export your work if you want to keep a copy. These are not authenticated or certified results.';
    elements.finished.focus();
    return;
  }
  const scenario = scenarioForRound(currentRound);
  elements.exercise.hidden = false;
  elements.finished.hidden = true;
  elements.heading.textContent = 'Round ' + currentRound + ' of 2: ' + scenario.title;
  elements.edges.replaceChildren(...scenario.baseEdges.map(([before, after]) => listItem(before + ' must finish before ' + after)));
  elements.change.replaceChildren(option('', 'Choose one dependency change'), ...scenario.choices.map((choice) => option(choice.id, choice.label)));
  elements.completion.value = '';
  elements.nextTask.replaceChildren(option('', 'Choose the second task, or none'), ...scenario.nodes.map((node) => option(node, node)), option('none', 'None: no second task can start'));
  elements.explanation.value = '';
  elements.form.hidden = false;
  elements.heading.focus();
}

function reveal(attempt) {
  const model = solve(attempt.scenarioId, attempt.choiceId);
  const correct = attempt.prediction.completion === model.completion && attempt.prediction.nextTask === model.nextTask;
  elements.result.textContent = (correct ? 'Both predictions matched.' : 'Compare your prediction with the trace.') + ' '
    + 'Completion: ' + (model.completion === 'complete' ? 'possible' : 'blocked by a cycle') + '. '
    + 'Second ready task: ' + (model.nextTask === 'none' ? 'none' : model.nextTask) + '. '
    + (model.remaining.length ? 'Unfinished: ' + model.remaining.join(', ') + '.' : 'Valid teaching order: ' + model.order.join(' → ') + '.');
  elements.trace.replaceChildren(...(model.trace.length
    ? model.trace.map((step, index) => listItem('Step ' + (index + 1) + ': ready ' + step.readyBefore.join(', ') + '; choose ' + step.chosen + '; now ready ' + (step.readyAfter.join(', ') || 'none') + '.'))
    : [listItem('No task is initially ready: the added prerequisite closes a cycle.')]));
  elements.form.hidden = true;
  elements.resultRegion.hidden = false;
  elements.nextRound.textContent = currentRound === SCENARIOS.length ? 'Finish local practice' : 'Start independent round 2';
  elements.resultRegion.focus();
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const entry = recordAttempt({
      round: currentRound, choiceId: elements.change.value,
      prediction: { completion: elements.completion.value, nextTask: elements.nextTask.value },
      explanation: elements.explanation.value,
    });
    attempts = [...attempts, entry];
    reveal(entry);
    elements.progress.textContent = attempts.length + ' of ' + SCENARIOS.length + ' independent local attempts recorded';
    elements.exportButton.disabled = false;
    announce('Prediction recorded locally. Model trace revealed; inspect the steps before continuing.');
  } catch (error) { announce('Please check your prediction: ' + error.message); }
});

elements.nextRound.addEventListener('click', () => {
  currentRound = attempts.length + 1;
  render();
  announce(currentRound > SCENARIOS.length ? 'Local practice finished.' : 'Independent next round ready.');
});

elements.exportButton.addEventListener('click', () => {
  try {
    const blob = new Blob([exportSession(attempts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kairo-dependency-practice-local.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Local practice JSON prepared for download. No server upload occurred.');
  } catch (error) { announce('Export failed: ' + error.message); }
});

elements.importFile.addEventListener('change', async () => {
  const file = elements.importFile.files?.[0];
  if (!file) return;
  try {
    if (file.size > 16_384) throw new Error('Local practice file is too large');
    const restored = importSession(await file.text());
    attempts = restored.attempts;
    currentRound = attempts.length + 1;
    render();
    announce('Restored ' + attempts.length + ' local attempt(s); model outcomes recomputed, not trusted from the file.');
  } catch (error) { announce('Import rejected: ' + error.message); }
  finally { elements.importFile.value = ''; }
});

byId('reference').href = REFERENCE.url;
byId('reference').textContent = REFERENCE.title;
render();
