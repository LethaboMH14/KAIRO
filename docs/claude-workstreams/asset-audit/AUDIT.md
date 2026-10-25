# C1 asset and licence audit

Task: `C1-ASSET-AUDIT` (owner `claude-asset-audit-20261022-a`, model Haiku 5.5, effort unknown).
Scope: `docs/claude-workstreams/asset-audit/` only. Read-only on runtime assets, manifests and code. No downloads.
Machine-readable form: [audit.json](audit.json). Hashes are computed by code: [audit_hashes.py](audit_hashes.py) and [build_audit.py](build_audit.py).

The character files under `studio/public/models/character/**` are being changed by CHARACTER-002 right now. Their hashes below are a snapshot and may already be stale.

## 1. Runtime assets

Hashes are SHA-256 of the file as it is in the repo at audit time. "Record" is the hash written in a repo manifest or provenance file.

| Runtime file | Bytes | SHA-256 | Record |
|---|---:|---|---|
| `studio/public/models/RobotExpressive.glb` | 463988 | `047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319` | matches `assets/manifest.json` |
| `studio/public/models/classroom/classroom.glb` | 15346684 | `99e4b7dc61aed85fa463e568857ac755ee1bcda0751338d478a78faa92af06ae` | none (see gaps) |
| `studio/public/models/teacher/teacher.glb` | 11262664 | `8d0f3728a91ccda99a40c39156d9d01a0aea274d4db82d618c3604c8ceefed58` | matches `teacher/provenance.json` preparedSha256 |
| `studio/public/models/engineering/induction-motor.glb` | 4213408 | `3970e7add85b75feffe5fc3e79dcd41982a49033d216bef39102f8751f583ff8` | matches `docs/engineering/asset-manifest.json` |
| `studio/public/models/engineering/poly_haven_studio_1k.hdr` | 1682195 | `dfc8505761018d644997a803f332339328af2b53e82023fb3bec37cefdf43b83` | matches `docs/engineering/asset-manifest.json` |
| `studio/src/engineering/motorGeometry.json` | 71225 | `6fbe144c740a7dff2acb16681c4a0658eec7feb8dd4cad8602a2f43903a81712` | matches `docs/engineering/asset-manifest.json` |
| `studio/public/models/character/kairo-teacher.glb` | 2935540 | `0724545f108cf2949d64b72181c4bf7a5af1312932c6b5589a73a92d4de2170b` | none (snapshot) |
| `studio/public/models/character/studio_small_09_1k.hdr` | 1615248 | `e7cfda5f4e98e623db12b8bfd0184e048488e4855d9c83e2751fb44a32e80c45` | none |
| `studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.mp3` | 29952 | `893fe45a4a981eded3ca086fa629fb34bfc5938fe76ffff6cfee9c8a5a1e3e70` | none |
| `studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.mp3` | 32256 | `1b51ce9b1f994113565245c84940d88a797f7295985d2b75f70d9a08788ea97c` | none |
| `studio/public/models/character/audio/en-US-Chirp3-HD-Kore.mp3` | 30912 | `42333619e48615c124fb79005adda10951ca393150d62da472f84aedf5c7ee4a` | none |
| `studio/public/models/character/audio/en-GB-Chirp3-HD-Aoede.visemes.json` | 4239 | `84d8538a7a793a49f80700ec0e43dd5e033ca3db27eb5656a8f74bf9e15c110f` | none |
| `studio/public/models/character/audio/en-GB-Chirp3-HD-Puck.visemes.json` | 4086 | `15a3d596d191857ef1fc165aae823a440ffe0920ee26057954f13a8bce6d794d` | none |
| `studio/public/models/character/audio/en-US-Chirp3-HD-Kore.visemes.json` | 4318 | `84194baf15a7acef4067c16be0ca71bd442bb3ab3eb85a09ccdb8c39c4dca631` | none |

Every hash that has a record matches it. Nothing in the record set is contradicted by the bytes.

## 2. Author, licence and credit

| Runtime file | Author (as recorded) | Licence (as recorded) | Attribution the app must display | App display today |
|---|---|---|---|---|
| `RobotExpressive.glb` | Tomas Laulhe (Quaternius); glTF changes by Don McCurdy | CC0-1.0 (`RobotExpressive.README.md`) | None required (CC0) | `App.tsx:116`: "Animated guide by Quaternius / Don McCurdy (CC0)" |
| `classroom.glb` | Christophe Seux | CC0 (`classroom/provenance.json`) | None required (CC0) | `LectureStudio.tsx:45`: "Classroom by Christophe Seux · CC0" |
| `teacher.glb` | Mika Suominen / met4citizen (MPFB, via TalkingHead) | CC0-1.0 (`TalkingHead-README.md` line 375: "The avatar is licensed under CC0") | None required (CC0) | `AvatarStage.tsx`: "CC0 MakeHuman/MPFB rehearsal character", creator not named |
| `induction-motor.glb` | KAIRO project (Blender, `build_motor.py`) | Project-owned original | None | none needed |
| `poly_haven_studio_1k.hdr` | Greg Zaal (Poly Haven) | CC0 (`polyhaven.com/license`) | None required (CC0) | `EngineeringStudio.tsx:489`: "Poly Haven Studio HDRI by Greg Zaal (CC0)" |
| `motorGeometry.json` | KAIRO project (generated) | Project-owned generated data | None | none |
| `kairo-teacher.glb` | Derived from Rain v3 (Blender Studio / Blender Foundation), KAIRO-restyled | **CC-BY 4.0** (in code comments and bus note only) | **Required**: "Rain Rig (CC) Blender Foundation \| studio.blender.org" | `Rehearsal.tsx:285` only: "Teacher based on Rain (CC-BY 4.0, Rain Rig (CC) Blender Foundation \| studio.blender.org)..." |
| `studio_small_09_1k.hdr` | **not recorded** | **not recorded** | unknown | none |
| 3 Chirp 3 HD `.mp3` samples | **not recorded** (Google Cloud TTS voice, named in file) | **not recorded** | unknown | none |
| 3 `.visemes.json` files | **not recorded** | **not recorded** | unknown | none |

