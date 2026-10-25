import { SOURCES } from '../engineering/motorContent';

export type CoachIntent = 'explain' | 'hint' | 'predict' | 'check';
export type CoachInput = {
  studio: 'motor' | 'pump';
  selectedLabel?: string | null;
  nextStep?: string;
  readings?: number;
  finished?: boolean;
  variables?: Record<string,number|string>;
  intent: CoachIntent;
};
export type CoachResponse = {
  title: string;
  text: string;
  prompt: string;
  sourceLinks: Array<{ title: string; url: string }>;
  scope: string;
};

const PUMP_SOURCES = [
  { title: 'US Department of Energy, Fundamentals Handbook, Vol. 3, HT-03, pp. 73–74', url: 'https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL3.pdf' },
  { title: 'Hydraulic Institute, Pump System Operating Point', url: 'https://datatool.pumps.org/pump-fundamentals/combined.html' },
  { title: 'Hydraulic Institute, Pump Curves and Affinity Rules', url: 'https://datatool.pumps.org/pump-fundamentals/pump-curves.html' },
];
const MOTOR_SOURCES = SOURCES.slice(0, 3).map(source => ({ title: source.label, url: source.url }));

const motor = (intent: CoachIntent, selected?: string | null, nextStep?: string, finished?: boolean): CoachResponse => {
  const label = boundedLabel(selected) || 'the motor';
  const step = boundedLabel(nextStep);
  const endings = finished ? ' You have completed this model step; your explanation remains yours to make.' : '';
  if (intent === 'hint') return { title: 'Look at one connection', text: `${label}: follow what stays still and what turns in the drawing or cutaway. The rotor follows the rotating field slightly more slowly.${endings}`, prompt: step ? `What observation at ${step} would support your explanation?` : 'Which part stays still while the rotor turns, and what in the drawing shows you?', sourceLinks: MOTOR_SOURCES, scope: 'Authored explanation for the induction-motor teaching model. No live equipment advice.' };
  if (intent === 'predict') return { title: 'Predict before checking', text: `Use the selected part or operating view for ${label}. In this model, synchronous field speed follows frequency and pole count; shaft speed is lower because of slip.${endings}`, prompt: 'Before changing a value, what do you predict will happen to field speed or rotor motion? State your reason first.', sourceLinks: MOTOR_SOURCES, scope: 'Field-speed relationship and illustrative motor motion only; no real shaft-speed measurement.' };
  if (intent === 'check') return { title: 'Explain what you saw', text: `Compare your explanation of ${label} with the drawing, cutaway or operating view. The field-speed calculation is not a measurement of shaft speed.${endings}`, prompt: 'Which visible observation supports your explanation, and how does it distinguish field speed from rotor speed? This is a reflection prompt; it does not mark your answer.', sourceLinks: MOTOR_SOURCES, scope: 'Learner reasoning prompt; this does not grade or certify understanding.' };
  return { title: label === 'the motor' ? 'How the motor turns' : `About ${label}`, text: `${label} is part of an induction motor: three-phase stator currents create a rotating magnetic field, which induces current in the squirrel-cage rotor. The rotor turns slightly below synchronous field speed. Use the cutaway or drawing to trace that path.${endings}`, prompt: 'Would you like a hint, a prediction to try, or a question to think it through?', sourceLinks: MOTOR_SOURCES, scope: 'Authored Engineering Studio teaching content. The operating animation is slowed and illustrative; it is not a real equipment measurement or work instruction.' };
};

const pump = (intent: CoachIntent, selected?: string | null, nextStep?: string, readings?: number, finished?: boolean): CoachResponse => {
  const label = boundedLabel(selected);
  const count = validCount(readings);
  const observed = count === null ? 'No reading count was supplied.' : `You have taken ${count} reading${count === 1 ? '' : 's'}.`;
  const focus = label ? ` Focus: ${label}.` : '';
  const completion = finished ? ' The practice step is marked finished; the case result does not establish real pump condition.' : '';
  let title = 'Explore the pump model';
  let text = `This is an illustrative steady-state teaching model. Its coefficients are round numbers, not measured pump data, and it has no qualified engineering review. ${observed}${focus}${completion}`;
  let prompt = 'Which gauge or flow reading will you inspect next, and what do you expect it to show?';
  if (intent === 'hint') {
    title = 'Choose the next observation';
    text = `${observed}${focus} Compare suction loss before the pump, pressure added by the pump, and loss across the discharge valve. A single unusual reading may not identify the cause.`;
    prompt = boundedLabel(nextStep) ? `Before using ${boundedLabel(nextStep)}, what would you expect it to show if your current explanation were right?` : 'Which section will you measure next: suction, pump, or valve? Say what result would support your idea.';
  } else if (intent === 'predict') {
    title = 'Predict before taking a reading';
    text = `The model calculates a new operating point from the speed, valve opening and case parameters. It does not predict real equipment behaviour. ${observed}${focus}`;
    prompt = 'Before you take the next reading, what do you predict will happen to flow and one pressure reading if you lower the speed slightly?';
  } else if (intent === 'check') {
    title = 'Talk through your explanation';
    text = `${observed}${focus} Compare readings from more than one circuit section. The simulation can help you inspect consistency, but it does not identify a real-world fault or authorize maintenance.`;
    prompt = 'Which readings support your explanation, and what other cause could produce a similar result? This is a reflection prompt; it does not mark your answer.';
  } else {
    text += ' Follow the water from source tank through suction line, pump and valve. Compare the pump head with its illustrative curve at the same flow and speed.';
    prompt = 'Would you like a hint, a prediction to try, or a question to think it through?';
  }
  return { title, text, prompt, sourceLinks: PUMP_SOURCES, scope: 'Authored prompt for the illustrative Pump Lab only. Hidden case cause is not used or revealed; no real pump diagnosis, maintenance instruction or validated performance claim.' };
};

function boundedLabel(value?: string | null): string {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 100) : '';
}
function validCount(value?: number): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 10000) : null;
}

/** Deterministic, authored coach. Receives no provider, simulation state, or hidden case data. */
export function coachFor(input: CoachInput): CoachResponse {
  const intent: CoachIntent = ['explain', 'hint', 'predict', 'check'].includes(input?.intent) ? input.intent : 'explain';
  if (input?.studio === 'pump') return pump(intent, input.selectedLabel, input.nextStep, input.readings, input.finished);
  return motor(intent, input?.selectedLabel, input?.nextStep, input?.finished);
}
