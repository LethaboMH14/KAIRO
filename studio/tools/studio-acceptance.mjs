#!/usr/bin/env node
/** Offline, evidence-labelled studio performance/accessibility acceptance check.
 * Does not open a browser/device, upload data or persist input. */
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA = 'kairo-studio-acceptance/v1';
export const CHECKS = Object.freeze(['reading', 'diagram', 'keyboard', 'reduceMotion', 'stopNarration', 'anchorParity']);
export const BUDGET = Object.freeze({ minFrames: 120, maxFrames: 12000, p95Ms: 50, stallMs: 250, maxSlowFraction: 0.2 });
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const label = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 120;

export function percentile(values, fraction) {
  if (!Array.isArray(values) || !values.length || !Number.isFinite(fraction) || fraction < 0 || fraction > 1)
    throw new TypeError('Percentile needs a nonempty array and a fraction between 0 and 1.');
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.every(x => typeof x === 'number' && Number.isFinite(x) && x > 0))
    throw new TypeError('Frame intervals must be finite positive numbers.');
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

export function auditAnchorRegistry(targets, viewbox) {
  const problems = [];
  if (!Array.isArray(targets) || !targets.length || !record(viewbox) ||
      ![viewbox.w, viewbox.h].every(n => Number.isFinite(n) && n > 0))
    return { ok: false, count: 0, problems: ['Missing target registry or valid diagram viewBox.'] };
  const ids = new Set(), qualified = new Set();
  for (const [i, target] of targets.entries()) {
    if (!record(target)) { problems.push('Target ' + i + ' is not an object.'); continue; }
    if (!label(target.id) || ids.has(target.id)) problems.push('Missing or repeated target ID at index ' + i + '.');
    else ids.add(target.id);
    if (target.qualifiedId !== 'pump-lab/' + target.id || qualified.has(target.qualifiedId))
      problems.push('Incorrect namespaced target anchor at index ' + i + '.');
    else qualified.add(target.qualifiedId);
    if (!label(target.label) || !label(target.role)) problems.push('Target ' + i + ' lacks readable label and role.');
    if (!Array.isArray(target.world) || target.world.length !== 3 || !target.world.every(Number.isFinite))
      problems.push('Target ' + i + ' lacks finite 3D anchor.');
    if (!Array.isArray(target.diagram) || target.diagram.length !== 2 || !target.diagram.every(Number.isFinite) ||
        target.diagram[0] < 0 || target.diagram[0] > viewbox.w || target.diagram[1] < 0 || target.diagram[1] > viewbox.h)
      problems.push('Target ' + i + ' lacks in-bounds 2D anchor.');
  }
  return { ok: !problems.length, count: targets.length, problems };
}

