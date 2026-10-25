"""In-memory local ZIP adversarial fixtures. No external skills or scripts are executed."""
import contextlib
import copy
import io
import json
from pathlib import Path
import stat
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import harness

REF = "0e181866f095b5f06d005133876e926515390d95"
TEXT = b"# Offline harmless SKILL fixture\n"


def make_zip(members=None, special=False):
    members = members if members is not None else {"SKILL.md": TEXT}
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in members.items():
            info = zipfile.ZipInfo(name)
            info.compress_type = zipfile.ZIP_DEFLATED
            if special:
                info.create_system = 3
                info.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(info, data)
    return output.getvalue()


def reviewed_entry(bundle):
    return {
        "id": "fixture-skill", "category": "test", "status": "approved",
        "source": {"repository": "CloudAI-X/threejs-skills", "ref": REF,
                   "path": "skills/threejs-fundamentals"},
        "license": {"spdx": "MIT", "evidence":
                    f"https://github.com/CloudAI-X/threejs-skills/blob/{REF}/LICENSE"},
        "compatibility": "Python 3.11+ local-only",
        "tests": ["safe synthetic content and adversarial fixtures"],
        "rollback": "verified isolated removal",
        "permissions": ["read-local-files", "write-isolated-sandbox"],
        "network": False, "budget_usd": 0,
        "approval": {"ticket": "ISSUE-14-TEST", "reviewer": "synthetic-test-review"},
        "artifact": {"sha256": harness.digest(bundle),
                     "files": {"SKILL.md": harness.digest(TEXT)}},
    }


class OfflineSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.workspace = base / "project"
        self.workspace.mkdir()
        self.bundle = base / "bundle.zip"
        self.bundle.write_bytes(make_zip())
        self.entry = reviewed_entry(self.bundle.read_bytes())
        self.registry_file = base / "registry.json"

    def run_command(self, action, ticket="ISSUE-14-TEST"):
        self.registry_file.write_text(json.dumps({"schema_version": 1,
                                                  "entries": [self.entry]}), encoding="utf-8")
        args = [action, "--registry", str(self.registry_file),
                "--workspace", str(self.workspace), "--id", "fixture-skill",
                "--bundle", str(self.bundle), "--ticket", ticket]
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return harness.main(args)

    def init(self):
        self.assertEqual(self.run_command("init"), 0)

    def test_offline_stage_verify_and_rollback(self):
        self.init()
        self.assertEqual(self.run_command("stage"), 0)
        self.assertEqual(self.run_command("verify"), 0)
        self.assertEqual(self.run_command("rollback"), 0)
        self.assertFalse((self.workspace / harness.BOX / "skills" / "fixture-skill").exists())

    def test_inventory_and_plan_are_read_only(self):
        self.assertEqual(self.run_command("inventory"), 0)
        self.assertEqual(self.run_command("plan"), 0)
        self.assertFalse((self.workspace / harness.BOX).exists())

    def test_reject_stage_before_sandbox_init(self):
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_proposed_without_approval(self):
        self.entry["status"] = "proposed"
        self.entry["approval"] = None
        self.entry["artifact"] = None
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_wrong_ticket(self):
        self.init()
        self.assertEqual(self.run_command("stage", "NOT-AUTHORIZED"), 2)

    def test_reject_changed_archive_hash(self):
        self.init()
        self.bundle.write_bytes(self.bundle.read_bytes() + b"changed")
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_changed_registry_hash(self):
        self.entry["artifact"]["sha256"] = "0" * 64
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_unauthorized_scripts(self):
        value = make_zip({"SKILL.md": TEXT, "install.sh": b"echo unsafe"})
        self.bundle.write_bytes(value)
        self.entry["artifact"]["sha256"] = harness.digest(value)
        self.entry["artifact"]["files"]["install.sh"] = harness.digest(b"echo unsafe")
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_path_escapes(self):
        self.init()
        for path in ("../outside.md", "/abs.md", "C:/drive.md",
                     "dir/../escape.md", "dir\\escape.md"):
            with self.subTest(path=path):
                value = make_zip({"SKILL.md": TEXT, path: b"danger"})
                self.bundle.write_bytes(value)
                self.entry["artifact"]["sha256"] = harness.digest(value)
                self.assertEqual(self.run_command("stage"), 2)

    def test_reject_zip_symlink(self):
        value = make_zip(special=True)
        self.bundle.write_bytes(value)
        self.entry["artifact"]["sha256"] = harness.digest(value)
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_symlink_sandbox(self):
        outside = Path(self.temp.name) / "outside"
        outside.mkdir()
        (self.workspace / harness.BOX).symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.run_command("init"), 2)

    def test_reject_zip_bomb_ratio(self):
        huge = b"x" * 300000
        value = make_zip({"SKILL.md": TEXT, "bomb.txt": huge})
        self.bundle.write_bytes(value)
        self.entry["artifact"]["sha256"] = harness.digest(value)
        self.entry["artifact"]["files"]["bomb.txt"] = harness.digest(huge)
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_stage_overwrite(self):
        self.init()
        self.assertEqual(self.run_command("stage"), 0)
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_tampered_stage_and_manifest(self):
        self.init()
        self.assertEqual(self.run_command("stage"), 0)
        target = self.workspace / harness.BOX / "skills" / "fixture-skill"
        (target / "SKILL.md").write_text("modified")
        self.assertEqual(self.run_command("verify"), 2)
        (target / "SKILL.md").write_bytes(TEXT)
        meta = target / harness.STATE
        record = json.loads(meta.read_text())
        record["files"]["SKILL.md"] = "0" * 64
        meta.write_text(json.dumps(record))
        self.assertEqual(self.run_command("verify"), 2)
        self.assertEqual(self.run_command("rollback"), 2)

    def test_reject_unapproved_permissions(self):
        self.entry["permissions"].append("execute-remote-shell")
        self.init()
        self.assertEqual(self.run_command("stage"), 2)

    def test_reject_unexpected_staged_file(self):
        self.init()
        self.assertEqual(self.run_command("stage"), 0)
        target = self.workspace / harness.BOX / "skills" / "fixture-skill"
        (target / "script.ps1").write_text("Invoke-Expression unsafe")
        self.assertEqual(self.run_command("verify"), 2)

    def test_reject_spoofed_licence_provenance(self):
        self.entry["license"]["evidence"] = (
            f"https://github.com/attacker/pretend/blob/{REF}/LICENSE")
        self.init()
        self.assertEqual(self.run_command("stage"), 2)



if __name__ == "__main__":
    unittest.main()
