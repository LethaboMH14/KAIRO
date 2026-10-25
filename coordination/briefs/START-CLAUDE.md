# Start Claude on Engineering Studio

The local implementation task is prepared. Codex also submitted the design brief to a private Claude Design artifact on 21 October 2026. The browser displayed **Haiku 5.5 / Low** at submission. It is a prototype session, with no local filesystem access or bus registration.

Continue the [Claude Design session](https://claude.ai/chat/43bff2af-4d70-4a51-9919-d735620f7d26?artifact=296897dc-0efe-453e-bc18-a53be6cce1e5). Submission was verified by the responding state; the prototype still needs review/export and local implementation. ENG-001 remains open for Claude Code to claim.

## In Claude Code

Open this project directory and paste:

> Read coordination/briefs/CLAUDE-ENGINEERING-CODE-PROMPT.md and carry out ENG-001. Register your actual session and claim the task first. Respect coordination/briefs/STUDIO-CONTRACT.md. Codex owns Lecture Theatre and shared files; you own the Engineering Studio module. Build and verify it, then leave the required handoff.

The complete prompt includes commands, file boundaries, installed tools, checks and completion instructions. It is usable immediately without Claude Design.

## In Claude Design

Use Claude's **Design output / Artifacts** entry point if available in your account. Supply the contents of `CLAUDE-ENGINEERING-DESIGN-PROMPT.md` and `STUDIO-CONTRACT.md`. These files are local; browser-only Claude cannot read a path on your machine unless you attach the files or use an explicit local integration. Ask for an editable prototype, then bring the export into `design/engineering/` and continue in Claude Code with the implementation prompt. Do not replace the shared app with a generated export.

Anthropic also documents `/design` and `/design-sync` in supported Claude Code workflows. Check availability in the actual client rather than assuming the commands or a 3D runtime exist. Claude Design can prototype interaction and layout; a verified Three.js module, working assets and tested educational mechanics are the implementation deliverables.

Official setup reference, checked 21 October 2026: https://support.claude.com/en/articles/14604416-get-started-with-claude-design

## Tools and spend

React, TypeScript, Three.js, React Three Fiber, Drei, Lucide, Node, Python and portable Blender are already available. Use licensed premade meshes or a Blender-authored multipart motor. Code can animate the resulting hierarchy and implement selection/explosion. No extra paid asset generator or cloud service is required for the first build. Record any external asset's licence and URL. Claude usage follows the user's own Claude plan; Google credits do not pay for Claude usage.

## Coordination

ENG-001 is intentionally open for Claude to claim. Only an actual Claude session records its model and effort, or `unknown` if unavailable. The SQLite bus coordinates local files when both clients use this checkout. It does not automatically send chat messages to Claude, launch a model, or connect a browser prototype to the filesystem. Codex reviews and integrates the completed module into the shared router after Claude's handoff.
