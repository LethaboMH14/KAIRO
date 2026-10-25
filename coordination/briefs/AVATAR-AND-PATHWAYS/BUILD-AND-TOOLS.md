# Installed tools, available assets and remaining production work

Checked 21 October 2026. Start at START-HERE.md. Nothing in this kit automatically launches Claude or grants browser Design access to the machine.

## Ready locally

| Item | Actual state | Use |
|---|---|---|
| Blender 4.5.14 LTS | Existing portable executable in tools/blender; no system PATH change | Character modelling, rigging, clip authoring, baking and glTF export |
| MPFB 2.0.18 | Official SHA-256 verified; project-local Blender extension enabled and probed | Build original human identity/proportions; add reviewed hair, clothes and expression controls |
| Rain v3 source | Downloaded official ZIP, 67.6 MB; CC-BY attribution required | Compare a sophisticated expressive Blender rig; not a drop-in web avatar |
| Human Base Meshes v1.4.1 | Downloaded official ZIP, 50.6 MB; CC0 | Original modelling starting points |
| Ellie pose library v2.0.0 | Downloaded official ZIP, 24.8 MB; CC-BY | Pose reference; compatibility and clips require inspection |
| Quaternius Universal Base Characters Standard | Anonymous free ZIP downloaded, CRC checked; 129 MB; CC0 | Lighter body-rig alternative; inspect actual face/export controls before selection |
| Poly Haven lighting | Two 1K HDRIs downloaded and hashed; CC0 | Daylight and studio lighting/background, not walkable room geometry |
| Existing teacher runtime | MPFB-derived GLB, expression/motion rehearsal and Google HD speech | Baseline comparison, not final cinematic character |
| React/Three runtime | Existing project dependencies | Keep installed versions; do not upgrade shared manifests without ownership |

See assets.json for exact files, sources, licences, byte counts and hashes. All assets stay in assets/reference/claude-kit until reviewed integration. ZIP integrity is not a guarantee of artistic suitability. Rain inspection uses auto-execution disabled; embedded rig scripts require source review before trusting them. Preserve all attribution and third-party asset terms in derivative exports.

The legacy MPFB extraction in blender-scripts/addons is retained as an unused preparation artifact. **Use the proper extension in blender-extensions/mpfb through the launcher**, not `addon_enable('mpfb')`. MPFB 2.0.18 requires the Blender extension namespace.

## Launch and verify

