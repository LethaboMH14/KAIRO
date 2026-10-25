# Engineering journey — integration contract and working handoff

Owner: codex-engineering-pathway-20261023-g, Codex gpt-6, effort unknown. 23 October 2026.

## Published before implementation

Root owns EngineeringStudio integration and SourceClassroom resume adoption. No router, TeacherProvider, character, signing, pump-lab, package manifest or lockfile changes are proposed. Respect Claude's active PUMP-LAB-001 and SASL-CAPTURE-001 reservations.

`engineering/teaching.ts` will expose a pure `engineeringExplanation(context, intent)` returning text plus the existing motor source references. Context is the selected validated PartId, mode, supply ID, frequency text and pole count. Intents are `part`, `field-speed`, `next`. It reads only prepared motorContent and fieldMath, never arbitrary uploaded instructions. Calculations describe synchronous field speed, not measured rotor speed. Invalid parameters produce a correction prompt, never an invented result.

`EngineeringTeacher` is a stateless panel: explanation, narration state/status, onExplain(intent), onRead, onPause, onStop. It owns no media player, network, storage, simulation state or model loader. Root connects the existing shared TeacherProvider, stops old narration on equipment-context changes/exit and keeps text usable without speech or 3D. Any independently opened engineering preview needs the same provider wrapper before it is accepted.

Luna interfaces and two bounded next prompts will live in coordination/briefs/engineering-next-20261023. They are proposals, not dispatched chats. Workers must register actual settings and claim their own exact isolated files before starting. Root retains authentication, tenancy, router/provider and cloud integration.

Targets: Product completeness and supported correctness; Usability contextual next steps and reading controls; Intelligence explainable equipment state and exact calculations. Evidence and final limitations will be appended after checks. Other judging criteria are addressed in the journey plan without invented outcomes.

## Delivered and independently checked

- New pure engineering teaching adapter and stateless teaching panel. Actual part and supply state determine prepared explanations. Field speed uses the existing synchronousSpeed function, validates inputs and distinguishes field speed from shaft speed and calculator parameters from the fixed visual winding. Existing motor sources retained; this task did not independently revalidate all earlier motor references.
- EngineeringStudio now uses the one shared TeacherProvider for its existing read buttons and new teaching controls. No local SpeechSynthesisUtterance/player remains in that studio. Equipment context changes and unmount cancel narration through a current stop ref. Preview wrapper uses the same provider. No provider/router/character files edited.
- Source lesson links to a clearly labelled prepared engineering example; a validated lesson ID provides a return link to that lesson's working. No semantic claim that an arbitrary upload became or validated the motor simulation. No uploaded text or model-controlled equipment action added.
- Luna resume package reviewed, actual helper regressions independently rerun 19/19. SourceClassroom now calls chooseResumeStart after reviewed source/lesson validation and starts in reading. Existing persistence protection remains; no default write on restore.
- Recovery package checked against its handoff and current full suite; previously integrated route wiring retained. Its 8 SSR tests pass in the aggregate. No real assistive-technology certification.
- Detailed journey, scope, initial eight-programme research target, account/module identity, lesson curation, retrieval, roles/opportunities, model evidence, commercial and judging gates: docs/engineering-journey-20261023/README.md. Original-source research and explicit fetch limitations in SOURCES.md. Hosted identity/storage path and acceptance gates in CLOUD.md.
- Two next prompts in coordination/briefs/engineering-next-20261023: curriculum metadata/validation and stateless module chooser. Interfaces published before dependent work. No new chats dispatched or messages sent to user-owned Luna chats.

## Actual verification

- Focused integration/provider/policy run: 27/27 passed before the final lesson-return link refinement.
- Final targeted engineering/policy run: 10/10 passed, including real component rendering/callbacks, escaped text, validated return links and actual calculation logic. Log: docs/engineering-journey-20261023/focused-tests.txt.
- Full npm test: **353/354 passed, one failure** in actively owned pump-lab UI, test “nothing runs before the prediction, and the gauges are blank before a reading”. Exact expected flow-meter prose differs from current rendered prose. Evidence: docs/engineering-journey-20261023/tests.txt. Bus message 60 posted to the real pump owner; no receipt or fix assumed. No owned tests weakened and no pump files changed.
- npm run build: TypeScript and Vite exit 0, 2,254 modules, final EngineeringStudio-BjctvxKy.js emitted. R3F chunk >500 kB warning remains. Build output was inspected; verification.json records the result.
- After all source edits, installed tsc --noEmit passed with zero diagnostics (final-typescript.txt). Static emitted-JS checks confirm the engineering teacher, validated return-link wording and source-to-engineering link are present in the built chunks. This is not browser execution.
- Existing Google Cloud project read-only Cloud Run service inventory succeeded and returned []; no Cloud Run service deployed. First table-format command failed to parse, corrected JSON command succeeded. Evidence cloud-inventory.json. This does not enumerate Firebase Hosting or verify billing/credits.
- No browser/headless/CDP/HTTP screenshot, real speech, new model call, package installation, upload of private material, deployment, billing change or recurring schedule performed. Opening a preview for the user is not browser acceptance.

## Fresh Claude status and unresolved risks

Message 58 confirms brand master and authored classroom delivered; it announces separate user-approved SASL-CAPTURE-001 ownership including manifests. Root acknowledged the proposed tracking/recognition/translation separation, without approving a shared translation adapter. Pump stays actively claimed; no completed pump handoff was found at review time.

Message 63 from claude-engineering-20261021-a reports C1 accepted with remaining provenance gaps, and C3 accepted only as contract/research. It identifies prototype media defects (iframe recreation/load lifecycle, minimum size, focus/overflow/contrast, weaker validation). This is owner-reported review, not root reproduction. Do not advertise that YouTube prototype as accepted accessible playback; inspect the runtime media panel under its own claim before release. Teacher portrait provenance remains an owner action reported in that review. Root did not use it in the new engineering panel.

The motor panel is prepared contextual teaching, not general live conversation, new speech translation, assessed mastery, word-timed pointing or Rain physically teaching alongside equipment. Curriculum catalogue, institution onboarding, tenant-safe hosted uploads and common practical evidence integration are next work. Public friend-upload acceptance remains blocked on implementation, not on a new permission request. No revenue, bank reward, traction or learning-gain claim is made.
