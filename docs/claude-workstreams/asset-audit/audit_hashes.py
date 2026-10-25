"""Read-only C1 asset audit: hash runtime files and compare with recorded values.

Reads only. Writes nothing except the JSON printed to stdout.
Usage: python docs/claude-workstreams/asset-audit/audit_hashes.py > audit_raw.json
"""
import hashlib
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

RUNTIME = [
    "studio/public/models/RobotExpressive.glb",
    "studio/public/models/RobotExpressive.README.md",
    "studio/public/models/classroom/classroom.glb",
    "studio/public/models/classroom/provenance.json",
    "studio/public/models/teacher/teacher.glb",
    "studio/public/models/teacher/provenance.json",
    "studio/public/models/teacher/rig-report.json",
    "studio/public/models/engineering/induction-motor.glb",
    "studio/public/models/engineering/poly_haven_studio_1k.hdr",
    "studio/src/engineering/motorGeometry.json",
    "studio/public/models/character/kairo-teacher.glb",
    "studio/public/models/character/studio_small_09_1k.hdr",
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.mp3",
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.visemes.json",
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.mp3",
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.visemes.json",
    "studio/public/models/character/audio/en-US-Chirp3-HD-Kore.mp3",
    "studio/public/models/character/audio/en-US-Chirp3-HD-Kore.visemes.json",
]

# Same-named or same-content copies elsewhere in the repo, used to detect provenance links.
COPIES = {
    "studio/public/models/engineering/poly_haven_studio_1k.hdr": [
        "assets/design-reference/engineering/poly_haven_studio_1k.hdr"],
    "studio/public/models/character/studio_small_09_1k.hdr": [
        "assets/reference/claude-kit/studio_small_09_1k.hdr"],
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.mp3": [
        "assets/reference/teacher/en-GB-Chirp3-HD-Aoede.mp3"],
    "studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.mp3": [
        "assets/reference/teacher/en-GB-Chirp3-HD-Puck.mp3"],
    "studio/public/models/character/audio/en-US-Chirp3-HD-Kore.mp3": [
        "assets/reference/teacher/en-US-Chirp3-HD-Kore.mp3"],
}

# Hashes as recorded in the repo's own manifests (quoted from the files; None = no record).
RECORDED = {
    "studio/public/models/RobotExpressive.glb": ("assets/manifest.json", "047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319", 463988),
    "studio/public/models/engineering/induction-motor.glb": ("docs/engineering/asset-manifest.json", "3970e7add85b75feffe5fc3e79dcd41982a49033d216bef39102f8751f583ff8", 4213408),
    "studio/public/models/engineering/poly_haven_studio_1k.hdr": ("docs/engineering/asset-manifest.json", "dfc8505761018d644997a803f332339328af2b53e82023fb3bec37cefdf43b83", 1682195),
    "studio/src/engineering/motorGeometry.json": ("docs/engineering/asset-manifest.json", "6fbe144c740a7dff2acb16681c4a0658eec7feb8dd4cad8602a2f43903a81712", 71225),
    "studio/public/models/teacher/teacher.glb": ("studio/public/models/teacher/provenance.json (preparedSha256)", "8d0f3728a91ccda99a40c39156d9d01a0aea274d4db82d618c3604c8ceefed58", None),
}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def entry(rel):
    full = os.path.join(ROOT, rel.replace("/", os.sep))
    if not os.path.isfile(full):
        return {"path": rel, "present": False}
    out = {"path": rel, "present": True, "bytes": os.path.getsize(full), "sha256": sha256(full)}
    if rel in RECORDED:
        src, rec_hash, rec_bytes = RECORDED[rel]
        out["recorded"] = {"source": src, "sha256": rec_hash, "bytes": rec_bytes}
        out["sha256_matches_record"] = out["sha256"] == rec_hash
        out["bytes_match_record"] = None if rec_bytes is None else out["bytes"] == rec_bytes
    else:
        out["recorded"] = None
    copies = []
    for c in COPIES.get(rel, []):
        cf = os.path.join(ROOT, c.replace("/", os.sep))
        if os.path.isfile(cf):
            copies.append({"path": c, "sha256": sha256(cf), "same_sha256": sha256(cf) == out["sha256"]})
    out["copies"] = copies
    return out


def main():
    report = {"runtime": [entry(p) for p in RUNTIME]}
    # MD5 check for the HDR against the Poly Haven metadata value recorded in docs/engineering/asset-manifest.json.
    hdr = os.path.join(ROOT, "studio/public/models/engineering/poly_haven_studio_1k.hdr")
    report["engineering_hdr_md5"] = {"computed": md5(hdr), "recorded": "a1065f613cb6e0388d82a99dcee23d3b",
                                     "matches": md5(hdr) == "a1065f613cb6e0388d82a99dcee23d3b"}
    json.dump(report, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
