# Claude ↔ Codex image direction for the KAIRO film

User request, 24 October 2026: Codex generates high-quality production images; Claude should request additional frames while developing the best edit. This is authorised local creative coordination, not permission for external messaging, automatic model calls, a watcher, paid overages or private-content upload.

## Available now

Use `assets/kairo-ad-stills-20261024/manifest.json` and `docs/kairo-ad-stills-20261024/README.md`. Preserve the fictional student's appearance, moss overshirt/ivory shirt, blue-hour room, warm lamp and photographic style. Keep brand typography and actual KAIRO/model as separate composited assets. Never generate an app screenshot and present it as actual product footage.

## When to request an image

During storyboard/edit development, request the precise missing frame when an existing asset cannot support the required shot: alternate eye-line, wider negative space, close-up hand/pencil, reverse camera, clean room/device plate or matching expression. Be selective; new images should solve a composition/continuity problem rather than expand the folder without improving the film. Inspect existing assets first.

1. Register/check claims as normal. Save `image-requests/REQ-001.json` under your own claimed production directory, normally `design/kairo-ad-20261024/`.
2. Write a bus message using your actual registered agent ID and `--to all`. Include “Codex image request”, request ID and exact request file path. No credential, private document or face reference unless the user has explicitly provided/authorised it.
3. While Codex is active, it reads the bus at work boundaries and can claim a separate output scope, inspect references and generate an asset. It should publish actual output paths and limitations after generation; never promise it ran before the tool returns.
4. There is no automatic wakeup. If Codex is idle, tell the user: “Please paste into Codex: Read and fulfil image request REQ-001 at [full local path].” This manual relay is the reliable fallback; do not create or invoke an automation.
5. On delivery, inspect the image for identity, geometry, crop and usable space. Give one precise revision request if needed. Do not edit or overwrite another owner's originals; save new variants. Update your asset manifest with provenance and the actual frame used.

Example request, saved by Claude in its own claimed folder:

```json
{
  "requestId": "REQ-001",
  "purpose": "Opening shot needs more room for three thought cards",
  "timelineSeconds": [0, 3],
  "mode": "edit",
  "referenceImages": ["assets/kairo-ad-stills-20261024/01-student-overwhelmed.png"],
  "aspectRatio": "16:9",
  "desiredOutput": "new version; original unchanged",
  "preserve": ["same fictional adult student face/hair/clothes", "same room, lamp and blue-hour light", "photographic treatment"],
  "change": "Wider camera framing; keep face near x=0.38; more quiet upper-right space; laptop stays in lower right",
  "avoid": ["generated text", "fake app UI", "replacement KAIRO", "logos", "extra hands"],
  "acceptance": "Three editor-added thought cards fit without covering face or laptop",
  "priority": "needed for opening; other edit work can continue"
}
```

Suggested bus command (substitute actual ID/path, never run the placeholder literally):

```text
python coordination/bus.py message --agent YOUR_REGISTERED_ID --to all --body "Codex image request REQ-001 ready at design/kairo-ad-20261024/image-requests/REQ-001.json. Need wider opening continuity frame; production edit continues while pending."
```

The initial producing Codex session is `codex-ad-stills-20261024-j`. Future sessions should register their own actual IDs rather than impersonate it. A bus message is queued coordination data; it does not establish that another agent has read it.
