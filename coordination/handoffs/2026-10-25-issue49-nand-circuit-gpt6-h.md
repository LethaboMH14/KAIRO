# Issue #49 — NAND-only circuit learning interaction, 25 Oct 2026

Session: `gpt6-kairo-nand-circuit-20261025-1309-h`; ChatGPT GPT-6; effort setting unknown. Started from verified `main@0fabfdf9b8515cab8ff4100228a6a1df672491c6`. Cooperative scope claim on Issue #49; canonical local SQLite bus **not remotely readable**, so owner/coordinator must reconcile before merge. No local bus registration or fabricated claims.

## Why this slice

Computer Science Studio learner action, not another decorative 3D room: five reviewed prepared NAND gate circuits (NOT, AND, OR, XOR, MUX), change three binary input bits, make an explicit output prediction, compare to a deterministic NAND-by-NAND trace, and record two distinct local-only attempts. Learner can use keyboard/select/radio controls and a plain reading-first ordered table. The source is the official Nand2Tetris Project 1 Boolean Logic overview: https://www.nand2tetris.org/project01. All code, labels and examples are newly authored; no copied HDL/project solution files or book passages. NAND circuits are combinational educational models, not real hardware timing or safety controls.

Judging: **Product** (working action), **Usability** (2D reading/keyboard-first), **Intelligence** (domain-validated deterministic gates, independent truth oracle), **Impact** (measurable prediction and trace, not measured learning gains), **Presentation** (standalone browser preview), **Sustainability** (small pure no-provider model), **Creativity** (compose complex gates from NAND).

## Exact files owned

- `studio/src/studio-scenarios/nand-logic-trace/model.mjs` — bounded prepared netlists, domain checks, trace, independent truth oracle, two distinct local attempts with explicit source/model revision.
- `studio/src/studio-scenarios/nand-logic-trace/model.d.mts` — TypeScript declarations for strict React imports.
- `studio/src/studio-scenarios/nand-logic-trace/NandLogicLab.tsx` — prediction-first React component, keyboard/reading fallback, step reveal, local history, honest unverified evidence label.
- `studio/src/studio-scenarios/nand-logic-trace/preview.html`, `preview.tsx` — isolated browser preview; no app router edits.
- `studio/tests/nand-logic-trace.test.mjs` — exhaustive 5×8 circuit/independent-oracle truth cases, malformed circuit/bit rejection, duplicate and two-attempt bound, SSR accessibility structure.
- This unique handoff.

No edits to `studio/src/StudioRouter.tsx`, `App.tsx`, global CSS, root configs, shared source/revision API, lesson v2, PR #55 pump, PR #57 HTTP, PR #58 binary search, PR #60 SQL join, PR #62 BFS, PR #64 attempt contract, PR #56 Kaggle or PR #53 worker watch. No character or cloud changes.

## How to test

From `studio/` after `npm ci` on Node 24:
```sh
node --test tests/nand-logic-trace.test.mjs
node --test --test-concurrency=1 tests/*.test.mjs
npm run build
npx vite --host 127.0.0.1 --port 4173
```
Preview path: `/src/studio-scenarios/nand-logic-trace/preview.html`. Browser/device acceptance is NOT established by SSR checks.

## Truth and remaining gates

The learner exercises are **prepared public-source concepts**, not generated from an uploaded/reviewed textbook. All attempts are local-unverified in React memory, not account-level persistence or teacher-graded outcomes. No human usability or phone/screen reader testing was conducted in this GitHub connector. Do not claim a Kaggle hosted run, actual learning improvement, Cloud deployment, CI green or real user evidence without their own logs.

Integration needs independent Boolean logic/domain review, accessibility/browser/phone/zoom validation, canonical local SQLite bus conflict check, and explicit source-revision/authenticated attempt contract approval with PR #64 and lesson v2 #46/#47. PR #34 conditional merge policy applies.

NEXT 1: coordinator should prioritise **independent review and integration** of already working PR #55/#57/#58/#60/#62/#64 before further standalone demos. NEXT 2: after owner-scope resolution, create a separately claimed source/lesson → prepared studio exercise adapter with authenticated revision-bound attempts, never silently promoting these local predictions as account evidence.
