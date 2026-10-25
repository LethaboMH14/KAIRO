import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { demoAngles, easeInOutCubic, explodeDuration, slotCurrent, type Supply } from './fieldMath';
import { PHASE_COLOURS, SELECTION_COLOUR } from './materials';
import { PART_BY_ID, PARTS, type PartId } from './motorContent';
import { GEOMETRY, modelBounds, nodeOffset, partBounds, type DemoClock, type MeshInfo } from './motorModel';

// Lightweight 2D alternative to the 3D view. Every outline comes from slicing
// the same Blender geometry (see design/engineering/blender/build_motor.py), so
// the drawing and the model cannot drift apart.

type View = 'side' | 'end';
type Props = {
  view: View;
  selected: PartId | null;
  hovered: PartId | null;
  explode: number;
  reduced: boolean;
  playing: boolean;
  tick: number;
  supply: Supply;
  clock: RefObject<DemoClock>;
  onSelect: (part: PartId) => void;
  onHover: (part: PartId | null) => void;
};

/** Below this share of the peak current a slot is drawn empty: no current either way. */
const NO_CURRENT = 0.02;

const FILL: Record<string, string> = {
  'paint-graphite': '#b7c3c1',
  'steel-lamination': '#98a2a4',
  'copper-winding': '#c98a5e',
  insulation: '#e7ddc4',
  'aluminium-cast': '#d6dadc',
  'steel-shaft': '#c6ccce',
  'steel-dark': '#8e969a',
  'steel-bearing': '#dadee0',
  'polymer-fan': '#5c6a70',
  'polymer-black': '#3d474b',
  brass: '#cdae73',
};
const CAST = new Set(['housing', 'terminal-box', 'end-shield-de', 'end-shield-nde', 'fan-cover']);
const ROTATING = new Set<PartId>(['rotor-core', 'rotor-cage', 'shaft']);
const FULL = GEOMETRY.meshes.filter(mesh => mesh.variant === 'full');
const DEG = 180 / Math.PI;

function loopsPath(loops: number[][] = []): string {
  return loops.map(loop => {
    let d = `M${loop[0]} ${loop[1]}`;
    for (let i = 2; i < loop.length; i += 2) d += `L${loop[i]} ${loop[i + 1]}`;
    return `${d}Z`;
  }).join('');
}

/** Tweens the drawing's explode value exactly like the 3D view does. */
function useExplodeValue(target: number, reduced: boolean) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    const duration = explodeDuration(from, target, reduced);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      current.current = t >= 1 ? target : from + (target - from) * easeInOutCubic(t);
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return value;
}

function useWidth<T extends Element>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function partKeys(onSelect: (part: PartId) => void, part: PartId) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(part);
    }
  };
}

function PartShapes({ part, meshes, section, explode, ids, props }: { part: PartId; meshes: MeshInfo[]; section: View; explode: number; ids: { hatch: string; lam: string }; props: Props }) {
  const info = PART_BY_ID[part];
  const selected = props.selected === part;
  return <g
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    aria-label={`${info.item}. ${info.name}`}
    className={`eng-diagram-part${selected ? ' is-selected' : ''}${props.hovered === part ? ' is-hovered' : ''}`}
    onClick={() => props.onSelect(part)}
    onKeyDown={partKeys(props.onSelect, part)}
    onPointerEnter={() => props.onHover(part)}
    onPointerLeave={() => props.onHover(null)}
  >
    {meshes.map(mesh => {
      const loops = section === 'side' ? mesh.side : mesh.end;
      if (!loops?.length) return null;
      const d = loopsPath(loops);
      const [dx, dy] = section === 'side' ? nodeOffset(mesh.node, explode) : [0, 0];
      const material = mesh.materials[0];
      const fill = selected ? SELECTION_COLOUR : mesh.phase && section === 'end' ? PHASE_COLOURS[mesh.phase] : FILL[material] ?? '#c9cfcd';
      const overlay = CAST.has(part) ? ids.hatch : section === 'side' && material === 'steel-lamination' ? ids.lam : null;
      return <g key={mesh.name} transform={dx || dy ? `translate(${(dx * 1000).toFixed(2)} ${(-dy * 1000).toFixed(2)})` : undefined}>
        <path d={d} fill={fill} fillRule="evenodd" className="eng-diagram-shape" />
        {overlay && <path d={d} fill={`url(#${overlay})`} fillRule="evenodd" className="eng-diagram-overlay" />}
      </g>;
    })}
  </g>;
}

