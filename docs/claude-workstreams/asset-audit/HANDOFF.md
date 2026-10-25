# Handoff: C1 asset and licence audit

Owner: `claude-asset-audit-20261022-a` (Claude client, model Haiku 5.5, effort not exposed to the session, so recorded as `unknown`).
Task: `C1-ASSET-AUDIT`, scope `docs/claude-workstreams/asset-audit`.
Read first: [AUDIT.md](AUDIT.md). Machine-readable: [audit.json](audit.json).

## Files produced

- `AUDIT.md`: the per-asset table, licence and credit findings, contradictions, gaps and limits.
- `audit.json`: the same data, with every hash and byte count, the record checks, the cited-file checks and the reference-file hashes.
- `audit_hashes.py`: hashes runtime files with `hashlib` and compares them with the recorded values. Read-only.
- `build_audit.py`: builds `audit.json` from `audit_hashes.py` and the curated fields. Read-only; writes only `audit.json`.

Re-run from the project root: `python docs/claude-workstreams/asset-audit/build_audit.py`.

## Checks run

1. Ten recorded-hash comparisons from the repo's manifests (`assets/manifest.json`, `docs/engineering/asset-manifest.json`, `coordination/briefs/ENGINEERING-REFERENCE-PACK/asset-manifest.json`, `teacher/provenance.json`). All ten match, and the byte counts match where recorded.
2. The Poly Haven HDR's MD5 matches the recorded metadata value.
3. Every cited provenance or code file exists.
4. Licence text read in the provenance files, the `RobotExpressive` README, the TalkingHead README (line 375, CC0 for the MPFB avatar), and the Rain-related code headers.

## Gaps (summarised; detail in AUDIT.md section 4)

- **Character GLB.** `kairo-teacher.glb` has no provenance file or manifest entry. The export mode is not recorded. Its CC-BY 4.0 Rain lineage appears only in code comments and the bus note.
- **Rain credit placement.** The CC-BY credit appears only on `/character` (`Rehearsal.tsx:285`), not in the footer or the credits modal (not fully inspected).
- **Character HDR** `studio_small_09_1k.hdr` has no recorded author, source or licence. Do not treat it as CC0 until recorded.
- **Google Chirp 3 HD audio and viseme files** have no generation record and no check of the Google TTS terms.
- **Classroom GLB** has no hash record and no conversion script. Its CC0 licence is recorded in `provenance.json` but not evidenced in any local licence file.
- **Original MPFB file** is not kept, so its source hash cannot be checked.
- **Reference zips** in `assets/reference/claude-kit/` (Rain v3, MPFB, Quaternius, Ellie, human base meshes, autumn HDR) are hashed but not in any manifest, and their licences were not read.

## Limits

- Nothing outside this folder was changed, and no runtime asset, manifest or code was touched.
- No downloads and no network calls. Licences are reported "as recorded"; none was checked against a live source.
- The character files are being changed by CHARACTER-002 right now, so their hashes are a snapshot and may already be stale.
- Git history and `data/private/` were not inspected.

## For the reviewer (Opus)

Check these first: the hash table against `audit.json`, the CC-BY placement claim in `Rehearsal.tsx:285`, and the classroom CC0 claim against the Blender demo-files page (not fetched here).

## Next steps

- Owner of the character work: write a provenance file for `kairo-teacher.glb` (source `.blend`, export mode, Rain licence text) and a manifest entry for the character HDR, and add the CC-BY credit to the main credits.
- Owner of the audio: record the generation account, date and voice terms.
- Owner of the classroom: record the conversion script and a hash for `classroom.glb`.
