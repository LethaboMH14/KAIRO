import { PART_BY_ID, SOURCES, SUPPLY_BY_ID, type Mode, type PartId } from './motorContent.ts';
import { readNumber, synchronousSpeed } from './fieldMath.ts';

export type TeachingIntent = 'part' | 'field-speed' | 'next';
export type EngineeringContext = { selected: PartId | null; mode: Mode; supplyId: string; frequency: string; poles: number };
export type EngineeringExplanation = { title: string; text: string; sources: typeof SOURCES; focus: PartId | null };

/** Prepared content and exact calculations only; no general model or equipment control. */
export function engineeringExplanation(context: EngineeringContext, intent: TeachingIntent): EngineeringExplanation {
  const part = context.selected ? PART_BY_ID[context.selected] : null;
  if (intent === 'field-speed') {
    const result = synchronousSpeed(readNumber(context.frequency), context.poles);
    return { title: 'Work out the field speed', text: result.ok
      ? `Synchronous field speed is 120 × frequency ÷ total poles. With ${result.frequencyHz} Hz and ${result.poles} poles: 120 × ${result.frequencyHz} ÷ ${result.poles} = ${Number(result.rpm.toFixed(3))} r/min. This is the rotating field speed, not measured shaft speed. The visual motor has four poles; changing this calculator does not rebuild its winding. Predict the answer at a different frequency, then check it in the calculator.`
      : `${result.message} Correct that input before calculating the field speed.`, sources: SOURCES, focus: 'stator-windings' };
  }
  if (intent === 'part' && part) return { title: part.name, text: `${part.role} ${part.detail} ${part.fact} ${part.motion === 'stationary' ? 'Check the drawing: this part stays still even when the field turns.' : 'Use the drawing or cutaway to follow how this part connects to the rest of the motor.'}`, sources: SOURCES, focus: part.id };
  const supply = SUPPLY_BY_ID[context.supplyId];
  return { title: 'Try one small experiment', text: context.mode === 'operate' && supply
    ? `${supply.caption} ${supply.explanation.join(' ')} Pause the model and explain which observation supports that explanation. This is an illustrative educational model, not a measurement or a diagnosis of real equipment.`
    : 'Select the stator windings and read what they do. Then select the squirrel cage and compare the two. Before running the model, predict which part stays still. Use the existing practice questions to check your reasoning. Never use this educational model as instructions for working on live electrical equipment.', sources: SOURCES, focus: 'stator-windings' };
}