function Callout({ part, explode, scale, quiet }: { part: PartId; explode: number; scale: number; quiet?: boolean }) {
  const bounds = partBounds(part, explode);
  const x = ((bounds.min[0] + bounds.max[0]) / 2) * 1000;
  const top = -bounds.max[1] * 1000;
  const size = 12.5 / scale;
  const info = PART_BY_ID[part];
  return <g className={quiet ? 'eng-callout is-quiet' : 'eng-callout'} aria-hidden="true">
    <line x1={x} x2={x} y1={top - 3 / scale} y2={top - 26 / scale} />
    <text x={x} y={top - 32 / scale} textAnchor="middle" fontSize={size}>{quiet ? info.name : `${info.item}  ${info.name}`}</text>
  </g>;
}

export default function MotorDiagram(props: Props) {
  const explode = useExplodeValue(props.explode, props.reduced);
  const [box, width] = useWidth<HTMLDivElement>();
  const uid = useId().replace(/:/g, '');
  const ids = { hatch: `eng-hatch-${uid}`, lam: `eng-lam-${uid}` };
  const rotor = useRef<SVGGElement>(null);
  const field = useRef<SVGGElement>(null);
  const poleLabels = useRef<(SVGTextElement | null)[]>([]);
  const slotMarks = useRef<(SVGGElement | null)[]>([]);

  const byPart = useMemo(() => {
    const map = new Map<PartId, MeshInfo[]>();
    for (const mesh of FULL) map.set(mesh.part, [...(map.get(mesh.part) ?? []), mesh]);
    return map;
  }, []);

  const bounds = modelBounds(props.view === 'side' ? explode : 0);
  const viewBox = props.view === 'side'
    ? { x: bounds.min[0] * 1000 - 30, y: -bounds.max[1] * 1000 - 70, w: (bounds.max[0] - bounds.min[0]) * 1000 + 60, h: (bounds.max[1] - bounds.min[1]) * 1000 + 100 }
    : { x: -180, y: -200, w: 360, h: 362 };
  const scale = width > 0 ? width / viewBox.w : 1;

  useEffect(() => {
    if (props.view !== 'end') return;
    let frame = 0;
    const draw = () => {
      const a = demoAngles(props.clock.current!.seconds, props.supply);
      const strength = a.fieldStrength.toFixed(2);
      rotor.current?.setAttribute('transform', `rotate(${(-a.rotor * DEG).toFixed(2)})`);
      field.current?.setAttribute('transform', `rotate(${(-a.north * DEG).toFixed(2)})`);
      if (field.current) field.current.style.opacity = strength;
      poleLabels.current.forEach((label, k) => {
        const angle = a.north + (k * Math.PI) / 2;
        label?.setAttribute('x', (150 * Math.cos(angle)).toFixed(1));
        label?.setAttribute('y', (-150 * Math.sin(angle) + 4).toFixed(1));
        if (label) label.style.opacity = strength;
      });
      slotMarks.current.forEach((mark, k) => {
        const current = slotCurrent(GEOMETRY.slots[k], a.electrical, props.supply);
        if (!mark) return;
        mark.style.opacity = (0.2 + 0.8 * Math.abs(current)).toFixed(2);
        mark.dataset.direction = Math.abs(current) < NO_CURRENT ? 'none' : current > 0 ? 'out' : 'in';
      });
      if (props.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [props.view, props.playing, props.tick, props.clock, props.supply]);

  const drawParts = (section: View, filter: (part: PartId) => boolean) => PARTS.filter(p => filter(p.id)).map(p => {
    const meshes = (byPart.get(p.id) ?? []).filter(m => (section === 'side' ? m.side?.length : m.end?.length));
    if (!meshes.length) return null;
    return <PartShapes key={p.id} part={p.id} meshes={meshes} section={section} explode={explode} ids={ids} props={props} />;
  });

  const slotRadius = GEOMETRY.machine.slotCentreRadiusMm;
  return <div className="eng-diagram" ref={box}>
    <svg
      viewBox={`${viewBox.x.toFixed(1)} ${viewBox.y.toFixed(1)} ${viewBox.w.toFixed(1)} ${viewBox.h.toFixed(1)}`}
      className="eng-diagram-svg"
      role="group"
      aria-label={props.view === 'side' ? 'Longitudinal section drawing of the motor. Each part can be selected.' : 'Cross-section of the motor seen from the drive end, showing the stator slots, rotor bars and rotating field.'}
    >
      <defs>
        <pattern id={ids.hatch} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" className="eng-hatch-line" />
        </pattern>
        <pattern id={ids.lam} patternUnits="userSpaceOnUse" width="2.4" height="8">
          <line x1="0" y1="0" x2="0" y2="8" className="eng-lam-line" />
        </pattern>
      </defs>
      {props.view === 'side' ? <>
        <line className="eng-centre-line" x1={viewBox.x} x2={viewBox.x + viewBox.w} y1={0} y2={0} />
        <line className="eng-bench-line" x1={viewBox.x} x2={viewBox.x + viewBox.w} y1={GEOMETRY.machine.shaftHeightMm} y2={GEOMETRY.machine.shaftHeightMm} />
        {drawParts('side', () => true)}
        {props.hovered && props.hovered !== props.selected && <Callout part={props.hovered} explode={explode} scale={scale} quiet />}
        {props.selected && <Callout part={props.selected} explode={explode} scale={scale} />}
      </> : <>
        <g ref={field} className="eng-field-ring" aria-hidden="true">
          <circle r={150} />
          {[0, 1, 2, 3].map(k => {
            const a = (k * Math.PI) / 2;
            const start = a - 0.32, end = a + 0.32;
            return <path key={k} className={k % 2 ? 'eng-field-arc is-south' : 'eng-field-arc'} d={`M${(150 * Math.cos(start)).toFixed(1)} ${(-150 * Math.sin(start)).toFixed(1)}A150 150 0 0 0 ${(150 * Math.cos(end)).toFixed(1)} ${(-150 * Math.sin(end)).toFixed(1)}`} />;
          })}
        </g>
        {drawParts('end', part => !ROTATING.has(part))}
        <g ref={rotor}>
          {drawParts('end', part => ROTATING.has(part))}
          <line className="eng-rotor-pointer" x1={22 * Math.cos(0.646)} y1={-22 * Math.sin(0.646)} x2={46 * Math.cos(0.646)} y2={-46 * Math.sin(0.646)} />
        </g>
        <g aria-hidden="true">
          {GEOMETRY.slots.map((slot, k) => {
            const a = (slot.angleDeg * Math.PI) / 180;
            return <g key={k} ref={el => { slotMarks.current[k] = el; }} className="eng-slot-mark" data-direction="out" transform={`translate(${(slotRadius * Math.cos(a)).toFixed(2)} ${(-slotRadius * Math.sin(a)).toFixed(2)})`}>
              <circle r={2.6} stroke={PHASE_COLOURS[slot.phase]} />
              <circle r={0.8} className="eng-slot-dot" />
              <path d="M-1.5 -1.5L1.5 1.5M-1.5 1.5L1.5 -1.5" className="eng-slot-cross" />
            </g>;
          })}
        </g>
        {[0, 1, 2, 3].map(k => <text key={k} ref={el => { poleLabels.current[k] = el; }} className={k % 2 ? 'eng-pole-label is-south' : 'eng-pole-label'} textAnchor="middle" aria-hidden="true">{k % 2 ? 'S' : 'N'}</text>)}
      </>}
    </svg>
  </div>;
}
