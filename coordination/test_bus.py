"""Behaviour checks use temporary workspaces, never the real task queue."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name('bus.py')


class BusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for identifier in ('codex-test', 'claude-test'):
            self.run_bus('register', '--agent', identifier, '--client', identifier,
                         '--model', 'unknown', '--effort', 'unknown', '--focus', 'test')

    def command(self, *args):
        return [sys.executable, str(SCRIPT), '--workspace', str(self.root), *args]

    def run_bus(self, *args, ok=True):
        r = subprocess.run(self.command(*args), capture_output=True, text=True)
        self.assertEqual(r.returncode == 0, ok, r.stdout + r.stderr)
        return json.loads(r.stdout if ok else r.stderr)

    def task(self, identifier, scope):
        self.run_bus('task', '--agent', 'codex-test', '--task', identifier,
                     '--title', identifier, '--paths', scope)

    def claim(self, identifier, agent='codex-test', ok=True):
        return self.run_bus('claim', '--agent', agent, '--task', identifier, ok=ok)

    def test_parent_child_conflict_case_and_release(self):
        self.task('parent', 'src/Studio')
        self.task('child', 'src/studio/teacher.ts')
        self.claim('parent')
        self.claim('child', 'claude-test', ok=False)
        self.run_bus('release', '--agent', 'codex-test', '--task', 'parent', '--note', 'handoff')
        self.claim('child', 'claude-test')

    def test_parallel_claim_has_one_winner(self):
        self.task('one', 'src')
        self.task('two', 'src/model.ts')
        processes = [subprocess.Popen(self.command('claim', '--agent', owner, '--task', task),
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                     for owner, task in [('codex-test', 'one'), ('claude-test', 'two')]]
        outputs = [p.communicate(timeout=15) for p in processes]
        self.assertEqual(sorted(p.returncode for p in processes), [0, 1], outputs)

    def test_blocked_task_keeps_ownership(self):
        self.task('one', 'src')
        self.task('two', 'src/child')
        self.claim('one')
        self.run_bus('block', '--agent', 'codex-test', '--task', 'one', '--note', 'waiting')
        self.claim('two', 'claude-test', ok=False)
        self.run_bus('release', '--agent', 'claude-test', '--task', 'one', '--note', 'steal', ok=False)

    def test_evidence_completion_and_rollback(self):
        self.task('one', 'src')
        self.claim('one')
        self.run_bus('complete', '--agent', 'codex-test', '--task', 'one', '--note', 'done',
                     '--evidence', 'missing.md', ok=False)
        self.assertEqual(self.run_bus('status')['tasks'][0]['state'], 'active')
        (self.root / 'result.md').write_text('Actual test evidence', encoding='utf-8')
        self.run_bus('complete', '--agent', 'codex-test', '--task', 'one', '--note', 'done',
                     '--evidence', 'result.md')
        self.assertEqual(self.run_bus('status')['tasks'][0]['state'], 'complete')

    def test_paths_do_not_escape_and_root_conflicts(self):
        self.run_bus('task', '--agent', 'codex-test', '--task', 'bad', '--title', 'bad',
                     '--paths', '../outside', ok=False)
        self.task('root', '.')
        self.task('other', 'docs')
        self.claim('root')
        self.claim('other', 'claude-test', ok=False)

    def test_messages_cursor_and_registration(self):
        self.run_bus('message', '--agent', 'codex-test', '--to', 'all', '--body', 'contract ready')
        first = self.run_bus('inbox', '--agent', 'claude-test')['messages']
        self.assertEqual(first[0]['body'], 'contract ready')
        later = self.run_bus('inbox', '--agent', 'claude-test', '--after', str(first[0]['id']))
        self.assertEqual(later['messages'], [])
        self.run_bus('message', '--agent', 'missing', '--to', 'all', '--body', 'no', ok=False)


if __name__ == '__main__':
    unittest.main()
