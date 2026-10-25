import { useEffect, useMemo, useState, type RefObject } from 'react';
import { demoAngles, fieldTurning, NORMAL_FIELD_STRENGTH, peakCurrents, PHASES, turningParts } from './fieldMath';
import { EXPERIMENT_READOUT, type SupplyChoice } from './motorContent';
import type { DemoClock } from './motorModel';

const PERCENT = new Intl.NumberFormat('en-ZA', { style: 'percent', maximumFractionDigits: 0 });
const SENSE = { 1: 'forward', [-1]: 'backward', 0: 'still' } as const;

/** Calculated readouts for the chosen supply, with the field's strength at the demonstration's present moment. */
export default function SupplyExperiment({ choice, clock, playing, tick }: { choice: SupplyChoice; clock: RefObject<DemoClock>; playing: boolean; tick: number }) {
  const { supply } = choice;
  const [strength, setStrength] = useState(() => demoAngles(clock.current!.seconds, supply).fieldStrength);

  useEffect(() => {
    let frame = 0;
    let last = 0;
    const read = (now: number) => {
      if (now - last > 120 || !playing) { setStrength(demoAngles(clock.current!.seconds, supply).fieldStrength); last = now; }
      if (playing) frame = requestAnimationFrame(read);
    };
    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [clock, playing, tick, supply]);

  const sense = SENSE[fieldTurning(supply)];
  const parts = turningParts(supply);
  const peaks = useMemo(() => peakCurrents(supply), [supply]);
  const carrying = PHASES.filter(phase => peaks[phase] > 1e-6);
  const idle = PHASES.filter(phase => peaks[phase] <= 1e-6);

  return <div className="eng-experiment">
    <h3>{choice.title}</h3>
    <dl className="eng-readout">
      <div><dt>Field, seen from the drive end</dt><dd>{EXPERIMENT_READOUT.field[sense]}</dd></div>
      <div><dt>Strength now</dt><dd>{PERCENT.format(strength)} of normal</dd></div>
      <div><dt>Turning parts</dt><dd>{PERCENT.format(parts.forward / NORMAL_FIELD_STRENGTH)} forward, {PERCENT.format(parts.backward / NORMAL_FIELD_STRENGTH)} backward</dd></div>
      <div><dt>From rest</dt><dd>{EXPERIMENT_READOUT.start[sense]}</dd></div>
      {idle.length > 0 && <div><dt>Current at rest</dt><dd>{PERCENT.format(peaks[carrying[0]])} of a normal start in {carrying.join(' and ')}; none in {idle.join(' and ')}</dd></div>}
    </dl>
  </div>;
}
