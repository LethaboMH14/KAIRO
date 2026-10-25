import { useId } from 'react';
import './extraction-summary.css';

export type ExtractionSummaryData = {
  schemaVersion: 1;
  discoveredUnits: number | null;
  attemptedUnits: number;
  completedUnits: number;
  reviewSections: number;
  reviewCharacters: number;
  omittedReviewCharacters: number;
  skippedCount: number;
  failureCount: number;
  warnings: string[];
};

export type ExtractionSummaryProps = { report: ExtractionSummaryData };

const number = (value: number) => new Intl.NumberFormat().format(value);

export default function ExtractionSummary({ report }: ExtractionSummaryProps) {
  const titleId = `kes-title-${useId()}`;
  const hasIssues = report.skippedCount > 0 || report.failureCount > 0 || report.omittedReviewCharacters > 0 || report.warnings.length > 0;
  const discovered = report.discoveredUnits === null ? 'Unknown' : number(report.discoveredUnits);

  return (
    <section className="kes-summary" aria-labelledby={titleId}>
      <p className="kes-kicker">Source check</p>
      <h2 id={titleId}>What KAIRO could read</h2>
      <p className="kes-intro">This is a processing summary. Extracted text still needs your review before it can support a lesson.</p>
      <dl className="kes-counts">
        <div><dt>Items found</dt><dd>{discovered}</dd></div>
        <div><dt>Items tried</dt><dd>{number(report.attemptedUnits)}</dd></div>
        <div><dt>Text extracted</dt><dd>{number(report.completedUnits)}</dd></div>
        <div><dt>Sections ready for your review</dt><dd>{number(report.reviewSections)}</dd></div>
        <div><dt>Characters ready for review</dt><dd>{number(report.reviewCharacters)}</dd></div>
      </dl>
      <p className="kes-review-note">Ready for review does not mean checked, understood or correct.</p>
      {hasIssues && (
        <div className="kes-issues">
          {report.skippedCount > 0 && <p>{number(report.skippedCount)} reported skip{report.skippedCount === 1 ? '' : 's'}.</p>}
          {report.failureCount > 0 && <p>{number(report.failureCount)} extraction failure{report.failureCount === 1 ? '' : 's'}.</p>}
          {report.omittedReviewCharacters > 0 && <p>{number(report.omittedReviewCharacters)} extracted characters could not be included for review.</p>}
          {report.warnings.length > 0 && (
            <details>
              <summary>{number(report.warnings.length)} processing warning{report.warnings.length === 1 ? '' : 's'}</summary>
              <ul>{report.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul>
            </details>
          )}
        </div>
      )}
      <p className="kes-coverage-note">Images, diagrams and scanned text may need a separate check.</p>
    </section>
  );
}
