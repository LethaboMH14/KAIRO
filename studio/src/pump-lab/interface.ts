// PUMP LAB published interface, proposal for root review. Nothing outside
// studio/src/pump-lab imports or mounts this yet; see docs/pump-lab/INTERFACE.md.
//
//   Entry:         default export of ./PumpLab.tsx, props = PumpLabEntryProps
//   Scene targets: TARGETS / resolveAnchor (./layout.ts), IDs "pump-lab/<id>"
//   Evidence:      PumpLabEvidenceItem and PumpLabReport (./report.ts)
//   Context:       teacherContext (./readout.ts), state only, never the hidden fault

import type { ReactNode } from 'react';
import type { CaseId } from './cases.ts';
import type { PumpLabEvidenceItem, PumpLabReport } from './report.ts';
import type { TargetId } from './layout.ts';
import type { TeacherContext } from './readout.ts';

export const PUMP_LAB_INTERFACE_VERSION = 'kairo-pump-lab-interface/1' as const;

/** How the room is shown. "auto" picks 3D when WebGL and motion allow it and falls back to the diagram. */
export type PumpLabView = 'auto' | '3d' | 'diagram' | 'reading';

export type PumpLabEntryProps = {
  /** Back to the studio picker. Required, matching EngineeringStudio's onExit contract. */
  onExit: () => void;
  /** Host-owned teaching UI, beside the experiment/task; no hidden fault is exposed. */
  teachingPanel?: ReactNode;
  exitLabel?: string;
  /** Start in this case. Ignored when `snapshot` restores a session. Default: first case. */
  caseId?: CaseId;
  /** Stable ID for evidence. Default: generated once per mount. */
  sessionId?: string;
  /** Unsigned 32-bit seed for the instrument noise. Default: derived from sessionId. */
  seed?: number;
  /** A string from onSnapshot. If it fails validation the lab starts fresh and says so. */
  snapshot?: string | null;
  view?: PumpLabView;
  /** Called with the serialized session after every accepted action. Persist however the shell chooses. */
  onSnapshot?: (serialized: string) => void;
  /** Called when the learner exports. `practiceCompleted` is false for an unfinished run. */
  onEvidence?: (item: PumpLabEvidenceItem, report: PumpLabReport) => void;
  /** Called when the learner selects or clears a part, with its qualified ID, for teacher context. */
  onContext?: (context: TeacherContext) => void;
  /** Controlled highlight, for a teacher pointing at a part. Unknown IDs are ignored. */
  highlightTarget?: TargetId | null;
  /** Clock injection for tests and replays. Default: new Date().toISOString(). */
  now?: () => string;
};

export type { CaseId, PumpLabEvidenceItem, PumpLabReport, TargetId, TeacherContext };
