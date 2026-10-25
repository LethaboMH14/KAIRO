#!/usr/bin/env node
/**
 * KAIRO Issue #8: explicitly opt-in, metadata-only GCP audit.
 * Never writes cloud state, prints raw cloud payloads or reads learner documents.
 * Requires externally established gcloud credentials and a reviewer-supplied project.
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ID = /^[a-z][a-z0-9-]{4,62}[a-z0-9]$/;
const REGION = /^[a-z]+(?:-[a-z0-9]+)+[0-9]$/;
const RESOURCE = /^[a-z][a-z0-9-]{0,62}$/;
const BUCKET = /^(?=.{3,222}$)[a-z0-9][a-z0-9._-]*[a-z0-9]$/;
const ARG_KEYS = new Set(['--live', '--project', '--region', '--service', '--queue', '--tasks-location', '--bucket', '--help']);

export function parseArgs(args) {
  const cfg = { live: false, project: null, region: null, service: null, queue: null, tasksLocation: null, bucket: null };
  const keyToProp = { '--project': 'project', '--region': 'region', '--service': 'service', '--queue': 'queue', '--tasks-location': 'tasksLocation', '--bucket': 'bucket' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!ARG_KEYS.has(a)) throw new Error('Unknown option (only explicitly listed audit options are allowed)');
    if (a === '--help') return { help: true };
    if (a === '--live') { if (cfg.live) throw new Error('Duplicate option'); cfg.live = true; continue; }
    const name = keyToProp[a];
    if (cfg[name] !== null || i + 1 >= args.length || args[i + 1].startsWith('--')) throw new Error('Missing or repeated option value');
    cfg[name] = args[++i];
  }
  for (const [k, regex] of [['project', ID], ['region', REGION], ['service', RESOURCE], ['queue', RESOURCE], ['tasksLocation', REGION], ['bucket', BUCKET]]) {
    if (cfg[k] !== null && !regex.test(cfg[k])) throw new Error(\`Invalid \${k} identifier\`);
  }
  if (cfg.bucket && (cfg.bucket.includes('..') || cfg.bucket.includes('.-') || cfg.bucket.includes('-.'))) throw new Error('Invalid bucket identifier');
  if (cfg.live && (!cfg.project || !cfg.region || !cfg.service)) throw new Error('--live requires --project, --region and --service');
  if (cfg.live && Boolean(cfg.queue) !== Boolean(cfg.tasksLocation)) throw new Error('Provide --queue and --tasks-location together');
  return cfg;
}

// Strict allowlist, with arguments assembled independently of any shell.
export function readOnlyCommands(c) {
  if (!c.live) return [];
  const common = [\`--project=\${c.project}\`, '--format=json'];
  const cmds = [
    ['auth', 'list', '--filter=status:ACTIVE', '--format=json'],
    ['run', 'services', 'describe', c.service, \`--region=\${c.region}\`, ...common],
    ['run', 'services', 'get-iam-policy', c.service, \`--region=\${c.region}\`, ...common],
    ['firestore', 'databases', 'describe', '--database=(default)', ...common],
  ];
  if (c.bucket) cmds.push(['storage', 'buckets', 'describe', \`gs://\${c.bucket}\`, ...common], ['storage', 'buckets', 'get-iam-policy', \`gs://\${c.bucket}\`, ...common]);
  if (c.queue) cmds.push(['tasks', 'queues', 'describe', c.queue, \`--location=\${c.tasksLocation}\`, ...common]);
  return cmds;
}

export function publicPrincipalSummary(policy) {
  if (!policy || !Array.isArray(policy.bindings)) return 'unknown';
  return policy.bindings.some(b => Array.isArray(b.members) && b.members.some(m => m === 'allUsers' || m === 'allAuthenticatedUsers'))
    ? 'present' : 'not-found-in-returned-policy';
}

export function summarize(kind, data) {
  if (kind === 'auth') return { authenticated: Array.isArray(data) && data.some(a => a.status === 'ACTIVE') };
  if (kind === 'run') return {
    readyRevision: typeof data?.status?.latestReadyRevisionName === 'string' ? data.status.latestReadyRevisionName : null,
    ingress: data?.metadata?.annotations?.['run.googleapis.com/ingress'] ?? data?.ingress ?? 'unknown',
    trafficAllocated: Array.isArray(data?.status?.traffic) ? data.status.traffic.map(t => Number(t.percent ?? 0)).filter(Number.isFinite) : null,
    note: 'Service metadata does not establish externally enforced IAM inheritance, load balancer access or Firebase tenant isolation.',
  };
  if (kind === 'runIam' || kind === 'bucketIam') return { publicPrincipal: publicPrincipalSummary(data), note: 'Only the returned resource-level policy was inspected; inherited permissions and other paths remain unverified.' };
  if (kind === 'firestore') return { location: data?.locationId ?? 'unknown', pitr: data?.pointInTimeRecoveryEnablement ?? 'unknown', note: 'Database metadata cannot establish private owner-scope correctness or backup restore success.' };
  if (kind === 'bucket') return {
    location: data?.location ?? 'unknown', publicAccessPrevention: data?.iamConfiguration?.publicAccessPrevention ?? 'unknown',
    uniformBucketLevelAccess: data?.iamConfiguration?.uniformBucketLevelAccess?.enabled ?? 'unknown',
    softDeleteDuration: data?.softDeletePolicy?.retentionDurationSeconds ?? 'unknown',
  };
  if (kind === 'queue') return { state: data?.state ?? 'unknown', note: 'Queue metadata does not validate worker OIDC audience or payload policies.' };
  throw new Error('Unknown audit command type');
}

function safeExec(argv) {
  const p = spawnSync('gcloud', argv, {
    shell: false, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024,
    env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
  });
  if (p.error || p.status !== 0) return { error: p.error?.code === 'ENOENT' ? 'gcloud-not-installed' : 'unavailable-or-permission-denied' };
  try { return { data: JSON.parse(p.stdout) }; } catch { return { error: 'invalid-json-output' }; }
}

export function audit(c, run = safeExec) {
  if (!c.live) return {
    mode: 'offline', projectAuthenticated: 'not-checked', cloudState: 'not-checked',
    permission: 'No cloud invocation made',
    next: 'Use --live with an approved existing gcloud login and explicit resource identifiers.',
  };
  const names = ['auth', 'run', 'runIam', 'firestore', ...(c.bucket ? ['bucket', 'bucketIam'] : []), ...(c.queue ? ['queue'] : [])];
  const result = { mode: 'read-only-live', cloudState: 'partially-inspected', checks: {} };
  const commands = readOnlyCommands(c);
  for (let i = 0; i < names.length; i++) {
    const raw = run(commands[i]);
    result.checks[names[i]] = raw.error ? { status: 'not-verified', reason: raw.error } : { status: 'observed', ...summarize(names[i], raw.data) };
    if (i === 0 && (raw.error || !result.checks.auth.authenticated)) {
      result.cloudState = 'not-checked';
      result.checks.remaining = { status: 'not-checked', reason: 'No confirmed active gcloud account' };
      break;
    }
  }
  result.remaining = ['Project-level inherited IAM and network ingress', 'Firebase Authentication and session isolation',
    'Firestore rule/data owner-scoping and backups/restore', 'Billing account, quotas, alerts, spend caps and invoices',
    'Build artifact provenance and deployment rollback rehearsal', 'Cloud logging content, retention and access'];
  return result;
}

export function main(args = process.argv.slice(2)) {
  try {
    const cfg = parseArgs(args);
    if (cfg.help) {
      process.stdout.write('Usage: node preflight.mjs [--live --project PROJECT --region REGION --service SERVICE [--bucket BUCKET] [--queue QUEUE --tasks-location REGION]]\nDefault: offline, zero cloud calls. --live: read-only metadata calls, which might be metered. Never run against private data without permission.\n');
      return 0;
    }
    const result = audit(cfg);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (e) {
    // Do not echo untrusted argv, cloud stderr, identifiers or credentials.
    process.stderr.write(\`Preflight argument/policy failure: \${e.message}\n\`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
