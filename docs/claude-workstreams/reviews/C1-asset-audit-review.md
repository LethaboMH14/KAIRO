# Review of C1 asset and licence audit

Reviewer: claude-engineering-20261021-a (Opus 5.5, effort unknown). Task REVIEW-C1-C3, 22-23 October 2026.
Reviewed: `docs/claude-workstreams/asset-audit/` (AUDIT.md, HANDOFF.md, audit.json, audit_hashes.py, build_audit.py), owner claude-asset-audit-20261022-a (Haiku 5.5).
Gate: Opus review gate in `coordination/roadmap/CLAUDE-DELEGATION.md` (read actual files, rerun checks, challenge assumptions, reject fabricated evidence).

## Verdict: accepted, with six owner actions

No fabricated evidence found. Every hash I recomputed matched, the gaps are reported honestly, and no claim goes beyond its quoted source. The audit is a snapshot, and one asset has already moved on.

## What I rechecked

| Check | Method | Result |
|---|---|---|
| 14 runtime asset hashes and sizes | `Get-FileHash` SHA-256 and file length in PowerShell, independent of the owner's Python | 13 of 14 identical. `kairo-teacher.glb` differs (below). |
| 10 record checks (file hash vs the hash recorded in a manifest) | Read each manifest value myself (`assets/manifest.json`, `docs/engineering/asset-manifest.json`, the reference-pack manifest, `teacher/provenance.json` `preparedSha256`), then compared with my hash | 10 of 10 reproduce. |
| Engineering HDR md5 | Poly Haven API `api.polyhaven.com/files/poly_haven_studio` | md5 a1065f61…3b, size 1682195: matches the audit. |
| Inventory completeness | Listed `studio/public` and `studio/src` assets against `audit.json` | Complete at audit time. One newer file is unrecorded (G1 below). |
| Evidence quotes | Opened each cited file and found the quoted text | All present. Cited line numbers have drifted (EngineeringStudio 489 to 547, Rehearsal 285 to 298). Cite by text, not line. |

## Where the audit is now stale

- `studio/public/models/character/kairo-teacher.glb` was rebuilt by CHARACTER-002 after the audit. Audit: 2935540 B, sha 0724545f…. Now 3424844 B, sha 5c3aacb1…ee6af (it was 3392004 B earlier today, so it is still changing). The audit disclosed the character files as a snapshot, so this is not an error, but nothing should cite the old hash.
- New since the audit: `studio/public/models/character/teacher-portrait.png` (1263220 B). No provenance record.

## Gaps: what I could close from outside evidence, and what stays open

The owner could not source these from the repo. I checked the primary sources.

| Gap | Finding |
|---|---|
| G2 Rain licence | Closed. studio.blender.org lists CC-BY 4.0 (link to creativecommons.org/licenses/by/4.0/); credit line "Rain Rig (CC) Blender Foundation \| studio.blender.org". |
| G3 character HDR | Closed. Poly Haven "Studio Small 09" by Sergej Majboroda. The API md5 (d5d7eb9d26d341d6aa4d11c1a54fd97c) and size (1615248) match the file exactly. Poly Haven states "Our assets are all licensed as CC0". |
| G5 Classroom | Closed. blender.org demo files page: "By Christophe Seux", "(CC0, 72 MB)". |
| G7 engineering HDR | Closed. API md5 and size match (above). |
| G1 teacher provenance | Open, owner action. Needs a `kairo-teacher.glb` provenance file (inputs, tool, hash) and one for the portrait PNG. |
| G4 voice and visemes | Open, owner action. The three Chirp 3 HD clips and viseme JSON have no generation record (voice, date, script, tool) and the Google Cloud terms for redistribution were not read. |
| G6 MPFB original | Open. The original `mpfb.glb` was not kept, so the character's base-mesh licence cannot be re-verified from a file. |
| G8 reference zips | Open. Reference zips are in no manifest. |

## Defects and repairs

1. **Stale hash risk** (minor). Anyone using `audit.json` as a manifest will fail the teacher check. Repair: regenerate after CHARACTER-002 settles, or add a "valid at" line to AUDIT.md. Owner action.
2. **Line-number citations** (minor). Replace by quoted text. Owner action.
3. **Rain credit travels with the asset** (integration risk). The credit is shown only on `/character`. If Rain is reused elsewhere the CC-BY credit must come with it. Flag for Codex at integration.
4. **Closed gaps G2, G3, G5 and G7 are not yet in the owners' manifests.** Record them there; this review is not a manifest.

## Limits of this review

I did not open the character files themselves, re-derive the MPFB lineage, read Google's terms, or confirm the CC licences with a lawyer. Licence conclusions are quoted from the sites above, fetched 22 October 2026, and can change.

## Evidence

`docs/claude-workstreams/asset-audit/audit.json` (compared), PowerShell hashes run on 22-23 October 2026, Poly Haven API responses. No script of mine is saved for C1: the checks are single commands against the files named above.
