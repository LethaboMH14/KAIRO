import type { KeyboardEvent, ReactNode } from 'react';
import { CIRCUIT, LIMITS, type OperatingPoint } from './physics.ts';
import { DIAGRAM_VIEWBOX, TARGET_BY_ID, stateCues, type TargetId } from './layout.ts';
import { latestReading } from './readout.ts';
import type { PumpLabState } from './session.ts';

// The 2D schematic: a first-class view, not a fallback. Every part is a focusable
// button with a text name; every cue also appears as a word, never only a colour.

type Props = {
  state: PumpLabState;
  op: OperatingPoint;
  live: boolean;
  selected: TargetId | null;
  highlight: TargetId | null;
  reducedMotion: boolean;
  onSelect: (id: TargetId) => void;
};

const PX_PER_M = 60;
const SRC = { x: 50, w: 120, floor: 430 };
const DST = { x: 830, w: 120, floor: 430 - CIRCUIT.destBaseM * PX_PER_M };

function Part({ id, selected, highlight, onSelect, children }: { id: TargetId; selected: TargetId | null; highlight: TargetId | null; onSelect: (id: TargetId) => void; children: ReactNode }) {
  const t = TARGET_BY_ID[id];
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
  };
  return (
    <g
      className={`pl-part${selected === id ? ' is-selected' : ''}${highlight === id ? ' is-highlight' : ''}`}
      role="button" tabIndex={0} aria-label={`${t.label}. ${t.role}`} aria-pressed={selected === id}
      onClick={() => onSelect(id)} onKeyDown={onKey}
    >
      {children}
    </g>
  );
}

