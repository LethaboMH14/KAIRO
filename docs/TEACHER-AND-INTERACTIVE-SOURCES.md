# KAIRO teacher and interactive sources

## User direction

One teacher should connect documents, source passages, the lesson board, explanation media and practice. The learner can interrupt at a particular sentence or point on the board, ask for another explanation, hear a passage, translate it, request a visual example or save an important point. The teacher should act on the exact context, not give an unrelated chat response.

Working recommendation: an adult, softly stylised 3D teacher with clear expressions, restrained gestures and readable hands. Appearance, voice, language and teaching pace are separate preferences. A realistic presenter is another option, not a prerequisite for useful interaction. Any visual reference images are design targets, not delivered rigged avatar assets.

## Implementation contract for TEACHER-001

- New `studio/src/teacher/` modules own settings, narration controls, source passage segmentation/annotations, the interaction panel and an explainer animation.
- Source workspace keeps its editable extraction. An interactive reading copy uses exact text offsets. Existing review and explicit cloud consent remain required.
- Lesson workspace exposes its saved evidence as clickable reading passages and a contextual help action for the current chapter.
- `POST /api/workspace/passage` resolves a saved reviewed source revision or immutable lesson ID. It accepts section/start/end, an allowlisted action and optional target language, not arbitrary filesystem paths or executable app actions.
- Local actions: highlight, star, read, inspect exact source and export annotations. Browser narration lists only voices actually installed in that browser; no ethnicity or accent is inferred from a voice name.
- Cloud explanation/translation: explicit consent; bounded source text, one provider call at a time and an allowance. Output carries the selected source span and supplied evidence IDs. Translation is a draft, not a verified translation. No arbitrary generated JavaScript, HTML, SQL or tool invocation is executed.
- SASL: a visible truthful resource route and captions, rather than invented signing. A production signing pathway requires licensed resources, Deaf SASL expertise, a signing-capable rig and semantic evaluation.
- A local stock-flow explainer demonstrates a deterministic animated explanation when the source supports that template. It is not automatic generation of arbitrary video or arbitrary interactive code.
- Avatar movement will use a semantic action registry: point_to(target), highlight(span), write_board(content), play_explainer(template), move_to(anchor), wait_for_answer. An action must resolve an actual target before it can be shown as completed. DOM and Three.js targets need a shared coordinate adapter; a streamed talking-head video is not a movable full-body 3D model.

Existing Engineering claims remain untouched. No new public deployment, actor impersonation, voice cloning or paid avatar hosting is implied.

## Chosen direction and next implementation

The user chose capability over a fixed art style: retain all three styles as future options, with soft cinematic 3D as the working default. The generated comparison is concept art; changing a style preference does not load a finished character today.

Use the existing React Three Fiber/Three.js runtime with a licensed humanoid rig. Evaluate [three-vrm](https://github.com/pixiv/three-vrm) and the [VRM expression and gaze conventions](https://vrm.dev/en/vrm/vrm_features/) before selecting an asset. Require articulated fingers, facial morph targets, eye and head control, compatible animation clips and documented redistribution rights. These dependencies and assets have not been installed by this increment. Start with idle, listen, explain, point and acknowledge; blend between clips and synchronize speech visemes. Expressions should convey attention and encouragement without claiming to infer a learner's emotions.

For convincing contact, register semantic board, passage and control targets. Resolve each to DOM or world coordinates, move the teacher to authored anchors, and use gaze/arm inverse kinematics with camera and occlusion handling. The app must confirm the requested action occurred before animating its completion. This semantic action runtime is future work; the present allowlist predicate is only a boundary example.

Appearance, language, voice and pace remain independent. Current narration uses installed browser voices and can lack a requested locale. In the tested browser only en-US David, Mark and Zira were listed; selecting Zira was verified, but audio quality, pronunciation and lip sync were not. [Azure's official voice table](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts) lists South African English Leah/Luke and isiZulu Thando/Themba as possible future cloud choices. [Google Gemini TTS](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts) offers prompt-controlled delivery as another candidate. Neither cloud voice integration is delivered here. Do not infer ethnicity from a voice name or promise every accent or language. A streamed realistic presenter is a different integration from a movable full-body rig.

SASL requires language, facial grammar and spatial meaning, not a word-for-word gesture substitution. Work with Deaf SASL reviewers and licensed reference material before presenting any signing as a translation. [NID resources](https://nid.org.za/resources/) are a research route; dictionary access is not a redistribution or training licence. Captions and readable source text remain available while signing is developed.

## Media, models and learner adaptation

The stock animation is an authored, bounded template. Additional economics, accounting and computing templates should accept validated data, retain source anchors and offer step/pause/replay. [Remotion Player](https://www.remotion.dev/docs/player) can later embed React video compositions; rendering exports is a separate workload. Developer skills guide implementation and are not automatically callable services inside KAIRO. Avoid executing arbitrary model-generated code. YouTube discovery/embeds and timestamped supporting clips require separate source-aware integration; no YouTube fetching or video generation was added here.

Keep application provider credentials on the server. Authenticated Claude/Codex developer subscriptions do not automatically supply an application API entitlement. Use a provider adapter with time, cost and context limits before adding open models or tool servers. The current passage endpoint uses the existing Google project and bounded requests; no new training job or GPU service was started.

Learner adaptation should begin with observable answers, retries, requested explanations and later recall checks. Store topic and source versions with those events, expose the recommendation reason, and let the learner correct or clear the profile. Retrieval of source material is different from training model weights. Evaluate a simple baseline before training a recommendation model; avoid appearance, ethnicity or inferred emotion as ability signals. Existing practice records support study continuity, not an accredited certificate or proven workplace competence.

## Verification and delivery boundaries

The TypeScript/Vite build passed and all 19 tests passed. Real local HTTP checks covered missing consent, stale revision, invalid offsets, an unsupported action, a source-anchored Google explanation, an Afrikaans draft and the concept image route. Only the authored shopkeeper sample was used for these cloud checks.

Browser checks confirmed the concept/voice settings page, actual installed voice options, exact sentence selection (characters 220–310), highlight/star, persistence after reload and a stock animation reaching step 3 with 23 notebooks. The lesson's “I’m lost here” control opened its cited passage reader. Export was clicked, but no matching file was found in Downloads; download delivery remains unverified. Browser dispatch timeouts required a retry. No speech quality, mobile layout, facial rig, lip sync, roaming, signing or public deployment acceptance is claimed. Evidence: `data/private/app-workspace/teacher-verification.json` and the task handoff.

## Visual generation prompt (built-in image generation)

Use case: stylized-concept. Create one polished wide concept comparison board for KAIRO educational avatar direction, three equal labelled columns A, B, C on a pale blue-grey studio background. A: a warm adult Black South African woman teacher, natural textured hair in a tidy bun, sage jacket over cream top, softly stylised cinematic 3D with mature proportions, tactile materials, expressive eyes and readable hands, full body standing and one small facial close-up. B: a warm adult brown-skinned male teacher with short dark hair, slate/teal clothing, clean graphic 3D with simplified forms suitable for a lightweight web avatar, full body plus expression close-up. C: a fictional adult Black woman digital presenter, natural photoreal skin and hair, elegant professional casual clothing, full body and face detail, believable daylight. Show each teacher making a natural open-hand explanatory gesture toward a minimal lesson board. Refined education product art direction, calm reassuring adults, no franchise likeness, no childish proportions, no fantasy costumes, no fake signing poses, no watermark. Exact labels: A Soft cinematic 3D; B Lightweight expressive 3D; C Realistic digital presenter. Include a small clear footer: Concept directions, not finished avatar assets.