export function evaluateTrace(trace) {
  if (trace == null) return { status: 'UNMEASURED', reasons: ['No frame trace was supplied.'], metrics: null };
  if (!record(trace) || trace.schema !== SCHEMA) throw new TypeError('Expected ' + SCHEMA + '.');
  const allowed = new Set(['schema', 'sampleSource', 'studio', 'view', 'deviceClass', 'browser', 'capturedAt', 'sampling', 'framesMs', 'checks']);
  if (Object.keys(trace).some(key => !allowed.has(key)))
    throw new TypeError('Unknown trace fields: enter only approved anonymous measurement fields.');
  if (!['engineering', 'pump'].includes(trace.studio) || trace.view !== '3d')
    throw new TypeError('Trace studio must be engineering or pump and view must be 3d.');
  if (!['authorised-device', 'synthetic'].includes(trace.sampleSource) || trace.sampling !== 'requestAnimationFrame')
    throw new TypeError('Trace requires an explicit sample source and requestAnimationFrame intervals.');
  if (![trace.deviceClass, trace.browser, trace.capturedAt].every(label) || !Number.isFinite(Date.parse(trace.capturedAt)))
    throw new TypeError('Generic device class, browser and valid capture timestamp required.');
  if (!Array.isArray(trace.framesMs) || trace.framesMs.length < BUDGET.minFrames || trace.framesMs.length > BUDGET.maxFrames ||
      !trace.framesMs.every(n => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 60000))
    throw new TypeError('Requires 120-12000 finite positive frame intervals (<= 60000 ms).');
  if (!record(trace.checks) || Object.keys(trace.checks).some(key => !CHECKS.includes(key)) ||
      Object.values(trace.checks).some(v => !['pass','fail','not-tested'].includes(v)))
    throw new TypeError('Manual checks must use the declared checklist and pass/fail/not-tested states.');
  const missing = CHECKS.filter(k => !Object.hasOwn(trace.checks, k) || trace.checks[k] === 'not-tested');
  const failed = CHECKS.filter(k => trace.checks[k] === 'fail');
  const n = trace.framesMs.length;
  const slow = trace.framesMs.filter(ms => ms > BUDGET.p95Ms).length;
  const stalls = trace.framesMs.filter(ms => ms >= BUDGET.stallMs).length;
  const metrics = { count: n, p50Ms: percentile(trace.framesMs, .5), p95Ms: percentile(trace.framesMs, .95),
                    maxMs: Math.max(...trace.framesMs), slowFraction: slow/n, stalls };
  const reasons = [];
  if (metrics.p95Ms > BUDGET.p95Ms) reasons.push('p95 ' + metrics.p95Ms + ' ms exceeds ' + BUDGET.p95Ms + ' ms review budget.');
  if (metrics.slowFraction > BUDGET.maxSlowFraction) reasons.push('Slow-frame fraction exceeds 20% budget.');
  if (stalls) reasons.push(stalls + ' frame intervals were >= ' + BUDGET.stallMs + ' ms.');
  if (failed.length) reasons.push('Failed accessibility checks: ' + failed.join(', ') + '.');
  if (missing.length) reasons.push('Unverified accessibility checks: ' + missing.join(', ') + '.');
  const perfFailed = metrics.p95Ms > BUDGET.p95Ms || metrics.slowFraction > BUDGET.maxSlowFraction || stalls > 0;
  const status = trace.sampleSource === 'synthetic' ? 'SYNTHETIC_ONLY' :
    failed.length || perfFailed ? 'FAIL' : missing.length ? 'CHECKS_INCOMPLETE' : 'PASS_SELF_REPORTED';
  if (trace.sampleSource === 'synthetic') reasons.unshift('Synthetic trace is not device evidence.');
  if (status === 'PASS_SELF_REPORTED') reasons.push('Reported pass is manually supplied; it is not independently verified.');
  return { status, studio: trace.studio, deviceClass: trace.deviceClass, browser: trace.browser,
           capturedAt: trace.capturedAt, reasons, metrics };
}

export async function runCli(argv = process.argv.slice(2)) {
  const json = argv.includes('--json'), args = argv.filter(a => a !== '--json');
  if (args.includes('--help')) {
    console.log('Usage: node tools/studio-acceptance.mjs [--json] <anonymous-device-trace.json> | --anchors | --help');
    return 0;
  }
  try {
    let result;
    if (args.length === 1 && args[0] === '--anchors') {
      const { TARGETS, DIAGRAM_VIEWBOX } = await import('../src/pump-lab/layout.ts');
      const audit = auditAnchorRegistry(TARGETS, DIAGRAM_VIEWBOX);
      result = { status: audit.ok && audit.count === 16 ? 'PASS_STATIC_ANCHORS' : 'FAIL',
                 ...audit, note: 'Static source registry only; not proof of rendering or visual highlighting.' };
    } else if (args.length <= 1) {
      if (!args.length) result = evaluateTrace(null);
      else {
        const file = resolve(args[0]);
        if (statSync(file).size > 128*1024) throw new TypeError('Trace JSON must be at most 128 KiB.');
        result = evaluateTrace(JSON.parse(readFileSync(file, 'utf8')));
      }
    } else throw new TypeError('Expected one anonymous trace file or --anchors.');
    if (json) console.log(JSON.stringify(result, null, 2));
    else console.log(result.status + '\n' + (result.metrics ? JSON.stringify(result.metrics) + '\n' : '') +
      (result.reasons ?? result.problems ?? []).join('\n') + (result.note ? '\n' + result.note : ''));
    return ['PASS_SELF_REPORTED','PASS_STATIC_ANCHORS'].includes(result.status) ? 0 : result.status === 'FAIL' ? 1 : 2;
  } catch (error) {
    if (json) console.log(JSON.stringify({ status:'INVALID_EVIDENCE', error:String(error.message) }));
    else console.error('INVALID_EVIDENCE: ' + error.message);
    return 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = await runCli();
