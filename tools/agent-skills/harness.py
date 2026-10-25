#!/usr/bin/env python3
"""KAIRO offline-only, audited text-skill staging. Python 3.11+ standard library."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
BOX = ".kairo-agent-skills-sandbox"
MARKER = "ALLOW_KAIRO_SKILLS"
STATE = ".kairo-stage.json"
HEX40 = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
IDENT = re.compile(r"^[a-z][a-z0-9-]{1,47}$")
TICKET = re.compile(r"^[A-Z0-9][A-Z0-9._-]{3,79}$")
SUFFIXES = {".md", ".txt", ".json"}
PERMISSIONS = {"read-local-files", "write-isolated-sandbox"}
LICENCES = {"MIT", "Apache-2.0", "BSD-3-Clause", "MPL-2.0"}
MAX_FILES, MAX_FILE, MAX_TOTAL = 64, 2 * 1024 * 1024, 8 * 1024 * 1024


class Rejected(Exception):
    pass


def check(value, why):
    if not value:
        raise Rejected(why)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def safe_path(value):
    check(isinstance(value, str) and 0 < len(value) <= 240, "invalid path")
    check(not value.startswith("/") and "\\" not in value and "\0" not in value, "absolute/Windows path")
    check(not any(ord(c) < 32 or ord(c) == 127 for c in value), "control character in path")
    components = value.split("/")
    check(all(p not in ("", ".", "..") and not p.startswith(".") for p in components), "path escape/hidden path")
    for part in components:
        check(":" not in part and not part.endswith((" ", ".")), "unsafe Windows name")
        base = part.split(".")[0].upper()
        check(base not in {"CON", "AUX", "PRN", "NUL"} and
              not re.fullmatch(r"(COM|LPT)[1-9]", base), "reserved Windows name")
    return value


def json_file(path):
    try:
        check(path.is_file() and not path.is_symlink() and path.stat().st_size <= MAX_TOTAL, "invalid JSON file")
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeError) as error:
        raise Rejected(f"JSON read failure: {error}") from error
    check(isinstance(value, dict), "JSON object required")
    return value


def registry(path):
    data = json_file(path)
    check(data.get("schema_version") == 1 and isinstance(data.get("entries"), list), "registry schema")
    items = {}
    for entry in data["entries"]:
        check(isinstance(entry, dict), "invalid entry")
        ident = entry.get("id")
        check(isinstance(ident, str) and IDENT.fullmatch(ident), "invalid id")
        check(ident.casefold() not in items, "duplicate id")
        source = entry.get("source")
        check(isinstance(source, dict) and isinstance(source.get("repository"), str) and
              re.fullmatch(r"[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+", source["repository"]) and
              isinstance(source.get("ref"), str) and HEX40.fullmatch(source["ref"]), "un-pinned upstream")
        safe_path(source.get("path"))
        license_info = entry.get("license")
        check(isinstance(license_info, dict) and license_info.get("spdx") in LICENCES and
              isinstance(license_info.get("evidence"), str) and
              license_info["evidence"].startswith("https://github.com/") and
              source["ref"] in license_info["evidence"], "unverified licence provenance")
        check(entry.get("status") in ("proposed", "approved"), "invalid status")
        check(isinstance(entry.get("category"), str) and entry["category"] and
              isinstance(entry.get("compatibility"), str) and entry["compatibility"] and
              isinstance(entry.get("tests"), list) and bool(entry["tests"]) and
              isinstance(entry.get("rollback"), str) and entry["rollback"], "incomplete review metadata")
        check(isinstance(entry.get("permissions"), list) and
              all(isinstance(p, str) for p in entry["permissions"]) and
              isinstance(entry.get("network"), bool) and
              type(entry.get("budget_usd")) in (int, float) and entry["budget_usd"] >= 0, "invalid risk metadata")
        if entry["status"] == "approved":
            check(not entry["network"] and entry["budget_usd"] == 0 and
                  set(entry["permissions"]) <= PERMISSIONS, "unauthorized permissions, network or cost")
            approval, artifact = entry.get("approval"), entry.get("artifact")
            check(isinstance(approval, dict) and isinstance(approval.get("ticket"), str) and
                  TICKET.fullmatch(approval["ticket"]) and bool(approval.get("reviewer")), "missing reviewed ticket")
            check(isinstance(artifact, dict) and isinstance(artifact.get("sha256"), str) and
                  HEX64.fullmatch(artifact["sha256"]), "missing archive SHA256")
            files = artifact.get("files")
            check(isinstance(files, dict) and 1 <= len(files) <= MAX_FILES and "SKILL.md" in files,
                  "missing exact file manifest")
            for name, checksum in files.items():
                safe_path(name)
                check(Path(name).suffix.lower() in SUFFIXES and
                      isinstance(checksum, str) and HEX64.fullmatch(checksum), "script or bad file hash")
            check(len({f.casefold() for f in files}) == len(files), "manifest case collision")
        else:
            check(entry.get("approval") is None and entry.get("artifact") is None,
                  "proposal may not contain installable approval")
        items[ident.casefold()] = entry
    return {v["id"]: v for v in items.values()}


def reviewed(entry, ticket):
    check(entry["status"] == "approved", "not approved; proposal only")
    check(ticket == entry["approval"]["ticket"], "ticket mismatch")


def archive_files(path, entry):
    expected = entry["artifact"]["files"]
    check(path.is_file() and not path.is_symlink() and path.stat().st_size <= MAX_TOTAL, "invalid local ZIP")
    check(digest(path.read_bytes()) == entry["artifact"]["sha256"], "ZIP checksum mismatch")
    actual = {}
    try:
        with zipfile.ZipFile(path) as zip_stream:
            members = zip_stream.infolist()
            check(1 <= len(members) <= MAX_FILES and
                  len({m.filename.casefold() for m in members}) == len(members), "ZIP size/case collision")
            total = 0
            for member in members:
                name = safe_path(member.filename)
                check(not member.is_dir() and Path(name).suffix.lower() in SUFFIXES, "script/directory denied")
                mode = (member.external_attr >> 16) & 0o170000
                check(mode in (0, stat.S_IFREG) and member.flag_bits & 1 == 0,
                      "ZIP symlink, special or encrypted file")
                total += member.file_size
                check(member.file_size <= MAX_FILE and total <= MAX_TOTAL, "ZIP expansion exceeds limit")
                check(member.file_size == 0 or member.compress_size > 0 and
                      member.file_size <= member.compress_size * 200, "ZIP bomb ratio")
                check(name in expected, f"unlisted content {name}")
                content = zip_stream.read(member)
                check(digest(content) == expected[name], f"file SHA256 mismatch {name}")
                actual[name] = content
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile) as error:
        raise Rejected(f"invalid ZIP: {error}") from error
    check(set(actual) == set(expected), "missing manifest content")
    return actual


def directory(path, create=False):
    check(not path.is_symlink(), f"symlink directory denied: {path}")
    if path.exists():
        check(path.is_dir(), "expected directory")
    elif create:
        path.mkdir(mode=0o700)
    else:
        raise Rejected("sandbox not initialized")
    return path


def sandbox(workspace, create=False):
    directory(workspace)
    base = directory(workspace / BOX, create)
    marker = base / MARKER
    check(not marker.is_symlink(), "symlink marker")
    if create and not marker.exists():
        marker.write_text("KAIRO isolated skills v1\n", encoding="utf-8")
    check(marker.is_file() and marker.read_text(encoding="utf-8") ==
          "KAIRO isolated skills v1\n", "missing or invalid marker")
    return base


def stage(entry, workspace, bundle, ticket):
    reviewed(entry, ticket)
    contents = archive_files(bundle, entry)  # complete validation before writing
    target_root = directory(sandbox(workspace) / "skills", create=True)
    target = target_root / entry["id"]
    check(not target.exists() and not target.is_symlink(), "target already exists; no overwrite")
    temp = Path(tempfile.mkdtemp(prefix=".pending-", dir=target_root))
    try:
        for name, content in contents.items():
            dest = temp.joinpath(*name.split("/"))
            dest.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            dest.write_bytes(content)
        meta = {"schema_version": 1, "id": entry["id"], "source": entry["source"],
                "bundle_sha256": entry["artifact"]["sha256"], "files": entry["artifact"]["files"],
                "ticket": ticket}
        (temp / STATE).write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
        check(not target.exists() and not target.is_symlink(), "target appeared during stage")
        temp.rename(target)
    finally:
        if temp.exists():
            shutil.rmtree(temp)
    return target


def verify(entry, workspace):
    check(entry["status"] == "approved", "approval revoked")
    root = directory(sandbox(workspace) / "skills")
    target = root / entry["id"]
    check(target.is_dir() and not target.is_symlink(), "missing or symlinked stage")
    meta = json_file(target / STATE)
    check(meta.get("schema_version") == 1 and meta.get("id") == entry["id"] and
          meta.get("source") == entry["source"] and
          meta.get("bundle_sha256") == entry["artifact"]["sha256"] and
          meta.get("files") == entry["artifact"]["files"] and
          meta.get("ticket") == entry["approval"]["ticket"], "tampered stage manifest")
    found = set()
    for folder, dirs, names in os.walk(target, followlinks=False):
        for name in dirs:
            check(not (Path(folder) / name).is_symlink(), "directory symlink")
        for name in names:
            path = Path(folder) / name
            check(path.is_file() and not path.is_symlink(), "special or symlinked file")
            rel = path.relative_to(target).as_posix()
            if rel == STATE:
                continue
            check(rel in entry["artifact"]["files"], f"unexpected stage file {rel}")
            check(path.stat().st_size <= MAX_FILE and
                  digest(path.read_bytes()) == entry["artifact"]["files"][rel], f"tampered staged file {rel}")
            found.add(rel)
    check(found == set(entry["artifact"]["files"]), "missing staged file")
    return target


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("inventory", "plan", "init", "stage", "verify", "rollback"))
    parser.add_argument("--registry", type=Path, default=ROOT / "registry.v1.json")
    parser.add_argument("--workspace", type=Path)
    parser.add_argument("--id")
    parser.add_argument("--bundle", type=Path)
    parser.add_argument("--ticket")
    a = parser.parse_args(argv)
    try:
        items = registry(a.registry) if a.action != "init" else {}
        if a.action == "inventory":
            print(json.dumps([{"id": e["id"], "category": e["category"], "status": e["status"]}
                              for e in items.values()], indent=2))
            return 0
        if a.action != "init":
            check(a.id in items, "unknown skill ID")
            entry = items[a.id]
        if a.action == "plan":
            print(json.dumps({"id": a.id, "status": entry["status"],
                              "installable": entry["status"] == "approved",
                              "source": entry["source"], "permissions": entry["permissions"],
                              "network": entry["network"], "budget_usd": entry["budget_usd"]}, indent=2))
            return 0
        check(a.workspace is not None, "--workspace required")
        if a.action == "init":
            print(f"Initialized {sandbox(a.workspace, True)}")
        elif a.action == "stage":
            check(a.bundle is not None, "--bundle required")
            print(f"Staged inert content {stage(entry, a.workspace, a.bundle, a.ticket)}")
        else:
            path = verify(entry, a.workspace)
            if a.action == "rollback":
                shutil.rmtree(path)
                print(f"Rolled back {path}")
            else:
                print(f"Verified {path}")
        return 0
    except (Rejected, OSError) as error:
        print(f"DENIED: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
