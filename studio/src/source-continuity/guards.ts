export type SourceSelection = { pages: readonly { text: string }[] } | null;

export function hasUnsavedSourceText(source: SourceSelection, edits: readonly string[]): boolean {
  if (!source) return false;
  if (source.pages.length !== edits.length) return true;
  return edits.some((text, index) => text !== source.pages[index].text);
}

export function hasUnsavedPaste(title: string, paste: string): boolean {
  return title.trim().length > 0 || paste.trim().length > 0;
}

export type RequestResult<T> = { status: 'value'; value: T } | { status: 'error'; error: unknown } | { status: 'stale' };

export type PasteDraft = { title: string; paste: string };
export type CommittableSource = {
  pages: readonly { text: string }[];
  reviewedPages?: readonly { text: string }[];
  reviewed: boolean;
};

export type SourceCommit<T extends CommittableSource> = {
  source: T;
  texts: string[];
  title: string;
  paste: string;
  confirmed: boolean;
  reading: boolean;
};

/** Project a current successful request into workspace state without consuming newer drafts. */
export function sourceCommitFromResult<T extends CommittableSource>(
  result: RequestResult<T>,
  currentDraft: PasteDraft,
  options: { preservePaste?: boolean; consumedPaste?: PasteDraft } = {},
): SourceCommit<T> | null {
  if (result.status !== 'value') return null;
  const captured = options.consumedPaste;
  const consume = !options.preservePaste && captured !== undefined &&
    currentDraft.title === captured.title && currentDraft.paste === captured.paste;
  const source = result.value;
  return {
    source,
    texts: (source.reviewedPages || source.pages).map((page) => page.text),
    title: consume ? '' : currentDraft.title,
    paste: consume ? '' : currentDraft.paste,
    confirmed: source.reviewed,
    reading: source.reviewed,
  };
}

export function applyGoalEdit<T>(
  gate: ReturnType<typeof createRequestGate>,
  current: { goal: string; created: T | null },
  goal: string,
): { goal: string; created: T | null } {
  if (goal === current.goal) return current;
  gate.invalidate();
  return { goal, created: null };
}

export function createRequestGate() {
  let generation = 0;
  return {
    begin(): number { return ++generation; },
    invalidate(): void { generation++; },
    isCurrent(ticket: number): boolean { return ticket === generation; },
  };
}

/** Settles a request only while its selection/source identity remains current. */
export async function requestLatest<T>(
  gate: ReturnType<typeof createRequestGate>,
  load: () => Promise<T>,
): Promise<RequestResult<T>> {
  const ticket = gate.begin();
  try {
    const value = await load();
    return gate.isCurrent(ticket) ? { status: 'value', value } : { status: 'stale' };
  } catch (error) {
    return gate.isCurrent(ticket) ? { status: 'error', error } : { status: 'stale' };
  }
}
