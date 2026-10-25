import { useId } from 'react';
import { validateArtifactPanelV1, type ArtifactPanelErrorCode, type ArtifactPanelV1 } from '../artifact-panel/contract.ts';
import './static-artifact-view.css';

export type StaticArtifactViewProps = { input: unknown };

const unavailableReasons: Record<ArtifactPanelErrorCode, string> = {
  'invalid-object': 'The saved item has an invalid data shape.',
  'unknown-field': 'The saved item contains unsupported fields.',
  'missing-field': 'The saved item is missing required information.',
  'invalid-schema-version': 'This saved item version is not supported.',
  'invalid-identifier': 'A saved item identifier is invalid.',
  'invalid-title': 'The saved item title is invalid.',
  'invalid-kind-payload': 'The saved item type does not match its content.',
  'invalid-provenance': 'The claimed source details are invalid.',
  'invalid-text': 'The saved text is invalid.',
  'invalid-table': 'The saved table shape is invalid.',
  'limit-exceeded': 'The saved item exceeds the display limits.',
  'serialization-failed': 'The saved item could not be prepared for display.',
};

function ClaimedProvenance({ artifact }: { artifact: ArtifactPanelV1 }) {
  const { provenance } = artifact;
  const details: Array<[string, string | number | undefined]> = [
    ['Source ID', provenance.sourceId],
    ['Source revision', provenance.sourceRevision],
    ['Page', provenance.page],
    ['Label', provenance.label],
  ];
  const present = details.filter((entry): entry is [string, string | number] => entry[1] !== undefined);
  if (present.length === 0) return null;

  return (
    <aside className="sav-provenance" aria-label="Claimed source details — not verified">
      <h3>Claimed source details <span>Not verified</span></h3>
      <dl>
        {present.map(([label, value]) => (
          <div className="sav-provenance-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function ValidArtifact({ artifact }: { artifact: ArtifactPanelV1 }) {
  return (
    <>
      {artifact.kind === 'text' ? (
        <div className="sav-text" data-testid="artifact-text">{artifact.payload.text}</div>
      ) : (
        <div className="sav-table-scroll" role="region" tabIndex={0} aria-label={`Scrollable table: ${artifact.title}`}>
          <table className="sav-table">
            <caption>{artifact.title}</caption>
            <thead>
              <tr>{artifact.payload.columns.map((column, index) => <th scope="col" key={`column-${index}`}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {artifact.payload.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, columnIndex) => <td key={`cell-${rowIndex}-${columnIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ClaimedProvenance artifact={artifact} />
    </>
  );
}

export default function StaticArtifactView({ input }: StaticArtifactViewProps) {
  const titleId = `static-artifact-title-${useId()}`;
  const result = validateArtifactPanelV1(input);

  if (!result.ok) {
    return (
      <section className="sav-panel" aria-labelledby={titleId}>
        <p className="sav-kicker">Saved practice</p>
        <h2 id={titleId}>Artifact unavailable</h2>
        <p className="sav-unavailable" role="status">{unavailableReasons[result.code]}</p>
      </section>
    );
  }

  return (
    <section className="sav-panel" aria-labelledby={titleId}>
      <p className="sav-kicker">Saved practice · {result.artifact.kind}</p>
      <h2 id={titleId}>{result.artifact.title}</h2>
      <ValidArtifact artifact={result.artifact} />
    </section>
  );
}