From the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/claude-kit/launch-blender.ps1 -Verify
powershell -NoProfile -ExecutionPolicy Bypass -File tools/claude-kit/launch-blender.ps1
python -m http.server 4191 --bind 127.0.0.1 --directory coordination/briefs/AVATAR-AND-PATHWAYS
```

ExecutionPolicy Bypass applies to this launched process only; it does not change machine policy. The launcher points Blender user/config/data/temp paths to the project. It uses --disable-autoexec; do not enable global trust for downloaded blend files. Verification writes mpfb-install.json, including an actual mesh-creation probe. No account is needed for Blender/MPFB or the downloaded free assets.

Open http://127.0.0.1:4191/ for the standalone review explorer. The real teacher application remains http://127.0.0.1:4176/teacher. The explorer changes local demo state only: no job feed, CV submission, private profile scoring or tool execution occurs.

## Claude Code skills

Project-local inventory is skills.json. Existing seven skills were preserved. Newly added: threejs-shaders, threejs-postprocessing, webapp-testing, pdf, docx, remotion-best-practices and KAIRO's own kairo-avatar-production. Revisions and entry hashes are recorded. The Remotion router includes its nested references; no Remotion runtime package was installed into the app.

Read the relevant SKILL.md when performing a task. Skills guide a coding agent; they are not app APIs, models, licences for arbitrary assets or browser Design plugins. Use Three guidance against the project's actual version. Browser/testing instructions may require environment-specific adaptation.

The Anthropic pdf/docx packages carry source-available service terms, not a general unrestricted open-source grant. Retain their LICENSE.txt and use under those terms. They are deliberately excluded from the portable reference ZIP. Review other upstream licences before redistribution. No random GitHub MCP server was installed or given secrets.

## Character production sequence

1. Review source licences and bundled scripts. Inspect Rain, existing MPFB rehearsal and Standard base characters under matching lighting/cameras.
2. Choose the rig by expression, hands, editing quality, exportability, size and measured browser performance. Document the choice. Use the generated image for artistic direction, not anatomical or mathematical truth.
3. Produce an editable teacher with consistent identity. Separate body identity, clothing, voice/accent, expression and animation choices. Voice must not be inferred from race or assumed personality.
4. Author/bake body clips and map useful facial morphs/visemes. Blender control rigs, constraints and drivers do not automatically survive glTF. Test exported deformation, eyes, teeth, hands and blend transitions.
5. Deliver the CHARACTER-CONTRACT.md interface proposal and an isolated browser rehearsal before changing the shared application. Pointing follows real target coordinates. Locomotion/contact requires suitable clips, paths and IK rather than decorative sliding.
6. Test interruption, audio stop/pause, expression blending, occlusion, reduced motion and text-only alternatives. Preserve provenance, render captures and measured performance on the actual device.

Speech comes from the existing authenticated Google Cloud TTS integration, with voice choices already exposed in the app. This is a real API; usage and credits must be checked on the account before extended runs. No new ElevenLabs or other paid voice account is required. Current jaw movement uses audio amplitude, not phoneme-aligned lip sync. Exact visemes need a separate alignment pipeline. SASL requires a language-correct reviewed translation and suitable hand/body/facial performance; ordinary gesture clips cannot be labelled signing.

An initial rig comparison and export spike is a scoped production task, not a guaranteed finish date. A refined teacher can take days or longer depending on rig/export repair, expressions and browser constraints. Walking, precise contact, speech alignment and reviewed SASL add separate work. Measure the first spike before committing an estimate.

## Environments and motion

Use ENVIRONMENTS.md for six distinct studios and their meaningful tasks. Reuse the existing classroom and Engineering work before importing large new worlds. Model small reusable rooms and meaningful props; use GLB with texture compression/LOD where supported and measure memory/draw calls. HDRIs support lighting, not interaction geometry.

Interactive explanation: existing React/Three plus authored state and real task logic. Motion graphics: browser animation for live diagrams; optional Remotion for rendered, exportable video. Video rendering incurs compute and needs its own worker/queue and cancellation. Do not install every rendering framework just because a skill mentions it.

## Accounts and external tools

- No new account is needed to inspect this kit, edit in Blender, use the free downloaded assets or run the local explorer.
- Existing Claude Code/Design access is needed for that workflow; Design needs the attached prompt and references, not a filesystem path.
- GitHub account is optional for public research; needed for a learner's own repository, collaboration and some hands-on courses.
- Microsoft Learn preparation is available separately from paid certification exams. Forage has its own learner registration; completion is simulation evidence, not employment.
- LinkedIn, SA Youth and job-provider accounts belong to the learner. Ask them to authenticate through a trusted provider flow; never request passwords in chat.
- Google/Azure services, quotas and expiry must be checked live before deployment or sustained generation. This kit did not provision paid workers, a job-search API or additional cloud services. Existing cloud audit remains in docs/KAIRO-SETUP-AND-ACCOUNTS.md.

The role/evidence/ATS/work-simulation and permissioned browser/terminal specifications are in FNB-ROLE-AND-TOOLS.md and docs/LEARNING-TO-WORK-AND-SME.md. The first role-preparation app slice is now at http://127.0.0.1:4176/pathways and linked from My progress. It supports historical role exploration, user-reported evidence notes/coverage, tasks, local saving and Markdown export. Terminal containers, real external application adapters, LinkedIn publishing and production persistence are future implementation; the kit does not claim they are working.
