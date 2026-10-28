# Evidence gap presentation panel

This isolated package presents source-dated role requirements, learner-linked evidence states and one learner-chosen next study action. It owns no matching, scoring, storage, network, route or application behaviour.

## Interface

Import the default `EvidenceGapPanel` from `studio/src/evidence-gap-ui/EvidenceGapPanel.tsx`.

```ts
type EvidenceStatus = 'linked' | 'missing' | 'needs-review';

type EvidenceRequirement = {
  id: string;
  label: string;
  sourceTitle: string;
  sourceUrl: string;
  checkedAt: string; // YYYY-MM-DD or canonical UTC timestamp
  evidenceStatus: EvidenceStatus;
  evidenceLabel: string | null;
  nextActionLabel: string | null;
};

type EvidenceGapPanelProps = {
  roleTitle: string;
  requirements: EvidenceRequirement[];
  onChooseRequirement: (id: string) => void;
};
```

`onChooseRequirement` fires only for one unique requirement ID with a valid checked date, complete requirement details, source title and a public HTTPS source URL. No row can be chosen when its source is missing/invalid, its date is malformed/future, its ID is duplicated, or details exceed their bounds. The reason remains visible in text. The callback gate is exported as `createRequirementActionHandler` so the actual UI gate can be checked without a browser.

`linked` means a record is linked, not that a skill or competence has been assessed. `needs-review` stays visibly review-only. `missing` is described as no linked record, never lack of skill. No scores, hiring probability, guarantees, FNB relationship, automatic applications, mutation or data fetch are present.

## Acceptance mapping

- **Product:** learner can connect each role requirement to the current linked/missing/needs-review evidence state and a useful study action.
- **Usability:** source title, checked date, explicit state, and next action are shown together. Invalid source/date or duplicate IDs disable selection with an explained reason; empty and oversized input have clear states.
- **Impact:** the presentation supports practice planning without claiming job placement, mastery, or measured employment benefit.
- **Sustainability:** stateless package has no new dependency or persistence contract and can be integrated by a host that owns evidence links.
- **Intelligence:** source/date safety and row-action checks fail closed. This is presentation and deterministic validation, not a prediction or automated match.
- **Presentation:** KAIRO's chalk, moss and sage palette, C mark, plain learner language, focus state and narrow-screen layout carry through the module.

The acceptance evidence is the actual React/Vite SSR and callback test in `studio/tests/evidence-gap-ui.test.mjs`. Tests use invented role/source text only. Run from `studio/`:

```powershell
node --test --test-concurrency=1 tests/evidence-gap-ui.test.mjs
```

This component is not mounted. SSR/callback tests do not establish browser, keyboard, screen-reader, mobile, human learner, provider-source, employability, or learning-outcome acceptance. Root owns contract mapping/integration.
