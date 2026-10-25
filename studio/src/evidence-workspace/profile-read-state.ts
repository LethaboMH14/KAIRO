import { collectArtifacts, type PracticeArtifact } from '../evidence/model.ts';

export type SavedPracticeReadState =
  | { status: 'loading' }
  | { status: 'ready'; artifacts: PracticeArtifact[] }
  | { status: 'unreadable' }
  | { status: 'unavailable' };

export const loadingSavedPractice: SavedPracticeReadState = { status: 'loading' };

/** Read without mutation; an empty artifact list is valid only after a successful profile read. */
export function readSavedPractice(read: () => unknown): Exclude<SavedPracticeReadState, { status: 'loading' }> {
  let profile: unknown;
  try {
    profile = read();
  } catch {
    return { status: 'unreadable' };
  }
  try {
    return { status: 'ready', artifacts: collectArtifacts(profile) };
  } catch {
    return { status: 'unavailable' };
  }
}
