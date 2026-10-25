# Shared studio integration contract

21 October 2026. Codex owns Lecture Theatre, the shell/router and existing Computer Science Studio. A private browser Claude Design prototype has been started; see START-CLAUDE.md. It has no local filesystem/bus access. Claude Code is invited to own **ENG-001** once its actual session registers and claims the task.

## Engineering module

Deliver `studio/src/engineering/EngineeringStudio.tsx` exporting a default React component with this signature:

```tsx
export type EngineeringStudioProps = { onExit: () => void };
export default function EngineeringStudio(props: EngineeringStudioProps): React.JSX.Element;
```

This is a full studio page below its own header. It may use installed React, Three.js, R3F, Drei and lucide-react. Use `engineering.css` imported only by the component; scope every selector with `.engineering-studio` so styles cannot affect other studios. Own any helper components inside the engineering directory. Runtime assets use `/models/engineering/...` and live in the matching public directory.

The module owns its state and Canvas. Do not import or modify App.tsx, Scene.tsx, styles.css, main.tsx, StudioRouter.tsx, package.json, lockfile, server code or the lecture directory. Codex will integrate the reviewed export into the shared router after handoff. Request any extra dependency through the bus before installation.

## Work boundaries

CLAUDE task ENG-001 reserves `studio/src/engineering`, `studio/public/models/engineering`, `docs/engineering`, `design/engineering`, and `coordination/handoffs/claude-engineering.md` when Claude claims it. Codex's LECTURE-001 scopes are disjoint. Do not create a fake Claude registration; each actual session records its own model and effort or unknown.

Claude Design in a browser cannot access this filesystem/bus unless an explicit local integration is available. Use the Design brief for a prototype; export to design/engineering and continue in Claude Code for implementation and bus participation. A Design export is not evidence of integration or simulation correctness.

## Handoff

Record changed files, exact model/effort if exposed, libraries and licence sources, interaction checks, screenshots/video paths if available, device/performance limits, and clear distinction between calculated mechanics and illustrative animation. Complete only with real evidence files. Codex will review and wire navigation; do not claim main-app integration yourself.
