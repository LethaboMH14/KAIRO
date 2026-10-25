import type { Profile } from './model';

export type ProfileReadState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'unreadable' };

export const loadingProfile: ProfileReadState = { status: 'loading' };

export function readProgressSnapshot(read: () => Profile): Exclude<ProfileReadState, { status: 'loading' }> {
  try {
    return { status: 'ready', profile: read() };
  } catch {
    return { status: 'unreadable' };
  }
}

export type PortfolioExportState =
  | { status: 'ready'; profile: Profile; markdown: string }
  | { status: 'unreadable' }
  | { status: 'failed'; profile: Profile };

/** Re-read at export time; never turn a read failure into an empty portfolio. */
export function preparePortfolioExport(read: () => Profile, serialize: (profile: Profile) => string): PortfolioExportState {
  let profile: Profile;
  try {
    profile = read();
  } catch {
    return { status: 'unreadable' };
  }
  try {
    return { status: 'ready', profile, markdown: serialize(profile) };
  } catch {
    return { status: 'failed', profile };
  }
}
