import React from 'react';
import './extraction-coverage.css';

type Unit = { locator: string; status: 'text'|'ocr'|'needs-review'|'skipped'; reason?: string };
type Coverage = { schemaVersion: 1; units: Unit[]; warnings: string[]; visualUnderstanding: false };

export default function ExtractionCoverage({coverage}: {coverage: unknown}) {
  const value = coverage && typeof coverage === 'object' ? coverage as Partial<Coverage> : null;
  const units = Array.isArray(value?.units) ? value.units.filter((unit): unit is Unit =>
    !!unit && typeof unit === 'object' && typeof unit.locator === 'string' &&
    ['text','ocr','needs-review','skipped'].includes(unit.status)) : [];
  const warnings = Array.isArray(value?.warnings) ? value.warnings.filter((item): item is string => typeof item === 'string') : [];
  const known = value?.schemaVersion === 1 && Array.isArray(value.units);
  const label: Record<Unit['status'], string> = {text:'Text extracted',ocr:'OCR preview', 'needs-review':'Needs review', skipped:'Not checked'};

  return <section className="extraction-coverage" aria-labelledby="extraction-coverage-title">
    <h2 id="extraction-coverage-title">What KAIRO could read</h2>
    {!known || units.length === 0 ? <p className="extraction-coverage__unknown">Page-by-page coverage is not available. Check the full original before relying on this preview.</p> : <ul>
      {units.map((unit, index) => <li key={`${unit.locator}-${index}`}>
        <span className={`extraction-coverage__status extraction-coverage__status--${unit.status}`}>{label[unit.status]}</span>
        <span>{unit.locator}</span>
        {unit.reason && <span className="extraction-coverage__reason">{unit.reason}</span>}
      </li>)}
    </ul>}
    {warnings.length > 0 && <ul className="extraction-coverage__warnings">{warnings.map((warning,index)=><li key={`${index}-${warning}`}>{warning}</li>)}</ul>}
    <p className="extraction-coverage__limit">This is text extraction and OCR coverage, not visual or semantic understanding. Compare the preview with your original.</p>
  </section>;
}
