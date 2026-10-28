/**
 * Read-only diagnostic for recurring nonfatal Vite dependency-scan warnings.
 * No CI gate is weakened, stderr is not suppressed and no application code runs.
 */
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const MAX_LOG_BYTES = 16 * 1024 * 1024;
const ANSI = /\x1b\[[0-?]*[ -/]*[@-~]/g;
const GITHUB_TIMESTAMP = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z\s*/;
const WARNING = 'Failed to run dependency scan.';

function cleanLine(line) {
  return line.replace(ANSI, '').replace(GITHUB_TIMESTAMP, '').trim();
}
function relativeEntry(line) {
  const match = line.match(/(?:^|\s)(?:[A-Za-z]:[\\/]|\/)[^\s]*?studio[\\/]((?:src[\\/])?[^\s]+\.html)(?:\s|$)/);
  return match ? 'studio/' + match[1].replaceAll('\\', '/') : null;
}
function summarize(lines) {
  const entries = [];
  let firstCause = null;
  let firstStackFunction = null;
  for (const line of lines.slice(0, 120)) {
    const entry = relativeEntry(line);
    if (entry && !entries.includes(entry)) entries.push(entry);
    if (!firstCause && /The server is being restarted or closed\. Request is outdated/.test(line)) {
      firstCause = 'The server is being restarted or closed. Request is outdated';
    } else if (!firstCause && /(?:\bError:|\[ERROR\])/.test(line) && !line.includes('Failed to scan for dependencies')) {
      firstCause = 'Other Vite dependency-scan error (inspect original CI log)';
    }
    if (!firstStackFunction) {
      const frame = line.match(/\bat\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (frame) firstStackFunction = frame[1];
    }
  }
  return { firstCause, firstStackFunction, entries: entries.slice(0, 20) };
}

export function analyzeViteScanLog(raw) {
  if (typeof raw !== 'string') throw new TypeError('A UTF-8 log string is required.');
  if (Buffer.byteLength(raw, 'utf8') > MAX_LOG_BYTES) throw new RangeError('Log exceeds 16 MiB limit.');
  const lines = raw.split(/\r?\n/).map(cleanLine);
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].includes(WARNING)) starts.push(i);
  if (!starts.length) return { schemaVersion: 1, warningCount: 0, classification: 'clean', first: null };
  const firstLines = lines.slice(starts[0], starts[1] ?? Math.min(lines.length, starts[0] + 120));
  const first = summarize(firstLines);
  return {
    schemaVersion: 1,
    warningCount: starts.length,
    classification: first.firstCause?.includes('server is being restarted or closed')
      ? 'closed-server-lifecycle-suspected' : 'other-scan-error',
    first,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = process.argv[2];
    if (process.argv.length > 3 || path?.startsWith('-')) throw new Error('Usage: node analyze.mjs [log-file] (or stdin)');
    if (path && (await stat(path)).size > MAX_LOG_BYTES) throw new RangeError('Log exceeds 16 MiB limit.');
    const input = path ? await readFile(path, 'utf8') : await new Promise((done, reject) => {
      const chunks = []; let bytes = 0;
      process.stdin.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > MAX_LOG_BYTES) { process.stdin.destroy(); reject(new RangeError('Log exceeds 16 MiB limit.')); }
        else chunks.push(chunk);
      });
      process.stdin.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
      process.stdin.on('error', reject);
    });
    process.stdout.write(JSON.stringify(analyzeViteScanLog(input), null, 2) + '\n');
  } catch (error) {
    process.stderr.write('vite-scan-diagnostics: ' + error.message + '\n');
    process.exitCode = 2;
  }
}
