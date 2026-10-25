# Offline PostgreSQL and module-based motion explainers

23 October 2026. Proposal plus isolated working experiments, not a change to KAIRO's production storage or the active Rain/source integration contracts.

## Delivered

- [Original interactive module prototype](../../../design/module-motion-20261023/index.html): economics demand shift, accounting cash/inventory/profit and database retry/idempotency. Editable parameters, three teaching steps, play/pause/scrub, prediction, worked explanation, optional browser voice and local Markdown working export. No copied YouTube media, university question text or private coursework.
- [Offline storage design and actual PGlite results](OFFLINE-PG.md).
- [Your subjects and suitable representations](MODULES.md).
- [YouTube references, official docs and the replication plan](MOTION-RESEARCH.md).
- [Claude/Luna/root work packages](NEXT-TASKS.md).
- [Isolated pgvector probe evidence](pg-verification.json).

PGlite `0.5.11` and `@electric-sql/pglite-pgvector` `0.0.12` were pinned and installed **only in `pg-spike/`**, using `--ignore-scripts`. The existing app's dependencies/lockfile and database were not modified. The probe loaded the extension, searched synthetic vectors, filtered owner/review/revision/model, reopened persisted records and excluded deleted content. It did not install an ML checkpoint, embed actual text, prove browser/phone performance or deploy a cloud service.

The motion prototype is a standalone design/learning experiment. Its five local tests cover numerical invariants and rendering contracts; actual browser/voice/accessibility acceptance remains pending. The prior browser-observation restriction was not bypassed. Browser TTS depends on available device voices and is not guaranteed offline. Animation and narration are separate step controls here; no exact-word synchronization or rendered MP4 is claimed.

The shared bus has the plan and evidence. This does not imply another chat has accepted the proposed storage or presentation interfaces; root must reconcile them with the existing core data/teaching contracts before live integration.