The one licence the app must credit that it does not show in the main footer is Rain (CC-BY 4.0). It is shown only on the rehearsal page.

## 3. Contradictions and inconsistencies

1. **Author naming for the guide.** The recorded author is Tomas Laulhe. The footer credits "Quaternius / Don McCurdy". Both names are in the record, so this is a wording question for the owner, not a licence problem.
2. **Two teacher models, one credit each.** `/teacher` uses MPFB `teacher.glb` and does not name its creator. `/character` uses Rain-derived `kairo-teacher.glb`, which has the CC-BY credit on that page only. A reviewer should not assume the credit placement covers both.
3. **CC-BY claim has no machine-readable record.** The CC-BY 4.0 licence for Rain appears only in code comments (`build_teacher.py`, `rain_export.py`) and the bus note. No manifest lists it.
4. **Classroom has no hash record.** `assets/manifest.json` records the downloaded reference zip (`assets/reference/classroom.zip`, hash matches). The runtime `classroom.glb` has no hash in any manifest.

## 4. Gaps (not filled by guessing)

- **G1. `kairo-teacher.glb` has no provenance file or manifest entry.** The export mode (`rain_export.py` spike or full) that produced it is not recorded. Its Rain lineage is stated in code only. The Rain v3 source sits in `assets/reference/claude-kit/rain-v3.zip` and `rain-inspection/`, neither listed in `assets/manifest.json`.
- **G2. Rain licence not fetched.** The CC-BY 4.0 statement was not checked against Blender Studio's page. Downloads were not permitted.
- **G3. `studio_small_09_1k.hdr` has no author, source or licence.** The name follows the Poly Haven pattern, but a name is not evidence. It must not be treated as CC0 until recorded. An identical copy is at `assets/reference/claude-kit/studio_small_09_1k.hdr` (same hash), also unrecorded.
- **G4. Chirp 3 HD audio and viseme files have no generation record.** The account, date, and Google Cloud TTS terms of use for the output are not in the repo. The Google terms were not checked. `assets/generated/kairo-voice-check.mp3` is a further generated file with no record.
- **G5. `classroom.glb` licence not evidenced locally.** The CC0 claim comes from `provenance.json` and the Blender demo-files page it names. The local `assets/reference/classroom/ReadMe.txt` (hash `12a546e6...`) has no licence line. The conversion script is not identified.
- **G6. Original `mpfb.glb` not kept.** `teacher/provenance.json` records `sourceSha256 63c645a2...`, which cannot be checked. The prepared file's hash does match.
- **G7. Poly Haven MD5 not re-fetched.** The HDR's MD5 `a1065f613cb6e0388d82a99dcee23d3b` matches the value recorded from Poly Haven metadata, but that value was recorded by another session. No live check was made.
- **G8. Reference zips not in any manifest.** `rain-v3.zip`, `mpfb-v2.0.18.zip`, `quaternius-base-standard.zip`, `human-base-meshes-v1.4.1.zip`, `ellie-pose-library-v2.0.0.zip`, `autumn_field_puresky_1k.hdr` are all present, hashed in `audit.json` under `reference_files`, and none is recorded in `assets/manifest.json`. Their licences are not recorded here. Their landing pages mention a licence page, but the licence text was not read in this audit.

## 5. Checks run

- Ten recorded-hash comparisons (`record_checks` in audit.json): all ten match, byte counts included where recorded.
- Poly Haven MD5 recorded value matches the file (computed by `hashlib`).
- Every file cited by provenance or code exists: `tools/avatar/prepare_teacher.py`, `build_motor.py`, `rain_export.py`, `build_teacher.py`, `rain-v3.zip`, `studio_small_09_1k.hdr`, `TalkingHead-README.md`, `classroom/ReadMe.txt`.
- Licence and author text was read in these source files: `RobotExpressive.README.md`, `classroom/provenance.json`, `teacher/provenance.json`, `TalkingHead-README.md` line 375, `docs/engineering/asset-manifest.json`, `build_teacher.py` and `rain_export.py` headers, and `Rehearsal.tsx:285`.

## 6. Limits

- Read-only. Nothing in `studio/`, `assets/`, `design/`, `docs/` outside this folder, or any manifest was changed.
- No downloads, no network calls, no licence pages fetched. Every licence value above is "as recorded", and each unevidenced one is listed as a gap.
- The character hashes are a snapshot. CHARACTER-002 may change them before integration.
- The audit covers files reachable from the repo at audit time. Git history and the private `data/` folder were not inspected.
