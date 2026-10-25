"""Builds audit.json for task C1-ASSET-AUDIT. Read-only on the repo.

Hashes are computed here by code. Curated fields (author, licence, credit text)
are transcribed from the cited file and line; anything not recorded is None.
Run: python docs/claude-workstreams/asset-audit/build_audit.py
Writes: docs/claude-workstreams/asset-audit/audit.json and prints a Markdown table.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audit_hashes as h  # noqa: E402

ROOT = h.ROOT
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audit.json")


def present(rel):
    return os.path.isfile(os.path.join(ROOT, rel.replace("/", os.sep)))


def digest(rel):
    full = os.path.join(ROOT, rel.replace("/", os.sep))
    return {"bytes": os.path.getsize(full), "sha256": h.sha256(full)}


def check(label, rel, rec_sha, rec_bytes, rec_source):
    d = digest(rel)
    return {"label": label, "path": rel, "recorded_in": rec_source,
            "recorded_sha256": rec_sha, "recorded_bytes": rec_bytes,
            "bytes": d["bytes"], "sha256": d["sha256"],
            "sha256_matches": d["sha256"] == rec_sha,
            "bytes_match": None if rec_bytes is None else d["bytes"] == rec_bytes}


GOOGLE_TTS_GAP = "Generation account, date and terms of use for the output are not recorded in the repo; the Google Cloud TTS terms were not checked."

RUNTIME = [
    {
        "path": "studio/public/models/RobotExpressive.glb",
        "role": "animated temporary guide (studio/src/Scene.tsx:70)",
        "author": "Tomas Laulhe (Quaternius); glTF modifications by Don McCurdy",
        "source": "https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
        "licence": "CC0-1.0",
        "licence_evidence": "studio/public/models/RobotExpressive.README.md ('CC0 1.0'); assets/manifest.json",
        "attribution_required": False,
        "credit_in_app": [{"where": "studio/src/App.tsx:116 footer", "text": "Animated guide by Quaternius / Don McCurdy (CC0)"}],
        "gaps": [],
        "contradictions": ["App footer credits 'Quaternius / Don McCurdy'; the recorded author is Tomas Laulhe. Both names are in the record; the owner may want the wording aligned."],
    },
    {
        "path": "studio/public/models/classroom/classroom.glb",
        "role": "lecture room (studio/src/lecture/LectureScene.tsx:8)",
        "author": "Christophe Seux",
        "source": "https://www.blender.org/download/demo-files/ (classroom/provenance.json); assets/manifest.json lists https://download.blender.org/demo/test/classroom.zip for the reference zip",
        "licence": "CC0 (as recorded in classroom/provenance.json)",
        "licence_evidence": "Recorded only. The local assets/reference/classroom/ReadMe.txt has no licence statement, and the CC0 claim was not checked against the live source.",
        "attribution_required": False,
        "credit_in_app": [{"where": "studio/src/lecture/LectureStudio.tsx:45 footer", "text": "Classroom by Christophe Seux · CC0 · Converted from Blender for this preview (links to provenance.json)"}],
        "gaps": [
            "No manifest records a hash of the runtime GLB; assets/manifest.json records only the reference zip.",
            "The conversion script is not identified; provenance.json describes the steps only.",
            "The CC0 licence is recorded but not evidenced by any local licence file.",
        ],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/teacher/teacher.glb",
        "role": "/teacher rehearsal avatar (studio/src/avatar/AvatarStage.tsx)",
        "author": "Mika Suominen / met4citizen; created with Blender and MPFB",
        "source": "https://github.com/met4citizen/TalkingHead commit 2afe6d79779313db8909badebf46f9805a6c7b70, path avatars/mpfb.glb (teacher/provenance.json)",
        "licence": "CC0-1.0",
        "licence_evidence": "assets/reference/teacher/TalkingHead-README.md line 375: 'The avatar is licensed under CC0'. TalkingHead-LICENSE.txt (MIT) covers the code, not this avatar file.",
        "attribution_required": False,
        "credit_in_app": [{"where": "studio/src/avatar/AvatarStage.tsx (fine print)", "text": "CC0 MakeHuman/MPFB rehearsal character (the creator is not named in the app)"}],
        "gaps": [
            "The original mpfb.glb is not kept in the repo, so provenance.json sourceSha256 (63c645a2...) cannot be checked locally.",
            "The creator is not named in the app; CC0 does not require it, but the record names the creator.",
        ],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/engineering/induction-motor.glb",
        "role": "Engineering motor (studio/src/engineering/motorModel.ts:5)",
        "author": "KAIRO project; original geometry authored with Blender 4.5.14 via design/engineering/blender/build_motor.py",
        "source": "Original work (docs/engineering/asset-manifest.json)",
        "licence": "Project-owned original work (as recorded)",
        "licence_evidence": "docs/engineering/asset-manifest.json",
        "attribution_required": False,
        "credit_in_app": [],
        "gaps": [],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/engineering/poly_haven_studio_1k.hdr",
        "role": "Engineering environment light (studio/src/engineering/motorModel.ts:6)",
        "author": "Greg Zaal",
        "source": "https://polyhaven.com/a/poly_haven_studio (official download recorded in docs/engineering/asset-manifest.json)",
        "licence": "CC0 (https://polyhaven.com/license)",
        "licence_evidence": "docs/engineering/asset-manifest.json; coordination/briefs/ENGINEERING-REFERENCE-PACK/asset-manifest.json (verifiedAgainstMetadata MD5)",
        "attribution_required": False,
        "credit_in_app": [{"where": "studio/src/engineering/EngineeringStudio.tsx:489", "text": "Poly Haven Studio HDRI by Greg Zaal (CC0)"}],
        "gaps": ["The MD5 from Poly Haven metadata was not re-fetched in this audit (downloads not permitted); only the recorded value was compared."],
        "contradictions": [],
    },
    {
        "path": "studio/src/engineering/motorGeometry.json",
        "role": "generated data imported by Engineering Studio",
        "author": "KAIRO project (generated by build_motor.py)",
        "source": "Generated",
        "licence": "Project-owned generated data (as recorded)",
        "licence_evidence": "docs/engineering/asset-manifest.json",
        "attribution_required": False,
        "credit_in_app": [],
        "gaps": [],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/character/kairo-teacher.glb",
        "role": "CHARACTER-002 teacher, /character rehearsal (studio/src/character/Rehearsal.tsx). ACTIVE: being changed by claude-character-20261021-a; the hash is a snapshot at audit time.",
        "author": "Derived from Rain v3 (Blender Studio / Blender Foundation), KAIRO-restyled, per design/character/blender/rain_export.py and build_teacher.py docstrings",
        "source": "https://studio.blender.org/characters/rain/v3/ (link in Rehearsal.tsx:285)",
        "licence": "CC-BY 4.0 (as recorded in build_teacher.py, rain_export.py and the bus task CHARACTER-002)",
        "licence_evidence": "Recorded in code comments and the bus note only. The Rain v3 licence page was not fetched.",
        "attribution_required": True,
        "credit_in_app": [{"where": "studio/src/character/Rehearsal.tsx:285", "text": "Teacher based on Rain (CC-BY 4.0, Rain Rig (CC) Blender Foundation | studio.blender.org), reshaped, recoloured and restyled for KAIRO"}],
        "gaps": [
            "No provenance file or manifest entry exists for this GLB (docs/character is empty).",
            "The export mode that produced it (rain_export.py spike or full) is not recorded.",
            "The Rain credit appears on the rehearsal page only, not in the main footer (App.tsx:116) or the Sources & credits modal (App.tsx:119, not fully inspected).",
            "The Rain v3 source is present under assets/reference/claude-kit (rain-v3.zip and rain-inspection/), but neither is listed in assets/manifest.json.",
        ],
        "contradictions": ["Only code comments and the bus note state the CC-BY 4.0 licence; no manifest records it in machine-readable form."],
    },
    {
        "path": "studio/public/models/character/studio_small_09_1k.hdr",
        "role": "CHARACTER-002 lighting (studio/src/character/RehearsalStage.tsx:246)",
        "author": None,
        "source": None,
        "licence": None,
        "licence_evidence": None,
        "attribution_required": None,
        "credit_in_app": [],
        "gaps": [
            "No manifest, provenance or credit records the author, source or licence. The file name follows the Poly Haven pattern, but a name is not evidence; do not treat it as CC0 until recorded.",
            "An identical copy sits at assets/reference/claude-kit/studio_small_09_1k.hdr, also unrecorded.",
        ],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.mp3",
        "role": "pre-generated speech sample for CHARACTER-002",
        "author": None,
        "source": "Google Cloud Text-to-Speech Chirp 3 HD voice (named in the file name); generation record not in repo",
        "licence": None,
        "licence_evidence": None,
        "attribution_required": None,
        "credit_in_app": [],
        "gaps": [GOOGLE_TTS_GAP],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.mp3",
        "role": "pre-generated speech sample for CHARACTER-002",
        "author": None,
        "source": "Google Cloud Text-to-Speech Chirp 3 HD voice (named in the file name); generation record not in repo",
        "licence": None,
        "licence_evidence": None,
        "attribution_required": None,
        "credit_in_app": [],
        "gaps": [GOOGLE_TTS_GAP],
        "contradictions": [],
    },
    {
        "path": "studio/public/models/character/audio/en-US-Chirp3-HD-Kore.mp3",
        "role": "pre-generated speech sample for CHARACTER-002",
        "author": None,
        "source": "Google Cloud Text-to-Speech Chirp 3 HD voice (named in the file name); generation record not in repo",
        "licence": None,
        "licence_evidence": None,
        "attribution_required": None,
        "credit_in_app": [],
        "gaps": [GOOGLE_TTS_GAP],
        "contradictions": [],
    },
]
for voice in ["en-GB-Chirp3-HD-Aoede", "en-GB-Chirp3-HD-Puck", "en-US-Chirp3-HD-Kore"]:
    RUNTIME.append({
        "path": f"studio/public/models/character/audio/{voice}.visemes.json",
        "role": "viseme timing for the matching MP3",
        "author": None, "source": None, "licence": None, "licence_evidence": None,
        "attribution_required": None, "credit_in_app": [],
        "gaps": ["The generator tool and version are not recorded; treat as derived from the matching MP3."],
        "contradictions": [],
    })

# Provenance and documentation files that the app or manifests point to.
DOCS = [
    "studio/public/models/RobotExpressive.README.md",
    "studio/public/models/classroom/provenance.json",
    "studio/public/models/teacher/provenance.json",
    "studio/public/models/teacher/rig-report.json",
]

# Recorded hashes checked against the files they describe.
CHECKS = [
    check("RobotExpressive.glb vs assets/manifest.json", "studio/public/models/RobotExpressive.glb",
          "047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319", 463988, "assets/manifest.json"),
    check("induction-motor.glb vs docs/engineering manifest", "studio/public/models/engineering/induction-motor.glb",
          "3970e7add85b75feffe5fc3e79dcd41982a49033d216bef39102f8751f583ff8", 4213408, "docs/engineering/asset-manifest.json"),
    check("poly_haven_studio_1k.hdr (runtime) vs docs/engineering manifest", "studio/public/models/engineering/poly_haven_studio_1k.hdr",
          "dfc8505761018d644997a803f332339328af2b53e82023fb3bec37cefdf43b83", 1682195, "docs/engineering/asset-manifest.json"),
    check("motorGeometry.json vs docs/engineering manifest", "studio/src/engineering/motorGeometry.json",
          "6fbe144c740a7dff2acb16681c4a0658eec7feb8dd4cad8602a2f43903a81712", 71225, "docs/engineering/asset-manifest.json"),
    check("teacher.glb vs teacher/provenance.json preparedSha256", "studio/public/models/teacher/teacher.glb",
          "8d0f3728a91ccda99a40c39156d9d01a0aea274d4db82d618c3604c8ceefed58", None, "studio/public/models/teacher/provenance.json"),
    check("poly_haven_studio_1k.hdr (reference copy) vs briefs manifest", "assets/design-reference/engineering/poly_haven_studio_1k.hdr",
          "dfc8505761018d644997a803f332339328af2b53e82023fb3bec37cefdf43b83", 1682195, "coordination/briefs/ENGINEERING-REFERENCE-PACK/asset-manifest.json"),
    check("classroom.zip (reference) vs assets/manifest.json", "assets/reference/classroom.zip",
          "0f0ecc58d45f12b2f4272a53e2d8e69135518e16e956b118f10c20d8dcfdf5e6", 70279690, "assets/manifest.json"),
    check("build_motor.py vs docs/engineering authoringFiles", "design/engineering/blender/build_motor.py",
          "8d58f66d24f178c7bcf36c76e9d75266c517b5c711d0b65b5366f10d51dae018", 39026, "docs/engineering/asset-manifest.json"),
    check("engineering target PNG 01 vs briefs manifest", "assets/design-reference/engineering/01-engineering-studio-target.png",
          "ebf8be9e6bacc728774fdc86dedee7b6425934e4999203b557967f3848431e12", 2001422, "coordination/briefs/ENGINEERING-REFERENCE-PACK/asset-manifest.json"),
    check("engineering interactions PNG 02 vs briefs manifest", "assets/design-reference/engineering/02-engineering-interactions.png",
          "09a5d0a53506d70ad4c6ce62b2954781fdd7a205352c1327b01f0772fddd42c8", 2070765, "coordination/briefs/ENGINEERING-REFERENCE-PACK/asset-manifest.json"),
]

# Files cited by provenance or code that should exist.
CITED_FILES = [
    "tools/avatar/prepare_teacher.py",
    "design/engineering/blender/build_motor.py",
    "design/character/blender/rain_export.py",
    "design/character/blender/build_teacher.py",
    "assets/reference/claude-kit/rain-v3.zip",
    "assets/reference/claude-kit/studio_small_09_1k.hdr",
    "assets/reference/teacher/TalkingHead-README.md",
    "assets/reference/classroom/ReadMe.txt",
]

REFERENCE_EXTRA = [
    "assets/reference/claude-kit/rain-v3.zip",
    "assets/reference/claude-kit/mpfb-v2.0.18.zip",
    "assets/reference/claude-kit/quaternius-base-standard.zip",
    "assets/reference/claude-kit/human-base-meshes-v1.4.1.zip",
    "assets/reference/claude-kit/ellie-pose-library-v2.0.0.zip",
    "assets/reference/claude-kit/autumn_field_puresky_1k.hdr",
    "assets/reference/claude-kit/studio_small_09_1k.hdr",
    "assets/reference/classroom/ReadMe.txt",
    "assets/generated/kairo-voice-check.mp3",
]


def main():
    runtime = []
    for item in RUNTIME:
        rel = item["path"]
        d = digest(rel)
        out = dict(item)
        out.update({"present": present(rel), "bytes": d["bytes"], "sha256": d["sha256"]})
        runtime.append(out)
    docs = [dict(path=p, **digest(p)) for p in DOCS]
    cited = [{"path": p, "present": present(p)} for p in CITED_FILES]
    reference = [dict(path=p, **digest(p)) for p in REFERENCE_EXTRA]
    hdr_md5 = h.md5(os.path.join(ROOT, "studio/public/models/engineering/poly_haven_studio_1k.hdr"))
    result = {
        "task": "C1-ASSET-AUDIT",
        "scope": "docs/claude-workstreams/asset-audit only; read-only on runtime assets, manifests and code; no downloads",
        "hashes_computed_by": "docs/claude-workstreams/asset-audit/audit_hashes.py and build_audit.py (hashlib SHA-256, MD5)",
        "character_snapshot_note": "studio/public/models/character/** is being changed by CHARACTER-002; hashes are a snapshot at audit time and may already be stale.",
        "runtime_assets": runtime,
        "provenance_docs": docs,
        "record_checks": CHECKS,
        "cited_files_present": cited,
        "reference_files": reference,
        "engineering_hdr_md5": {"computed": hdr_md5, "recorded": "a1065f613cb6e0388d82a99dcee23d3b",
                                "matches": hdr_md5 == "a1065f613cb6e0388d82a99dcee23d3b"},
        "not_in_any_manifest": [
            "studio/public/models/character/** (kairo-teacher.glb, studio_small_09_1k.hdr, audio, visemes)",
            "studio/public/models/classroom/classroom.glb (its provenance.json records no hash)",
            "assets/reference/claude-kit/* (Rain v3, MPFB, Quaternius, Ellie, human base meshes, HDRIs)",
            "assets/generated/kairo-voice-check.mp3",
        ],
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("| Runtime file | Bytes | SHA-256 | Record matches |")
    print("|---|---:|---|---|")
    for r in runtime:
        m = "no record"
        for c in CHECKS:
            if c["path"] == r["path"]:
                m = "yes" if c["sha256_matches"] else "NO"
        print(f"| `{r['path']}` | {r['bytes']} | `{r['sha256']}` | {m} |")
    print("CHECKS:")
    for c in CHECKS:
        print(c["label"], c["sha256_matches"], c["bytes_match"])
    print("CITED missing:", [c["path"] for c in cited if not c["present"]])
    print("REF:")
    for r in reference:
        print(r["path"], r["bytes"], r["sha256"])


if __name__ == "__main__":
    main()
