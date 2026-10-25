// Public contract for the KAIRO teaching character (CHARACTER-002, interface v1 with the revisions published in
// coordination/handoffs/claude-character.md). The component renders inside a host's existing R3F <Canvas>.

export type Vec3 = [number, number, number];

export type CharacterCue =
  | { id: string; type: 'idle' | 'listen' | 'explain' | 'acknowledge' }
  | { id: string; type: 'point'; targetId: string; contact?: 'auto' | 'never' }
  | { id: string; type: 'move'; anchorId: string };

/** A real scene target in the host Canvas's world space. `normal` faces away from the surface. */
export type Target = { id: string; position: Vec3; normal?: Vec3 };

/** Viseme timings must come from analysis of the actual audio (for example Rhubarb Lip Sync). */
export type Viseme = { at: number; end?: number; shape: string; weight: number };

export type AudioInput = {
  energy: number;
  playing: boolean;
  paused: boolean;
  time: number;
  visemes?: readonly Viseme[];
};

export type AudioSource = AudioInput | { readonly current: AudioInput };

export type Expression = 'neutral' | 'encouraging' | 'curious' | 'focused';

export type CueState = 'accepted' | 'acting' | 'completed' | 'interrupted' | 'unsupported';
export type CueEvent = { id: string; state: CueState; reason?: string };
export type ReadyReport = { assetId: string; rigVersion: string; capabilities: string[] };

export type CharacterProps = {
  cue: CharacterCue;
  targets: readonly Target[];
  audio: AudioSource;
  expression: Expression;
  reducedMotion: boolean;
  /** Listening gaze target; defaults to the active camera. */
  lookAt?: 'camera' | Vec3;
  /** GLB override; defaults to the KAIRO teacher. */
  url?: string;
  onReady: (report: ReadyReport) => void;
  onCueState: (event: CueEvent) => void;
  /** Optional measurements for rehearsal and automated checks, about four times a second. Not needed to integrate. */
  instrument?: (sample: InstrumentSample) => void;
};

export type InstrumentSample = {
  time: number;
  pointing: null | { side: 'l' | 'r'; weight: number; mode: 'contact' | 'ray'; tip: Vec3; target: Vec3; tipToTargetM: number; rayAngleDeg: number };
  gaze: { yawDeg: number; pitchDeg: number };
  head: Vec3;
  /** World positions of each wrist and index fingertip, so a check can see an arm return to its clip pose. */
  hands: Partial<Record<'l' | 'r', { wrist: Vec3; indexTip: Vec3 }>>;
  mouth: { jawOpen: number; open: number };
  blink: number;
  springs: boolean;
};

export function readAudio(source: AudioSource): AudioInput {
  return 'current' in source ? source.current : source;
}
