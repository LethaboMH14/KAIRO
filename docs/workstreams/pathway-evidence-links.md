# Pathway links to replayed practice

Role preparation can hold a learner-selected reference from a criterion to a completed shop-practice run. The link is stored separately from the existing pathway draft and does not alter the learner's note, chosen evidence level, coverage points, eligibility, or historical employer records.

## Contract

`studio/src/pathways/model.ts` owns the separate `kairo-pathway-artifact-links-v1` record. Each link is scoped to a known role and a criterion belonging to that role, and stores the run ID, artifact and scenario versions, title, browser-local profile source, and canonical UTC link time. The user selects a listed run and confirms the link explicitly.

Before a link is written, the adapter re-reads the current profile and calls the existing `collectArtifacts` replay validator. A missing, invalid, non-completed, or ambiguous run ID is rejected. Display and export re-resolve links against replayed artifacts; a removed run or changed title/version/source remains visible as unavailable with a reason and can be removed. Parsing bounds the serialized record and version strings, validates real canonical calendar timestamps, and projects only the declared fields. The existing profile and `PathwayState` schema are unchanged.

The page displays the run title, ID, artifact version, scenario version, and `browser-local profile` source, with a general `/evidence` link so learners can locate the item. No per-run anchor or source URL is claimed. Markdown export records the same provenance and marks stale links unavailable.

Links are references to local, self-directed practice records. They are not employer validation, independent assessment, a certificate, job eligibility, or evidence that the learner can perform the task elsewhere. Linking practice never changes manual evidence level or rubric score.

## Verification

Run from `studio/` with `node --test tests/pathways.test.mjs`. Authored replay fixtures cover actual completed runs, round-trip persistence, export provenance, removed/stale/ambiguous runs, unknown criteria, post-selection removal, unknown-field projection, oversized versions/data, and invalid calendar rollover.