export default function PumpDiagram({ state, op, live, selected, highlight, reducedMotion, onSelect }: Props) {
  const r = latestReading(state);
  const cues = stateCues(op, live);
  const on = (id: string) => cues.find(c => c.id === id)!.active;
  const srcY = SRC.floor - op.sourceLevelM * PX_PER_M;
  const dstY = DST.floor - op.destLevelM * PX_PER_M;
  const flowing = on('flow-particles');
  const duration = flowing ? Math.max(0.25, 14 / Math.max(op.flowLps, 0.1)) : 0;
  const handleAngle = -(100 - state.settings.valvePct) * 0.9;
  const val = (v: number | undefined, d = 0) => (v === undefined ? '—' : v.toFixed(d));
  const gaugeText = (id: TargetId): string => {
    if (!r) return '—';
    if (id === 'gauge-suction') return `${r.measured.suctionKpa} kPa`;
    if (id === 'gauge-discharge') return `${r.measured.dischargeKpa} kPa`;
    if (id === 'gauge-post-valve') return `${r.measured.postValveKpa} kPa`;
    if (id === 'flow-meter') return `${val(r.measured.flowLps, 1)} L/s`;
    return `${val(r.measured.shaftKw, 2)} kW`;
  };
  const gauge = (id: TargetId, dx = 0, dy = 0, labelBelow = false) => {
    const [x, y] = TARGET_BY_ID[id].diagram;
    return (
      <Part id={id} selected={selected} highlight={highlight} onSelect={onSelect} key={id}>
        <circle cx={x + dx} cy={y + dy} r={22} className="pl-gauge" />
        <text x={x + dx} y={y + dy + 4} className="pl-gauge-text" textAnchor="middle">{gaugeText(id)}</text>
        {labelBelow
          ? <text x={x + dx + 30} y={y + dy + 4} className="pl-label" textAnchor="start">{TARGET_BY_ID[id].label}</text>
          : <text x={x + dx} y={y + dy - 28} className="pl-label" textAnchor="middle">{TARGET_BY_ID[id].label}</text>}
      </Part>
    );
  };
  return (
    <svg className="pl-diagram" viewBox={`0 0 ${DIAGRAM_VIEWBOX.w} ${DIAGRAM_VIEWBOX.h}`} role="group" aria-labelledby="pl-diagram-title pl-diagram-desc">
      <title id="pl-diagram-title">Pump circuit diagram</title>
      <desc id="pl-diagram-desc">
        Water flows left to right: source tank, strainer, suction pipe, pump driven by a motor, a riser, the discharge valve, flow meter, and up into the raised destination tank.
        Gauges sit before the pump, after the pump and after the valve. Not to scale.
      </desc>

      {/* pipes */}
      <polyline className="pl-pipe" points="170,380 405,380" />
      <polyline className="pl-pipe" points="450,335 450,150 800,150 800,230 830,230" />
      {flowing && (
        <>
          <polyline className={`pl-flow pl-flow-suction${reducedMotion ? ' is-static' : ''}`} points="170,380 405,380" style={{ animationDuration: `${duration}s` }} aria-hidden="true" />
          <polyline className={`pl-flow pl-flow-discharge${reducedMotion ? ' is-static' : ''}`} points="450,335 450,150 800,150 800,230 830,230" style={{ animationDuration: `${duration}s` }} aria-hidden="true" />
        </>
      )}
      <text x="330" y="440" className="pl-zone" textAnchor="middle">suction side</text>
      <text x="705" y="252" className="pl-zone" textAnchor="middle">discharge side</text>

      {/* tanks */}
      <Part id="source-tank" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={SRC.x} y={SRC.floor - CIRCUIT.tankWallM * PX_PER_M} width={SRC.w} height={CIRCUIT.tankWallM * PX_PER_M} className="pl-tank" />
        <rect x={SRC.x + 1} y={srcY} width={SRC.w - 2} height={Math.max(0, SRC.floor - srcY - 1)} className="pl-water" />
        <text x={SRC.x + SRC.w / 2} y={SRC.floor + 22} className="pl-label" textAnchor="middle">Source tank {op.sourceLevelM.toFixed(2)} m</text>
        {on('source-low') && <text x={SRC.x + SRC.w / 2} y={SRC.floor - 20} className="pl-alert" textAnchor="middle">Too low</text>}
      </Part>
      <Part id="dest-tank" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={DST.x} y={DST.floor - CIRCUIT.tankWallM * PX_PER_M} width={DST.w} height={CIRCUIT.tankWallM * PX_PER_M} className="pl-tank" />
        <rect x={DST.x + 1} y={dstY} width={DST.w - 2} height={Math.max(0, DST.floor - dstY - 1)} className="pl-water" />
        <text x={DST.x + DST.w / 2} y={DST.floor + 22} className="pl-label" textAnchor="middle">Destination {op.destLevelM.toFixed(2)} m</text>
      </Part>

      {/* strainer */}
      <Part id="strainer" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={212} y={362} width={36} height={36} rx={5} className="pl-fitting" />
        <path d="M218 368 L242 392 M218 380 L230 392 M230 368 L242 380" className="pl-mesh" />
        <text x={230} y={420} className="pl-label" textAnchor="middle">Strainer</text>
      </Part>
      <Part id="suction-pipe" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={290} y={372} width={80} height={16} className="pl-hit" />
      </Part>

      {/* pump + motor */}
      <Part id="pump-casing" selected={selected} highlight={highlight} onSelect={onSelect}>
        <circle cx={450} cy={380} r={46} className="pl-casing" />
        {on('cavitation-bubbles') && (
          <g aria-hidden="true">
            <circle cx={430} cy={368} r={5} className="pl-bubble" /><circle cx={445} cy={392} r={4} className="pl-bubble" />
            <circle cx={462} cy={372} r={3} className="pl-bubble" /><circle cx={470} cy={390} r={5} className="pl-bubble" />
          </g>
        )}
        <text x={450} y={452} className="pl-label" textAnchor="middle">Pump</text>
      </Part>
      <Part id="impeller" selected={selected} highlight={highlight} onSelect={onSelect}>
        <g className={`pl-impeller${on('impeller-spin') && !reducedMotion ? ' is-spinning' : ''}`} style={{ transformOrigin: '450px 380px', animationDuration: `${Math.max(0.2, 1.2 / Math.max(op.speedRatio, 0.2))}s` }}>
          <circle cx={450} cy={380} r={26} className="pl-impeller-disc" />
          <path d="M450 380 Q470 365 474 380 M450 380 Q435 400 450 406 M450 380 Q430 365 430 380 M450 380 Q465 398 450 406" className="pl-vane" />
        </g>
      </Part>
      <Part id="shaft-seal" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={496} y={374} width={32} height={12} className="pl-shaft" />
        <rect x={500} y={368} width={8} height={24} className="pl-seal" />
      </Part>
      <Part id="coupling" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={528} y={366} width={30} height={28} rx={4} className="pl-fitting" />
      </Part>
      <Part id="motor" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={560} y={342} width={180} height={76} rx={10} className="pl-motor" />
        {[580, 600, 620, 640, 660, 680, 700, 720].map(x => <line key={x} x1={x} y1={346} x2={x} y2={414} className="pl-fin" />)}
        <text x={650} y={440} className="pl-label" textAnchor="middle">Motor {state.settings.speedRpm} rpm</text>
      </Part>

      {/* discharge */}
      <Part id="discharge-pipe" selected={selected} highlight={highlight} onSelect={onSelect}>
        <rect x={440} y={200} width={20} height={90} className="pl-hit" />
        <rect x={610} y={142} width={90} height={16} className="pl-hit" />
      </Part>
      <Part id="valve" selected={selected} highlight={highlight} onSelect={onSelect}>
        <polygon points="542,136 578,164 578,136 542,164" className="pl-valve-body" />
        <line x1={560} y1={136} x2={560} y2={112} className="pl-stem" />
        <g transform={`rotate(${handleAngle} 560 112)`}><rect x={540} y={106} width={40} height={8} rx={4} className="pl-handle" /></g>
        <text x={560} y={188} className="pl-label" textAnchor="middle">Valve handle {state.settings.valvePct}%</text>
      </Part>

      {/* instruments */}
      {gauge('gauge-suction')}
      {gauge('gauge-discharge', 0, 0, true)}
      {gauge('gauge-post-valve')}
      {gauge('flow-meter', 0, 52)}
      {gauge('power-meter')}

      {/* cue words: the same state as the glow, in words */}
      {on('discharge-over-limit') && <text x={515} y={212} className="pl-alert" textAnchor="start">Over limit ({LIMITS.maxDischargeKpa} kPa)</text>}
      {on('motor-over-rating') && <text x={650} y={276} className="pl-alert" textAnchor="middle">Over rating ({LIMITS.motorRatedKw} kW)</text>}
      {!live && <text x={500} y={510} className="pl-note" textAnchor="middle">The pump is idle until you predict the flow.</text>}
      {live && on('cavitation-bubbles') && <text x={450} y={480} className="pl-alert" textAnchor="middle">Bubbles at the impeller: crackling</text>}
      <text x={20} y={548} className="pl-note">Not to scale. Dots and shading reflect the model state, not a flow simulation.</text>
    </svg>
  );
}

