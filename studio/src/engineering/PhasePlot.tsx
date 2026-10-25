import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { demoAngles, PHASES, windingCurrents, wrapAngle, type Phase, type Supply } from './fieldMath';
import { PHASE_COLOURS } from './materials';
import type { SupplyChoice } from './motorContent';
import type { DemoClock } from './motorModel';

const WIDTH = 288;
const HEIGHT = 112;
const LEFT = 26;
const RIGHT = 10;
const TOP = 18;
const BOTTOM = 22;
const plotX = (deg: number) => LEFT + (deg / 360) * (WIDTH - LEFT - RIGHT);
const plotY = (value: number) => TOP + ((1 - value) / 2) * (HEIGHT - TOP - BOTTOM);
const FORMAT = new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
const current = (deg: number, supply: Supply) => windingCurrents((deg * Math.PI) / 180, supply);

type Curve = { path: string; label: { x: number; y: number; text: string } };

/** Each winding's current over one cycle, labelled at its peak; a winding with no current is labelled on the zero line. */
function curves(supply: Supply): Record<Phase, Curve> {
  const peaks = PHASES.map(phase => {
    let deg = 0;
    let value = -Infinity;
    for (let d = 0; d < 360; d++) {
      const v = current(d, supply)[phase];
      if (v > value + 1e-9) { value = v; deg = d; }
    }
    return { phase, deg, value };
  });
  const clearDeg = peaks.find(peak => peak.value > 0.05)?.deg ?? 0;
  const result = {} as Record<Phase, Curve>;
  for (const { phase, deg, value } of peaks) {
    const points: string[] = [];
    for (let d = 0; d <= 360; d += 4) points.push(`${plotX(d).toFixed(1)},${plotY(current(d, supply)[phase]).toFixed(1)}`);
    const flat = value <= 0.05;
    const x = Math.min(Math.max(plotX(flat ? clearDeg : deg), LEFT + 7), WIDTH - RIGHT - 7);
    const y = flat ? plotY(0) - 4 : plotY(value) - 5;
    result[phase] = { path: `M${points.join('L')}`, label: { x, y: Math.round(y * 10) / 10, text: flat ? `${phase} = 0` : phase } };
  }
  return result;
}

/** Idealised winding currents over one electrical cycle for the chosen supply, with the demonstration's present moment. */
export default function PhasePlot({ choice, clock, playing, tick }: { choice: SupplyChoice; clock: RefObject<DemoClock>; playing: boolean; tick: number }) {
  const { supply } = choice;
  const cursor = useRef<SVGLineElement>(null);
  const [probe, setProbe] = useState<number | null>(null);
  const [live, setLive] = useState(() => wrapAngle(demoAngles(clock.current!.seconds).electrical));
  const lines = useMemo(() => curves(supply), [supply]);

  useEffect(() => {
    let frame = 0;
    let lastText = 0;
    const draw = (now: number) => {
      const angle = wrapAngle(demoAngles(clock.current!.seconds).electrical);
      const x = plotX((angle * 180) / Math.PI).toFixed(1);
      cursor.current?.setAttribute('x1', x);
      cursor.current?.setAttribute('x2', x);
      if (now - lastText > 120 || !playing) { setLive(angle); lastText = now; }
      if (playing) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [clock, playing, tick]);

  const shownAngle = probe ?? live;
  const values = windingCurrents(shownAngle, supply);
  const shownDeg = Math.round((shownAngle * 180) / Math.PI) % 360;

  function onPointer(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    const deg = ((x - LEFT) / (WIDTH - LEFT - RIGHT)) * 360;
    setProbe(deg < 0 || deg > 360 ? null : (deg * Math.PI) / 180);
  }

  return <figure className="eng-phase-plot">
    <figcaption>Winding currents over one cycle <span>{choice.plotNote}</span></figcaption>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={choice.plotDescription} onPointerMove={onPointer} onPointerLeave={() => setProbe(null)}>
      <line className="eng-plot-zero" x1={LEFT} x2={WIDTH - RIGHT} y1={plotY(0)} y2={plotY(0)} />
      <text className="eng-plot-tick" x={LEFT - 6} y={plotY(1) + 3} textAnchor="end">+1</text>
      <text className="eng-plot-tick" x={LEFT - 6} y={plotY(0) + 3} textAnchor="end">0</text>
      <text className="eng-plot-tick" x={LEFT - 6} y={plotY(-1) + 3} textAnchor="end">−1</text>
      {[0, 180, 360].map(deg => <text key={deg} className="eng-plot-tick" x={plotX(deg)} y={HEIGHT - 6} textAnchor="middle">{deg}°</text>)}
      {PHASES.map(p => <path key={p} d={lines[p].path} stroke={PHASE_COLOURS[p]} className="eng-plot-line" />)}
      {PHASES.map(p => <text key={p} className="eng-plot-label" x={lines[p].label.x} y={lines[p].label.y} textAnchor="middle">{lines[p].label.text}</text>)}
      <line ref={cursor} className="eng-plot-cursor" y1={TOP - 4} y2={HEIGHT - BOTTOM + 2} x1={plotX(0)} x2={plotX(0)} />
      {probe !== null && <line className="eng-plot-probe" y1={TOP - 4} y2={HEIGHT - BOTTOM + 2} x1={plotX((probe * 180) / Math.PI)} x2={plotX((probe * 180) / Math.PI)} />}
    </svg>
    <dl className="eng-plot-values">
      <div><dt>{probe === null ? 'Now' : 'At'}</dt><dd>{shownDeg}°</dd></div>
      {PHASES.map(p => <div key={p}><dt><i style={{ background: PHASE_COLOURS[p] }} />{p}</dt><dd>{FORMAT.format(values[p])}</dd></div>)}
    </dl>
    <details className="eng-plot-table">
      <summary>Show values as a table</summary>
      <table>
        <thead><tr><th scope="col">Angle</th>{PHASES.map(p => <th key={p} scope="col">{p}</th>)}</tr></thead>
        <tbody>{[0, 60, 120, 180, 240, 300].map(deg => {
          const row = current(deg, supply);
          return <tr key={deg}><th scope="row">{deg}°</th>{PHASES.map(p => <td key={p}>{FORMAT.format(row[p])}</td>)}</tr>;
        })}</tbody>
      </table>
    </details>
  </figure>;
}
