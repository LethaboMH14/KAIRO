"""Local, cooperative Codex/Claude task bus. Python standard library only."""
import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path


def now():
    return datetime.now(timezone.utc).isoformat()


def scoped(root, value):
    path = Path(value)
    if path.is_absolute() or '..' in path.parts or not value.strip():
        raise ValueError('Use a nonempty workspace-relative path without ..')
    resolved = (root / path).resolve()
    try:
        relative = resolved.relative_to(root).as_posix()
    except ValueError:
        raise ValueError('Path resolves outside the workspace') from None
    return relative.casefold()


def overlap(a, b):
    return a == '.' or b == '.' or a == b or a.startswith(b + '/') or b.startswith(a + '/')


def connect(root):
    directory = root / 'coordination'
    directory.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(directory / 'bus.sqlite3', timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS agents(
        id TEXT PRIMARY KEY, client TEXT NOT NULL, model TEXT NOT NULL,
        effort TEXT NOT NULL, focus TEXT NOT NULL, seen TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS tasks(
        id TEXT PRIMARY KEY, title TEXT NOT NULL, scopes TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'open', owner TEXT REFERENCES agents(id),
        note TEXT NOT NULL DEFAULT '', evidence TEXT NOT NULL DEFAULT '[]',
        updated TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY, sender TEXT NOT NULL REFERENCES agents(id),
        recipient TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events(
        id INTEGER PRIMARY KEY, actor TEXT NOT NULL, kind TEXT NOT NULL,
        detail TEXT NOT NULL, created TEXT NOT NULL);
    ''')
    return db


def event(db, actor, kind, detail):
    db.execute('INSERT INTO events(actor,kind,detail,created) VALUES(?,?,?,?)',
               (actor, kind, json.dumps(detail), now()))


def agent(db, identifier):
    if not db.execute('SELECT 1 FROM agents WHERE id=?', (identifier,)).fetchone():
        raise ValueError('Register your unique session agent ID first')


def task(db, identifier):
    row = db.execute('SELECT * FROM tasks WHERE id=?', (identifier,)).fetchone()
    if row is None:
        raise ValueError('Unknown task ID')
    return row


def execute(args):
    root = Path(args.workspace).resolve()
    db = connect(root)
    try:
        db.execute('BEGIN IMMEDIATE')
        cmd = args.command
        result = {'ok': True, 'command': cmd}
        if cmd == 'register':
            db.execute('''INSERT INTO agents VALUES(?,?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET client=excluded.client,
                model=excluded.model,effort=excluded.effort,
                focus=excluded.focus,seen=excluded.seen''',
                (args.agent, args.client, args.model, args.effort, args.focus, now()))
            event(db, args.agent, cmd, {'model': args.model, 'effort': args.effort})
        elif cmd == 'status':
            result.update(agents=[dict(r) for r in db.execute('SELECT * FROM agents ORDER BY id')],
                          tasks=[dict(r) for r in db.execute('SELECT * FROM tasks ORDER BY id')])
        elif cmd == 'events':
            result['events'] = [dict(r) for r in db.execute(
                'SELECT * FROM events WHERE id>? ORDER BY id LIMIT 100', (args.after,))]
        else:
            agent(db, args.agent)
            db.execute('UPDATE agents SET seen=? WHERE id=?', (now(), args.agent))
            if cmd == 'task':
                scopes = sorted(set(scoped(root, p) for p in args.paths))
                db.execute('INSERT INTO tasks(id,title,scopes,updated) VALUES(?,?,?,?)',
                           (args.task, args.title, json.dumps(scopes), now()))
                event(db, args.agent, cmd, {'task': args.task, 'scopes': scopes})
            elif cmd == 'claim':
                row = task(db, args.task)
                if row['state'] != 'open':
                    raise ValueError('Task is not open; ownership cannot be stolen')
                scopes = [scoped(root, p) for p in json.loads(row['scopes'])]
                for active in db.execute("SELECT * FROM tasks WHERE state IN ('active','blocked')"):
                    active_scopes = [scoped(root, p) for p in json.loads(active['scopes'])]
                    if any(overlap(a, b) for a in scopes for b in active_scopes):
                        raise ValueError(f"Scope conflicts with {active['id']} owned by {active['owner']}")
                db.execute("UPDATE tasks SET state='active',owner=?,updated=? WHERE id=?",
                           (args.agent, now(), args.task))
                event(db, args.agent, cmd, {'task': args.task})
            elif cmd in ('update', 'block', 'release', 'complete'):
                row = task(db, args.task)
                if row['owner'] != args.agent or row['state'] not in ('active', 'blocked'):
                    raise ValueError('Only the active owner can update, release or complete this task')
                state = {'update': 'active', 'block': 'blocked', 'release': 'open',
                         'complete': 'complete'}[cmd]
                evidence = []
                if cmd == 'complete':
                    for p in args.evidence:
                        scoped(root, p)
                        if not (root / p).resolve().is_file():
                            raise ValueError('Completion requires existing evidence files')
                        evidence.append(Path(p).as_posix())
                owner = None if cmd == 'release' else args.agent
                db.execute('UPDATE tasks SET state=?,owner=?,note=?,evidence=?,updated=? WHERE id=?',
                           (state, owner, args.note, json.dumps(evidence), now(), args.task))
                event(db, args.agent, cmd, {'task': args.task, 'note': args.note, 'evidence': evidence})
            elif cmd == 'message':
                if args.to != 'all':
                    agent(db, args.to)
                cursor = db.execute('INSERT INTO messages(sender,recipient,body,created) VALUES(?,?,?,?)',
                                    (args.agent, args.to, args.body, now()))
                result['message_id'] = cursor.lastrowid
                event(db, args.agent, cmd, {'to': args.to, 'id': cursor.lastrowid})
            elif cmd == 'inbox':
                result['messages'] = [dict(r) for r in db.execute(
                    "SELECT * FROM messages WHERE id>? AND recipient IN (?, 'all') ORDER BY id LIMIT 100",
                    (args.after, args.agent))]
            elif cmd == 'heartbeat':
                event(db, args.agent, cmd, {'focus': args.focus})
                db.execute('UPDATE agents SET focus=? WHERE id=?', (args.focus, args.agent))
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--workspace', default=str(Path(__file__).resolve().parents[1]),
                   help='Canonical shared checkout root; override only for isolated tests')
    sub = p.add_subparsers(dest='command', required=True)
    register = sub.add_parser('register')
    register.add_argument('--agent', required=True)
    register.add_argument('--client', required=True)
    register.add_argument('--model', required=True, help='Use unknown if not exposed')
    register.add_argument('--effort', required=True, help='Use unknown if not exposed')
    register.add_argument('--focus', required=True)
    sub.add_parser('status')
    history = sub.add_parser('events')
    history.add_argument('--after', type=int, default=0)
    for name in ('task', 'claim', 'update', 'block', 'release', 'complete',
                 'message', 'inbox', 'heartbeat'):
        c = sub.add_parser(name)
        c.add_argument('--agent', required=True)
        if name in ('task', 'claim', 'update', 'block', 'release', 'complete'):
            c.add_argument('--task', required=True)
        if name == 'task':
            c.add_argument('--title', required=True)
            c.add_argument('--paths', nargs='+', required=True,
                           help='Relative files or subtrees reserved before edits')
        if name in ('update', 'block', 'release', 'complete'):
            c.add_argument('--note', required=True)
        if name == 'complete':
            c.add_argument('--evidence', nargs='+', required=True)
        if name == 'message':
            c.add_argument('--to', required=True)
            c.add_argument('--body', required=True)
        if name == 'inbox':
            c.add_argument('--after', type=int, default=0)
        if name == 'heartbeat':
            c.add_argument('--focus', required=True)
    return p


if __name__ == '__main__':
    try:
        print(json.dumps(execute(parser().parse_args()), indent=2))
    except (ValueError, sqlite3.Error, OSError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}), file=sys.stderr)
        sys.exit(1)
