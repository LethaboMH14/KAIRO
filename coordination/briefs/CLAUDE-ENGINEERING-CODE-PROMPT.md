# Paste into Claude Code in this project

Open `C:\Users\USER\Desktop\fnb app of year hackathon`. Read CLAUDE.md, AGENTS.md, the KAIRO product brief, `coordination/README.md`, `coordination/briefs/STUDIO-CONTRACT.md` and `coordination/briefs/CLAUDE-ENGINEERING-DESIGN-PROMPT.md`.

The user assigns you **Engineering Studio**, task **ENG-001**. Codex is implementing Lecture Theatre and improving the shared shell. Build your studio independently using the contract, with a real multipart motor, part selection, exploded view, controlled rotation, reviewed explanations, reduced motion and a 2D alternative. Do not present illustrative animation as validated motor physics.

First run:

```powershell
python coordination/bus.py status
python coordination/bus.py register --agent claude-engineering-20261021-a --client Claude --model unknown --effort unknown --focus "Engineering Studio motor exploration"
python coordination/bus.py inbox --agent claude-engineering-20261021-a
python coordination/bus.py claim --agent claude-engineering-20261021-a --task ENG-001
```

Use a unique ID if another session exists. Replace unknown only with model/effort values actually exposed by your client. Respect conflicting claims; do not steal a task or expand scopes silently.

If Claude Design is available in your client, `/design` can create/import a prototype and `/design-sync` can pull the existing design system according to Anthropic's current documentation. Use the Design prompt, then export or hand off into **design/engineering/**. If those commands/tools are unavailable, continue directly with code; do not invent a connection or block the build. Browser-only Design cannot claim the local bus by itself.

Deliver the default component in `studio/src/engineering/EngineeringStudio.tsx`, engineering-scoped CSS and helper components, runtime assets under `studio/public/models/engineering/`, asset manifest/licences and checks under `docs/engineering/`, and `coordination/handoffs/claude-engineering.md`. Leave router integration and shared files to Codex. Installed tools include React/TypeScript/Three.js/R3F/Drei, Node, Python and portable Blender at the path in tools/blender-install.json. Do not install an additional engine or paid service without a concrete need and authorization.

Validate your educational calculations against independent reference values. Check for missing assets, finite values, working controls, keyboard use, motion reduction, mobile layout and console errors. The scene can be previewed in isolation without changing main.tsx: provide an HTML harness inside your owned directory or coordinate a temporary route with Codex.

Write a concise evidence-backed handoff and notify the bus:

```powershell
python coordination/bus.py message --agent claude-engineering-20261021-a --to all --body "Engineering module ready for Codex review; see coordination/handoffs/claude-engineering.md"
python coordination/bus.py complete --agent claude-engineering-20261021-a --task ENG-001 --note "Describe actual delivered behaviour and remaining limits" --evidence coordination/handoffs/claude-engineering.md docs/engineering/verification.md
```

Only mark complete after the evidence files exist and match the actual result. No public deployment, credential transfer or claim of full platform completion is authorized by this handoff.

Verified workflow references: [Claude Design guide](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Claude prototype-to-code workflow](https://academy.claude.com/tutorials/using-claude-design-for-prototypes-and-ux).
