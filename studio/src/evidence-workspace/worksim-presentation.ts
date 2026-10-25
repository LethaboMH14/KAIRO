import type { WorkSimExport, Revision, SourceRow } from '../worksim/model';

export function decisionOptions(_revision: Revision) {
  return _revision === 'shift-close-v1' ? [
    { label: 'Retain · latest row for ticket', value: 'retain|latest-for-ticket' },
    { label: 'Exclude · superseded duplicate', value: 'exclude|superseded-duplicate' },
    { label: 'Quarantine · missing timestamp', value: 'quarantine|missing-timestamp' },
  ] : [
    { label: 'Retain · eligible latest row', value: 'retain|eligible-latest' },
    { label: 'Exclude · superseded duplicate', value: 'exclude|superseded-duplicate' },
    { label: 'Quarantine · missing timestamp', value: 'quarantine|missing-timestamp' },
    { label: 'Exclude · reopened latest row', value: 'exclude|reopened-latest' },
    { label: 'Exclude · after cutoff', value: 'exclude|after-cutoff' },
    { label: 'Exclude · unverified', value: 'exclude|unverified' },
    { label: 'Exclude · missing resolution code', value: 'exclude|missing-resolution-code' },
  ];
}

export function decisionOptionsForRow(revision: Revision, _row: SourceRow) {
  return decisionOptions(revision);
}

export function workSimMarkdown(artifact: WorkSimExport) {
  const unknown = artifact.unknownAssistanceAttempts;
  const reported = artifact.reportedAssistance;
  return `# ${artifact.title}\n\nStatus: ${artifact.status}\nSource: ${artifact.source}\nScenario version: ${artifact.scenarioVersion}\nRun ID: ${artifact.runId}\nCompleted: ${artifact.completedAt}\nScored-attempt assistance: ${artifact.assistanceExposure}\nUnknown exposure attempts: ${unknown}\nReported support: ${reported.join(', ') || 'none recorded'} (learner-reported)\n\n## Rubric checks\n\n${artifact.rubric.map(check => `- ${check.key}: ${check.attempts} attempts; first try ${check.firstTry ? 'met' : 'not met'}; latest ${check.latestMet ? 'met' : 'not met'}`).join('\n')}\n\n## Recorded attempt trail\n\n${artifact.attempts.map(event => `- ${event.at}: ${event.kind}: ${event.value}${event.correct === undefined ? '' : event.correct ? ' (scenario check met)' : ' (retry needed)'}; assistance exposure: ${event.assistanceExposure} (self-reported)`).join('\n')}\n\n## Reflection\n\n${artifact.reflection}\n\n## Limitations\n\n${artifact.limitations.map(limit => `- ${limit}`).join('\n')}\n`;
}
