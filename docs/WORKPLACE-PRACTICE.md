# Workplace practice and learner progress

## Scope and design

The next increment links source-based study to a concrete stock-control case: calculate expected stock, inspect a physical shelf and records, reconcile damaged goods and decide what to report. This is an authored, fictional, formative workplace scenario. Generated lessons supply the cited principles; the scenario's transaction records are explicitly simulated data.

Visual direction: retain KAIRO's Manrope/DM Sans typography, slate ink #203b4b and blue #285c80. The shop adds mint #88b6a2, notebook blue #629ac5, pale wall #edf2ef and timber #b99570. An isometric cutaway shop is the focal point. A readable evidence drawer and task checklist support it; identical keyboard-accessible evidence controls remain available outside WebGL. User actions change the scene's selected object and current evidence. No ornamental automatic motion is needed.

Layout: heading and phase trail; shop/evidence on the left, current decision on the right; the resulting practice record and next recommendation below. On smaller screens, evidence and task come before optional 3D. A reading alternative supports every task.

## Shared interface proposal

- `/practice?lesson=<id>` loads a known saved lesson and offers a linked authored stock-control case only if its reviewed excerpts contain the required stock-control concepts. This conservative lexical check is template matching, not semantic understanding.
- `/practice` offers the standalone authored case, clearly labelled.
- `/progress` reads browser-local learning records and scenario attempts; no new server or cloud integration.
- `studio/src/profile/model.ts` owns bounded, versioned profile storage and pure recommendation logic. Lesson IDs key upserts; topic/format are explicit learner choices. Practice attempts are separate runs.
- `studio/src/practice/model.ts` owns the case state machine, allowed transitions, consequences and rubric. UI click handlers cannot advance the case without satisfying its gates.
- Notes/portfolio exports distinguish first attempts, retries and source principles from fictional transaction evidence. They do not claim verified workplace skills or accreditation.

Existing prepared routes and Claude's Engineering claims remain separate. No package/configuration changes or paid calls are needed.

## Implemented behaviour

The shop is code-authored with Three.js/React Three Fiber and uses no new downloaded assets. Selecting its shelf, register, delivery crate or damage book opens the same evidence available through the native buttons. The scene renders on demand, respects reduced motion and caps pixel ratio at 1.5. On small screens the evidence desk opens first; 3D is optional.

The four tasks are expected-stock calculation, reconciliation after inspecting all four records, a workplace decision with consequences, and a written handover. The scenario accounts for the difference through a signed damage record; it does not infer theft from a shortage. Reflection completion checks length only and explicitly does not grade writing quality.

The case draft stores actions and replays the state machine on reload instead of trusting a saved completion flag. A completed run retains first attempts, retries, inspected records, decision and reflection. Browser-local records remain self-reported and editable; replay is consistency checking, not tamper-proof verification.

Lessons now contribute explicit subject/format choices and formative outcomes to `/progress`. Recommendations prioritise unresolved answers, unanswered questions, recall after retries, then application. Each recommendation states its reason. A recent completed case also identifies checks that needed a retry. This is deterministic support based on recorded events, not a trained model, a diagnosis, future-performance prediction or evidence that a particular format causes better learning.

The profile retains up to 50 lesson summaries and 20 case runs. Per-case action logs are bounded. Existing individual lesson notes use their separate storage key. A malformed profile does not prevent those notes from being read. Export important records before changing browser/profile or clearing site storage.

The case export includes the saved source revision and exact source excerpts when linked to a lesson. The profile export contains subject progress and case action trails. Nothing is shared externally or sent to an employer automatically. The case transactions are fictional; the source excerpts supply the principles. This feature adds no cloud calls, paid services or accounts.
