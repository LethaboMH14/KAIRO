import { CIRCUIT, HEALTHY, KPA_PER_M, LIMITS, curvePoints, levels, operatingPoint } from './physics.ts';
import type { PumpLabState } from './session.ts';

// Two plots, each with its numbers in a table underneath. Lines differ by dash and
// direct label as well as colour. Only values the learner could know are drawn: the
// datasheet curves for a healthy circuit and the learner's own measured readings.

const W = 520, H = 300, PAD = { l: 52, r: 16, t: 16, b: 44 };
const sx = (v: number, max: number) => PAD.l + (v / max) * (W - PAD.l - PAD.r);
const sy = (v: number, max: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
const path = (pts: { q: number; h: number }[], qMax: number, hMax: number) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.q, qMax).toFixed(1)} ${sy(Math.min(p.h, hMax), hMax).toFixed(1)}`).join(' ');

function Axes({ xMax, yMax, xLabel, yLabel, xStep, yStep }: { xMax: number; yMax: number; xLabel: string; yLabel: string; xStep: number; yStep: number }) {
  const xs: number[] = [], ys: number[] = [];
  for (let v = 0; v <= xMax + 1e-9; v += xStep) xs.push(v);
  for (let v = 0; v <= yMax + 1e-9; v += yStep) ys.push(v);
  return (
    <g>
      {ys.map(v => <g key={`y${v}`}><line x1={PAD.l} x2={W - PAD.r} y1={sy(v, yMax)} y2={sy(v, yMax)} className="pl-grid-line" /><text x={PAD.l - 6} y={sy(v, yMax) + 4} textAnchor="end" className="pl-tick">{v}</text></g>)}
      {xs.map(v => <text key={`x${v}`} x={sx(v, xMax)} y={H - PAD.b + 16} textAnchor="middle" className="pl-tick">{v}</text>)}
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} className="pl-axis" />
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="pl-axis" />
      <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" className="pl-axis-label">{xLabel}</text>
      <text x={14} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})`} className="pl-axis-label">{yLabel}</text>
    </g>
  );
}

