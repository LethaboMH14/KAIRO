# PR 48 persisted provider metadata repair proposal

Prepared 25 October 2026 from PR #48 head `21d3389820cc108d9b62a4a8f8f12dc6e6d23eb8`. PR #48 remains open and draft. Its author/branch is `LethaboMH14:feat/issue46-v2-lesson-record-20261025-a`; the current review says the original record and test paths remain owned by that implementer. This task did not claim or change those paths.

## Finding and reproduction

The v2 source-selection contract at the same PR head defines the cloud allowlist as `google`, `groq`, `openrouter`, and `aiml`. It rejects provider fields for local selections. `createLessonV2Record` checks cloud consent and a string provider when constructing a record, but persisted `envelope(record)` checks only `mode` and never validates `provider` or `model`. Its local branch also accepts extra provider/model metadata.

Reproduction used the actual PR #48 `record.mjs`, copied into this task's `scratch/` folder with only its two relative imports rewritten to absolute `file:` URLs pointing at the exact PR-head `lesson-contract.mjs` and `workspace/model.mjs`. The copied module SHA-256 before import rewrites was `64601D6B27CFF82CD601723ADA312E63EAA57F9A136BA70A8E711B3C01D527BD`. Fixtures use the actual `prepareOwnedLessonBundle` and `createLessonV2Record` contracts. A stored cloud record changed to `provider='attacker-provider'` and `model={unexpected:'object'}` still passes `verifyLessonV2Record`; a local record with `provider='google'` and a model string also passes.

Evidence from exact PR head:

- Existing PR test file: **8/8 passed** locally with Node 24.18.0 (`node --test studio/tests/lesson-v2-record.test.mjs`).
- Isolated proposal proof: **4/4 passed**. Two tests confirm original-module acceptance; two verify rejection/valid paths with the proposed guard.
- No provider calls, cloud calls, browser, source edits, or owner-path claims occurred.

## Recommended schema rule

- `cloud-v2`: persisted `provider` is required and must be one of the same four providers accepted by `parseLessonSelection`. `model` remains optional because the constructor already permits omission; if present it must be a nonblank string of at most 160 characters.
- `local-extractive-v2`: persisted `provider` and `model` fields are forbidden.
- Construction rejects a supplied malformed model instead of silently dropping it. Omitted/null model remains valid.

The current record schema has no provider-specific model catalog. This proposal validates the model field's type, bound and mode association; it does not invent a provider/model compatibility registry. `provider` is currently copied from the selected request provider, not necessarily the actual fallback provider that served generation; actual provider attribution is a separate schema decision.

## Proposed unified patch

```diff
--- a/studio/server/lesson-v2/record.mjs
+++ b/studio/server/lesson-v2/record.mjs
@@
 const ID=/^[a-f0-9]{24}$/;
 const SHA=/^[a-f0-9]{64}$/;
+// Mirror parseLessonSelection's accepted cloud provider set.
+const PROVIDERS=new Set(['google','groq','openrouter','aiml']);
@@
      !SHA.test(record.bundleRevision||''))throw malformed();
+  if(record.mode==='cloud-v2'){
+    if(typeof record.provider!=='string'||!PROVIDERS.has(record.provider)||
+       (Object.hasOwn(record,'model')&&
+        (typeof record.model!=='string'||!record.model.trim()||record.model.length>160)))throw malformed();
+  }else if(Object.hasOwn(record,'provider')||Object.hasOwn(record,'model'))throw malformed();
   const parsed=parseLessonSelection({sourceRefs:record.sourceRefs,mode:'local'});
@@
   if(raw.mode==='cloud-v2'){
-    if(typeof bundle.request.provider!=='string'||!bundle.request.consent)throw malformed();
+    if(typeof bundle.request.provider!=='string'||!PROVIDERS.has(bundle.request.provider)||!bundle.request.consent)throw malformed();
     raw.provider=bundle.request.provider;
-    if(typeof model==='string'&&model.trim()&&model.length<=160)raw.model=model;
+    if(model!==null&&model!==undefined){
+      if(typeof model!=='string'||!model.trim()||model.length>160)throw malformed();
+      raw.model=model;
+    }
+  }else if(model!==null&&model!==undefined){
+    throw malformed();
   }
```

Append regression tests in the currently owned `studio/tests/lesson-v2-record.test.mjs` for: forged cloud provider on persisted read; missing/unknown cloud provider; malformed, blank and overlong persisted model; local record carrying provider or model; valid allowed provider with omitted/valid model; and constructor rejection of invalid supplied model. Keep existing eight tests unchanged. The scratch proof tested these cases against a copied original module plus the hunk above; no production source file was edited.

## Governance and boundaries

Issue #46 is open and frames the v2 record as a separate versioned contract. PR #48 is open/draft, based on older main `b6a4be3b36426a73125b98e78fb23d407c8afdb7`; current main is `1997ba9f046f6d4122169cb26a72e89cc60befd1`. The PR head's own review requests this exact correction before merge. The PR still does not mount v2 records into learner routes. Keep route compatibility and current+archived source revision checks as separate integration gates.

This is a repair proposal and proof, not an applied source fix, CI rerun, approval, or merge recommendation. The original owner should apply the source/test hunk on their claimed branch, then rerun exact-head full CI and independent review. Follow-on maintainability option: export the provider allowlist from the selection contract so record and request validation share one constant.
