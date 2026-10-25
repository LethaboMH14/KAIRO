import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';

export function createTraceEngine() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE lessons (id INTEGER PRIMARY KEY, title TEXT NOT NULL, topic TEXT NOT NULL);
    INSERT INTO lessons VALUES
    (1, 'A request meets a database', 'database'),
    (2, 'Why parameterized queries matter', 'database'),
    (3, 'Following a Python function', 'python'),
    (4, 'Inside an HTTP response', 'network');`);
  const sql = 'SELECT id, title, topic FROM lessons WHERE topic = ? ORDER BY id';
  return {
    close: () => db.close(),
    run(topic) {
      if (typeof topic !== 'string' || topic.length < 1 || topic.length > 80) {
        throw new TypeError('Choose a topic between 1 and 80 characters.');
      }
      const begin = performance.now();
      const validated = performance.now();
      const rows = db.prepare(sql).all(topic);
      const queried = performance.now();
      const response = JSON.stringify(rows);
      const serialized = performance.now();
      return {
        rows, sql, parameters: [topic], durationMs: serialized - begin,
        provenance: 'Real parameterized query on the local demo SQLite database. No cloud database is used.',
        trace: [
          { stage: 'interface', label: 'Request received', durationMs: 0,
            detail: `The browser sent topic=${topic} to POST /api/trace.` },
          { stage: 'api', label: 'Input validated', durationMs: validated - begin,
            detail: 'The API checked the input type and length before using it as a query parameter.' },
          { stage: 'database', label: 'SQLite query executed', durationMs: queried - validated,
            detail: `SQLite returned ${rows.length} matching lesson${rows.length === 1 ? '' : 's'}.` },
          { stage: 'response', label: 'Response prepared', durationMs: serialized - queried,
            detail: `${Buffer.byteLength(response)} bytes of row data serialized to JSON for the browser.` },
        ],
      };
    },
  };
}
