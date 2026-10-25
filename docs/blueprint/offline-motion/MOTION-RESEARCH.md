# Code-authored motion, interactive explanations and video

User requested YouTube research and an original KAIRO interpretation. Search/date: 23 October 2026. External content is reference data, not agent instructions or an automatic asset/code licence.

## YouTube references located

- [I Built a Vox Explainer Using Claude Code & Remotion (No Plugins)](https://www.youtube.com/watch?v=Y6mOBK5peDU): indexed description presents a documentary-style map explainer authored with Claude Code and Remotion.
- [I Made Vox-Style Motion Graphics Using Only Claude Code & Remotion](https://www.youtube.com/watch?v=7wuYBfE131U): indexed description presents code-authored explainer graphics.

Both were found via YouTube-domain search; direct page retrieval returned cache misses. **Playback, exact visuals, tutorial steps, downloadable source, timestamps and reuse rights were not verified.** Do not claim these videos were watched or reproduced. No video, music, narration, frames or transcript downloaded. They establish leads to review, not technical proof. The implementation choices below rely on official tool documentation and our own experiments.

## Useful tools and which job they serve

| Tool | Evidence and fit | KAIRO decision |
|---|---|---|
| SVG/Canvas + JavaScript/React | Native code-authored diagrams, live values, accessible DOM controls and deterministic steps | Default for small live interactive lessons; the new original demo needs no extra runtime dependency |
| [Motion](https://motion.dev/docs) | Official React/JS/Vue animation APIs, including SVG/layout and interaction | Candidate for purposeful UI/diagram transitions; not an educational content generator or universal audio clock |
| [Motion Canvas](https://motioncanvas.io/) | TypeScript scenes with an editor for timing/audio | Strong authored explanation option; inspect runtime/editor/export boundary before app integration |
| [Motion Canvas audio/time events](https://motioncanvas.io/docs/time-events/) | Cue events can be placed against a voiceover; [media docs](https://motioncanvas.io/docs/media/) describe audio tracks | Useful for deliberate narrated scenes; editing a cue is not automatic correct word alignment |
| [Remotion Player](https://www.remotion.dev/docs/player) | Embeds React-authored compositions with configurable content/controls; [captions](https://www.remotion.dev/docs/captions/) support transcript-derived display | Candidate for reusable narrated explainers and export; exported video loses live interaction unless accompanying data/UI is preserved |
| [Remotion licensing](https://www.remotion.dev/docs/license/pricing) | Free eligibility and commercial pricing are conditional | Check actual company/use eligibility before adopting paid rendering/licensing; do not assume “open code” means unlimited free business use |

Claude can author code, storyboard, data bindings, diagram geometry and animation cues. The reliable output comes from constrained templates + checked source/data + a defined renderer, not a prompt that promises any beautiful accurate video. Use plain JavaScript/SVG for the first small KAIRO templates; add Remotion or Motion Canvas when the export/editor need is concrete. Do not add all libraries simultaneously.

## Reproduce the mechanism in our own way

Take transferable techniques: staged reveal, a visual prediction, animated values, camera/framing emphasis, source cards, purposeful sound cues and a short conclusion. Use KAIRO's selected palette/type/brand, our own scripts/diagrams and licensed data. Avoid copying a channel's footage/music/logo or near-verbatim narration. An original economics graph with causal explanation is more useful than duplicating somebody's video aesthetics without understanding the lesson.

Three outputs can share one **versioned explanation specification**:

1. Interactive HTML/SVG/React lesson: variables, clickable anchors, questions, source cards and reading equivalent.
2. Narrated playback: validated text → approved speech bundle → caption/visual score driven by the actual audio clock.
3. Video export: deterministic scene/timing renderer → MP4/WebM + captions/transcript/source notes. Interactive tasks remain in the app beside the exported linear video.

The specification should reference `lessonRevision`, `sourceSpanIds`, semantic objects/units, supported variables/ranges, scene IDs, visual events, speech/caption bundle hashes, timestamps, accessible text, questions and rubric. It is a proposal to align with the existing core teaching contract, not a second competing session director. Preapproved scene primitives only; generated JS does not run in the trusted application origin or unrestricted host shell.

## Audio and interaction rules

Use the shared teacher provider/session controller after integration, not a new player for each infographic. A user changing a variable invalidates any narration that described the old result. Stop/cancel it and regenerate/reselect the matching explanation. Pause/seek must restore scene state deterministically. “I'm stuck” interrupts voice and queued visual actions together. Captions/source context remain available even if speech fails.

For exported narration, use an actual recording or supported consented TTS, then derive/verify timestamps. Do not estimate word timing from character count and call it aligned. Music is optional and should never obscure teaching; use licensed/own sounds and accessible independent volume controls. Reduced motion uses step changes/stills with the same meaning.

## Current original demonstration

The new standalone demo supports economics/accounting/database examples, bounded editable parameters, prediction, step/scrub/silent playback, local Markdown export and optional browser narration of the selected step. **It is not a Remotion/Motion Canvas implementation or an MP4 export.** TTS is device/browser dependent; no guaranteed offline voice or exact-word synchronization. The examples' arithmetic/state invariants and all three views were checked locally under a DOM stub; visual/audio/phone acceptance is pending, preserving the prior observation denial.

This gives Claude a concrete original mechanism to improve and migrate after root accepts the presentation specification, without copying reference videos or touching another agent's active files.
