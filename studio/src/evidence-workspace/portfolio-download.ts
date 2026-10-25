import { buildPortfolioExport, portfolioHtml, portfolioJson } from '../portfolio-export/model.ts';

export function portfolioDownloadMessage(rejectedCount: number): string {
  if (!Number.isInteger(rejectedCount) || rejectedCount < 0) throw new Error('Rejected item count must be a nonnegative integer.');
  const suffix = rejectedCount ? ` ${rejectedCount} incomplete or invalid record${rejectedCount === 1 ? '' : 's'} were not included; the file lists their positions.` : '';
  return `Download requested. Check your browser downloads.${suffix} These are local, self-reported records and remain unverified.`;
}

export function preparePortfolioDownloads(profile: unknown, activeWorksim?: unknown) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Saved progress is not a supported profile. Your records were not changed.');
  const p = profile as Record<string, unknown>;
  if (p.version !== 1 || !Array.isArray(p.cases) || p.cases.length > 20) throw new Error('Saved progress could not be read as version 1. Your records were not changed.');
  const worksimRuns = activeWorksim === undefined ? [] : [activeWorksim];
  const portfolio = buildPortfolioExport({ practiceCases: p.cases, worksimRuns });
  if (!portfolio) throw new Error('This portfolio exceeds the supported size or item limit. Nothing was downloaded.');
  if (!portfolio.items.length && !portfolio.rejected.practiceCases.length && !portfolio.rejected.worksimRuns.length) {
    throw new Error('There are no saved cases or current simulation attempts to export yet.');
  }
  return {
    portfolio,
    json: portfolioJson(portfolio),
    html: portfolioHtml(portfolio),
    rejectedCount: portfolio.rejected.practiceCases.length + portfolio.rejected.worksimRuns.length,
  };
}
