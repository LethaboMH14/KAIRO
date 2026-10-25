// Cue lifecycle bookkeeping: every cue id gets one `accepted`, at most one `acting`, and at most one terminal event
// (`completed`, `interrupted` or `unsupported`). A new cue interrupts the previous unfinished one first.
import type { CharacterCue, CueEvent } from './types.ts';

type Terminal = 'completed' | 'interrupted' | 'unsupported';

export class CueLedger {
  active: CharacterCue | null = null;
  private readonly accepted = new Set<string>();
  private readonly acted = new Set<string>();
  private readonly terminal = new Set<string>();

  private readonly emit: (event: CueEvent) => void;

  constructor(emit: (event: CueEvent) => void) {
    this.emit = emit;
  }

  /** Starts `cue`. Returns false when it repeats the active id or reuses an id that already finished. */
  begin(cue: CharacterCue): boolean {
    if (this.active?.id === cue.id) return false;
    if (this.active && !this.terminal.has(this.active.id)) this.finish(this.active.id, 'interrupted', `superseded by ${cue.id}`);
    this.active = cue;
    if (this.terminal.has(cue.id)) return false;
    if (!this.accepted.has(cue.id)) {
      this.accepted.add(cue.id);
      this.emit({ id: cue.id, state: 'accepted' });
    }
    return true;
  }

  acting(id: string) {
    if (this.terminal.has(id) || this.acted.has(id)) return;
    this.acted.add(id);
    this.emit({ id, state: 'acting' });
  }

  finish(id: string, state: Terminal, reason?: string) {
    if (this.terminal.has(id)) return false;
    this.terminal.add(id);
    this.emit(reason ? { id, state, reason } : { id, state });
    return true;
  }

  isFinished(id: string) {
    return this.terminal.has(id);
  }
}
