import {learnerStorage} from '../account/storage.ts';
import { PROFILE_KEY } from '../profile/model.ts';

export const RAW_PROGRESS_RECOVERY_FORMAT = 'kairo-raw-progress-recovery-v1' as const;
export const RAW_PROGRESS_RECOVERY_FILENAME = 'KAIRO-raw-progress-recovery.json' as const;
export const MAX_RAW_PROGRESS_CHARACTERS = 1_000_000;
export const MAX_RAW_PROGRESS_RECOVERY_BYTES = 6_100_000;

export type RawProgressRecovery =
  | { status: 'ready'; content: string; characterCount: number; byteCount: number; filename: typeof RAW_PROGRESS_RECOVERY_FILENAME }
  | { status: 'missing' }
  | { status: 'unavailable' }
  | { status: 'too-large' };

/** Package the exact learnerStorage string without parsing, normalizing, repairing, or writing it. */
export function prepareRawProgressRecovery(storage?: Pick<Storage, 'getItem'>): RawProgressRecovery {
  try {
    const rawValue = storage ? storage.getItem(PROFILE_KEY) : learnerStorage.getItem(PROFILE_KEY);
    if (rawValue === null) return { status: 'missing' };
    if (rawValue.length > MAX_RAW_PROGRESS_CHARACTERS) return { status: 'too-large' };

    const content = JSON.stringify({
      format: RAW_PROGRESS_RECOVERY_FORMAT,
      storageKey: PROFILE_KEY,
      rawValue,
    });
    const byteCount = new TextEncoder().encode(content).byteLength;
    if (byteCount > MAX_RAW_PROGRESS_RECOVERY_BYTES) return { status: 'too-large' };
    return { status: 'ready', content, characterCount: rawValue.length, byteCount, filename: RAW_PROGRESS_RECOVERY_FILENAME };
  } catch {
    return { status: 'unavailable' };
  }
}
