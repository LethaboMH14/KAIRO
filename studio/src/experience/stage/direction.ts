// Lesson events -> what Rain does and where the camera looks. Pure; ExperienceClassroom owns the lesson state and
// a future shared session director can call direct() with the same events. Rain's gestures here are teaching
// gestures (point, nod, listen); none of them is sign language.
import type { Expression } from '../../character/types.ts';
import { boardAnchorFor, lineAnchor, pointAnchorFor } from './board.ts';

export type Framing = 'room' | 'board' | 'teacher';
export type Pose = 'idle' | 'listen' | 'explain' | 'acknowledge';

/** One instruction for the stage. A new `id` interrupts anything the stage is still doing for the previous one. */
export type StageDirection = {
  id: string;
  pose: Pose;
  /** classroom-board/1 anchor or 'shelf' to point at, while `pose` sets the body posture underneath. */
  point: string | null;
  /** Board anchor drawn with a copper ring (the reading equivalent of the point). */
  highlight: string | null;
  expression: Expression;
  framing: Framing;
  /** False for the step and speech-state directions, which must not cut short the board writing they accompany. */
  interrupts: boolean;
};

export type LessonEvent =
  | { type: 'enter' }
  | { type: 'explain'; value: number; step: number }
  | { type: 'step'; step: number }
  | { type: 'stuck'; step: number }
  | { type: 'question'; focused: boolean }
  | { type: 'answer'; correct: boolean; step: number };

const base = (id: string): StageDirection => ({ id, pose: 'idle', point: null, highlight: null, expression: 'neutral', framing: 'room', interrupts: true });

export function direct(event: LessonEvent, seq: number): StageDirection {
  const id = `${event.type}-${seq}`;
  switch (event.type) {
    case 'enter':
      return base(id);
    case 'explain': {
      const point = pointAnchorFor(event.value, event.step);
      return { ...base(id), pose: 'explain', point, highlight: boardAnchorFor(event.value, event.step),
        framing: point === 'shelf' ? 'room' : 'board' };
    }
    case 'step':
      // The stage runs its own writing sequence for a new step; this is the posture it returns to.
      return { ...base(id), pose: 'explain', highlight: lineAnchor(event.step), framing: 'board', interrupts: false };
    case 'stuck':
      // Stop, nod calmly at the learner (a wide grin reads wrong when someone is stuck) and mark the line the smaller
      // step is about; the acknowledge overlay adds a gentle smile and raised brows to the neutral face.
      return { ...base(id), pose: 'acknowledge', expression: 'neutral', highlight: lineAnchor(event.step), framing: 'teacher' };
    case 'question':
      return event.focused ? { ...base(id), pose: 'listen', expression: 'curious', framing: 'teacher' } : base(id);
    case 'answer':
      return event.correct
        ? { ...base(id), pose: 'acknowledge', expression: 'encouraging', highlight: boardAnchorFor(23, event.step), framing: 'teacher' }
        : { ...base(id), pose: 'explain', point: boardAnchorFor(20, event.step), highlight: boardAnchorFor(20, event.step), framing: 'board' };
  }
}

/** Speech starting or stopping keeps what Rain is showing: she explains while pointing at the number she is
 *  talking about, then lowers her arm when the voice stops; the board highlight and framing stay for reading. */
export function speaking(prev: StageDirection, isSpeaking: boolean, seq: number): StageDirection {
  const id = `speaking-${seq}`;
  return isSpeaking
    ? { ...prev, id, pose: 'explain', interrupts: false }
    : { ...prev, id, pose: 'idle', point: null, expression: 'neutral', interrupts: false };
}

/** Camera framing actually used: reduced motion keeps one fixed view so the room never moves on its own. */
export function framingFor(direction: StageDirection, writing: boolean, reducedMotion: boolean): Framing {
  if (reducedMotion) return 'room';
  return writing ? 'board' : direction.framing;
}
