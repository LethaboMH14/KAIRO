# Classroom recovery UI — isolated handoff

Date: 2026-10-23 (Africa/Johannesburg)

## Worker and scope

- Bus identity: `codex-luna-classroom-recovery-20261023-c`; client Codex, model `gpt-6-luna`, effort `low`, based on the user's selected GPT-6 Luna / Light setting.
- Task: `CLASSROOM-RECOVERY-002`.
- Claimed paths only: `studio/src/classroom-recovery-ui/`, `studio/tests/classroom-recovery-ui.test.mjs`, `docs/checks/luna-classroom-recovery-20261023.txt`, this handoff.
- Judging targets: Usability, especially a clear next action; Product polish/reliability. Learner need: understand what happened and safely continue without losing material when a lesson/source/room/storage/resume operation fails.

## Delivered props and behavior

`studio/src/classroom-recovery-ui/ClassroomRecovery.tsx` exports default `ClassroomRecovery` and the published `RecoveryKind` and props types. It is stateless: no effects, network, provider, browser storage, timers, speech, camera or document mutation. It presents six states with one semantic `status` or `alert` region and a visible heading. Details render as plain escaped React text, capped at 500 characters. No unique fixed DOM IDs are used.

- Loading says the saved lesson and reviewed source are being checked, and links to My material without claiming validation.
- Unavailable lesson offers retry only when supplied, plus My material; no unrelated fallback is suggested.
- Changed source offers a validated source review link; invalid IDs fall back to `/sources`.
- Room failure offers the callback-gated reading action while copy says to use reading if available.
- Storage failure offers callback-gated session continuation, validated practice/notes link when lesson ID is valid, and My material. It does not claim cloud backup or universal record preservation.
- Resume conflict offers callback-gated recheck/continue actions and no reset/delete/replace.

Styles are scoped inside this component to match the existing chalk, moss and Manrope context, with wrapping actions, 44px minimum controls and a visible keyboard focus outline. No shared stylesheet or logo was changed.

## Checks and evidence

- `node --test tests/classroom-recovery-ui.test.mjs` from `studio/`: exit 0, 8/8 passed.
- `.\node_modules\.bin\tsc.cmd --noEmit` from `studio/`: exit 0, no diagnostics.
- Exact commands, counts, scope and limitations: `docs/checks/luna-classroom-recovery-20261023.txt`.

Tests use Vite middleware SSR and ReactDOMServer static markup; callback tests invoke handlers on the returned React elements. This is not browser event delivery, real screen-reader behavior, keyboard focus order, device/responsive/contrast testing or WCAG certification. The component is not mounted in SourceClassroom or a fixed route. Parent owns integration and choosing the error kind.

## Parent wiring map

Import `ClassroomRecovery` from `../classroom-recovery-ui/ClassroomRecovery` within the parent-owned source classroom. Map typed loader/storage/room/conflict outcomes to the published `kind`, pass only known lesson/source IDs, and provide retry/continue callbacks only when the parent can actually perform them. Keep existing lesson/source revision validation and the single shared narrator intact. Do not treat a callback's presence as proof it succeeded; parent owns the resulting state transition.