export function CurvePlot({ state }: { state: PumpLabState }) {
  const cond = { ...state.settings, tanks: state.tanks, fault: { ...HEALTHY } };
  const qMax = 20, hMax = 26;
  const pump = curvePoints('pump', cond);
  const system = curvePoints('system', cond);
  const expected = operatingPoint(cond);
  const measured = state.readings.filter(r => r.measured.flowLps > 0).map(r => ({
    id: r.id, q: r.measured.flowLps, h: (r.measured.dischargeKpa - r.measured.suctionKpa) / KPA_PER_M,
  }));
  const { sourceM, destM } = levels(state.tanks);
  return (
    <figure className="pl-figure">
      <figcaption><strong>Pump head against flow</strong> at {state.settings.speedRpm} rpm, valve {state.settings.valvePct}%. Datasheet curves for a healthy circuit, and your readings.</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="pl-curve-title" className="pl-plot">
        <title id="pl-curve-title">{`Pump head against flow. The datasheet pump curve falls as flow rises and the system curve rises. A healthy circuit would give ${expected.flowLps.toFixed(1)} L/s here. ${measured.length ? `Your ${measured.length} readings are marked.` : 'No readings yet.'}`}</title>
        <Axes xMax={qMax} yMax={hMax} xLabel="Flow (L/s)" yLabel="Head (m of water)" xStep={5} yStep={5} />
        <line x1={sx(LIMITS.targetFlowLps, qMax)} x2={sx(LIMITS.targetFlowLps, qMax)} y1={PAD.t} y2={H - PAD.b} className="pl-target-line" />
        <text x={sx(LIMITS.targetFlowLps, qMax) + 4} y={PAD.t + 12} className="pl-tick">target {LIMITS.targetFlowLps}</text>
        <path d={path(pump, qMax, hMax)} className="pl-curve pl-curve-pump" fill="none" />
        <path d={path(system, qMax, hMax)} className="pl-curve pl-curve-system" fill="none" />
        <text x={sx(1, qMax)} y={sy(Math.min(pump[0].h, hMax), hMax) - 6} className="pl-tick">datasheet pump</text>
        {system.length > 0 && <text x={sx(qMax - 0.5, qMax)} y={sy(Math.min(system[system.length - 1].h, hMax), hMax) + 14} textAnchor="end" className="pl-tick">system (clean)</text>}
        {expected.flowLps > 0 && (
          <g aria-label="Datasheet expectation">
            <polygon points={`${sx(expected.flowLps, qMax)},${sy(expected.pumpCurveHeadM, hMax) - 7} ${sx(expected.flowLps, qMax) + 7},${sy(expected.pumpCurveHeadM, hMax)} ${sx(expected.flowLps, qMax)},${sy(expected.pumpCurveHeadM, hMax) + 7} ${sx(expected.flowLps, qMax) - 7},${sy(expected.pumpCurveHeadM, hMax)}`} className="pl-expected" />
            <text x={sx(expected.flowLps, qMax) + 10} y={sy(expected.pumpCurveHeadM, hMax) - 8} className="pl-tick">expected</text>
          </g>
        )}
        {measured.map(m => (
          <g key={m.id}>
            <circle cx={sx(m.q, qMax)} cy={sy(Math.min(Math.max(m.h, 0), hMax), hMax)} r={5} className="pl-measured" />
            <text x={sx(m.q, qMax) + 8} y={sy(Math.min(Math.max(m.h, 0), hMax), hMax) + 4} className="pl-tick">{m.id}</text>
          </g>
        ))}
      </svg>
      <details>
        <summary>Table for this plot</summary>
        <table className="pl-table">
          <caption>Static lift is {(CIRCUIT.destBaseM + destM - sourceM).toFixed(2)} m at the current tank levels.</caption>
          <thead><tr><th scope="col">Item</th><th scope="col">Flow (L/s)</th><th scope="col">Head (m)</th></tr></thead>
          <tbody>
            <tr><th scope="row">Datasheet expectation, healthy circuit</th><td>{expected.flowLps.toFixed(1)}</td><td>{expected.pumpCurveHeadM.toFixed(1)}</td></tr>
            {measured.map(m => <tr key={m.id}><th scope="row">Reading {m.id}: head the pump added</th><td>{m.q.toFixed(1)}</td><td>{m.h.toFixed(1)}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function ReadingsPlot({ state }: { state: PumpLabState }) {
  const rs = state.readings;
  const tMax = Math.max(60, ...rs.map(r => r.clockS)) * 1.05;
  const qMax = 20;
  return (
    <figure className="pl-figure">
      <figcaption><strong>Flow at each reading</strong> through the session, against the {LIMITS.targetFlowLps} L/s target.</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="pl-flow-title" className="pl-plot">
        <title id="pl-flow-title">{`Flow at each reading against time. ${rs.length ? `${rs.length} readings.` : 'No readings yet.'}`}</title>
        <Axes xMax={Math.round(tMax)} yMax={qMax} xLabel="Time in this case (s)" yLabel="Flow (L/s)" xStep={Math.max(30, Math.round(tMax / 5 / 30) * 30)} yStep={5} />
        <line x1={PAD.l} x2={W - PAD.r} y1={sy(LIMITS.targetFlowLps, qMax)} y2={sy(LIMITS.targetFlowLps, qMax)} className="pl-target-line" />
        <text x={W - PAD.r - 2} y={sy(LIMITS.targetFlowLps, qMax) - 5} textAnchor="end" className="pl-tick">target</text>
        {rs.length > 1 && <path d={rs.map((r, i) => `${i ? 'L' : 'M'}${sx(r.clockS, tMax).toFixed(1)} ${sy(r.measured.flowLps, qMax).toFixed(1)}`).join(' ')} className="pl-curve pl-curve-trace" fill="none" />}
        {rs.map(r => (
          <g key={r.id}>
            {r.epoch === 0
              ? <circle cx={sx(r.clockS, tMax)} cy={sy(r.measured.flowLps, qMax)} r={5} className="pl-measured" />
              : <rect x={sx(r.clockS, tMax) - 5} y={sy(r.measured.flowLps, qMax) - 5} width={10} height={10} className="pl-measured-after" />}
            <text x={sx(r.clockS, tMax) + 8} y={sy(r.measured.flowLps, qMax) - 6} className="pl-tick">{r.id}</text>
          </g>
        ))}
      </svg>
      <p className="pl-legend-line">Circles are readings before a repair; squares are readings after one.</p>
      <details>
        <summary>Table for this plot</summary>
        <table className="pl-table">
          <thead><tr><th scope="col">Reading</th><th scope="col">Time (s)</th><th scope="col">Condition</th><th scope="col">Flow (L/s)</th></tr></thead>
          <tbody>
            {rs.length === 0 && <tr><td colSpan={4}>No readings yet.</td></tr>}
            {rs.map(r => <tr key={r.id}><th scope="row">{r.id}</th><td>{r.clockS}</td><td>{r.epoch === 0 ? 'before repair' : 'after repair'}</td><td>{r.measured.flowLps.toFixed(1)}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
