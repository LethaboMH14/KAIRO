import { escapePortfolioMarkdown } from '../portfolio-export/markdown-safety.ts';
import type { Lesson } from '../workspace/types';
import { portfolioMarkdown, type Profile } from '../profile/model.ts';
import { caseRecord, type CaseState } from './model.ts';

export type PracticePortfolioExport =
  | { status: 'ready'; markdown: string }
  | { status: 'unreadable' }
  | { status: 'failed' };

/** Build an export from saved history plus the current in-memory run, without writing profile storage. */
export function preparePracticePortfolioExport(
  read: () => Profile,
  currentRun: CaseState,
  lesson: Lesson | null,
): PracticePortfolioExport {
  let profile: Profile;
  try {
    profile = read();
  } catch {
    return { status: 'unreadable' };
  }

  try {
    const current = caseRecord(currentRun);
    const cases = [...profile.cases];
    const existingIndex = cases.findIndex(record => record.id === current.id);
    if (existingIndex >= 0) cases[existingIndex] = current;
    else cases.push(current);
    const portfolio = portfolioMarkdown({ ...profile, cases });
    const linkedSource = lesson
      ? `\n\n## Linked lesson principles\n\n${escapePortfolioMarkdown(lesson.title)}\nSource revision: ${escapePortfolioMarkdown(lesson.revision)}\n\n${lesson.evidence.map(e => `### ${escapePortfolioMarkdown(e.id)} — ${escapePortfolioMarkdown(e.title)}, ${escapePortfolioMarkdown(e.locator)}\n\n${escapePortfolioMarkdown(e.quote)}`).join('\n\n')}`
      : '\n\nStandalone authored training case; no uploaded source linked.';
    return { status: 'ready', markdown: portfolio + linkedSource };
  } catch {
    return { status: 'failed' };
  }
}
