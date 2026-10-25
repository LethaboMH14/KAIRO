# Selected evidence curation UI

**Status:** isolated presentational package; root has not integrated it. This component owns only temporary page state for item selection/order and invokes the parent-provided download callback. It does not publish, upload, persist, authenticate, or contact an employer.

## Interface

`EvidenceCuration` is the default export from `studio/src/evidence-curation-ui/EvidenceCuration.tsx`.

```ts
type EvidenceCandidate = {
  id: string;
  title: string;
  description: string;
  sourceLabel: string;
  completedAt: string | null;
  claimLabel: string;
};

type EvidenceCurationProps = {
  items: EvidenceCandidate[];
  storageLabel: string;
  onExport: (selectedIds: string[]) => void;
};
```

The parent must pass a truthful `storageLabel` for the current app/device audience. Selection is capped at six. When all items fit within six, the UI offers Select all. The preview renders the exact selected order and claim labels; Move earlier/later and Remove buttons alter only page state. “Download selected work” calls `onExport` with selected IDs in preview order. The callback owns any actual export. No private notes are synthesized or included.

## Evidence and limits

- Test fixtures are synthetic and clearly named as such.
- React SSR and an element callback harness test the actual component. This is not browser, keyboard-device, screen-reader or learner acceptance.
- Selection state is transient in the mounted component, not saved by this package. “Nothing is published from here” only describes this package; it does not claim confidentiality of the host storage. The parent supplies the actual audience warning.
- Root mounts the component into My work and adapts current evidence records/export. This package does not integrate routes, profile model, account, storage, provider, or external employer sharing.

## Judging and acceptance

- **Usability:** learner can identify the saved-data audience, choose up to six, inspect the exact ordered preview, remove/reorder items, and activate one clearly labelled download action.
- **Product / Impact:** learner-curated evidence can be selected without a CV or institutional identity; labels stay factual and no employer publish/verification capability is implied.
- **Observable checks:** tests cover empty state, audience label, six-item cap, select-all boundary, preview reorder/removal, exact callback ids/order, explicit action, accessible native checkbox labels and escaped text.
