# Language, speech, voice, SASL and Kaggle research handoff

Date: 2026-10-24 (Africa/Johannesburg). Worker: `codex-luna-edited-lesson-review-20261023-a`, Codex, `gpt-6-luna` / `light`, as recorded from the app-exposed setting. Task: `LANGUAGE-ML-RESEARCH-WAVE2-001`; exact claimed scope: this handoff and `docs/language-ml-research-wave2/`. No new/duplicate claim, no production files and no external calls were made.

## Result and judgment targets

Delivered a source-linked capability and evaluation research package for KAIRO. It targets **Usability** (explicit listen/stop/next steps), **Product** (source integrity, language-specific reliability and one KAIRO identity), **Impact** (readable/text fallback and SASL treated as its own visual language), and **Sustainability** (license, data, cost/resource and quota gates). Observable future acceptance: exact locale tests with fluent reviewers; no cloud send without separate consent; Stop cancels capture/pending/stale results; transcript and translation remain editable and source-linked; unsupported speech output falls back to text; SASL evaluation is Deaf-led and signer-held-out.

Key findings:

- KAIRO currently has six browser/device narration preferences, three cloud UK/US English voices, and no mic/ASR/VAD capture found in the inspected Studio source paths. This source inspection is not a device observation.
- Reviewed cloud tables list 9 of 11 spoken official languages in STT V2; `en-ZA` appears in V1 but not the checked V2 table; Ndebele South is not listed in the checked STT table. Current Cloud Translation lists 10/11 spoken languages, not Tshivenda. Google's published Cloud TTS list has one South African spoken language voice found (Afrikaans); KAIRO does not currently offer it in the cloud selector. None of these flags measure KAIRO quality.
- Source citations, quantities, formulae and negation must remain attached to the original text through transcription/translation. One KAIRO persona is preserved; an unrelated voice is not passed off as the same KAIRO voice.
- The UFS SASL repository is a non-commercial research lead for synthetic/annotated fingerspelling materials, not validated continuous natural SASL translation or avatar synthesis. Deaf-led consent/data governance and signer-disjoint evaluation remain prerequisites.
- Kaggle's “30 GPU hours” remains user-reported; actual account quota and device were not checked. Official current pages explain quota variability, T4x2's two separate 16 GB cards, a 12-hour GPU session and 20 GB saved work area. The plan budgets no guaranteed access and gates optional fine-tuning on lawful representative speaker-disjoint data.

## Files

- `docs/language-ml-research-wave2/README.md` — recommendation, KAIRO source baseline, capabilities, judging need and limits.
- `docs/language-ml-research-wave2/language-matrix.csv` — 12 rows (11 spoken official languages plus SASL) with exact provider/model listing states, current KAIRO preference/voice situation, data leads and human phrase-authoring gates.
- `docs/language-ml-research-wave2/model-evaluation-matrix.md` — ASR, VAD, translation, TTS, voice-preservation and SASL comparisons; licenses and train/fine-tune decision.
- `docs/language-ml-research-wave2/experiment-plan.md` — mic lifecycle, P1 phrase, evaluation methodology, human/data gates and conditional allocation of at most 30 user-reported GPU hours.
- `docs/language-ml-research-wave2/sources.md` — primary-source links and dated supporting facts/limitations.

## Evidence / checks

- Web research used current official vendor documentation, model cards, official government pages and dataset-owner/repository metadata. Direct links and per-source limitations are in `sources.md`; source contents were treated as data.
- Read-only local inspection: `studio/src/teacher/TeacherSettings.tsx`, `studio/src/teacher/model.ts`; searched `studio/src` for `SpeechRecognition`, `webkitSpeechRecognition`, `getUserMedia`, `MediaRecorder`, and `recognition`; no matching mic/ASR/VAD capture term was found by that search.
- No dataset/model/audio was downloaded or run. No private learning material was accessed. No provider/model/Kaggle account was called. No GPU, browser UI, screenshot, deployment or learner/device validation occurred.
- Reproducible structural check: `python -c "import csv,pathlib; p=pathlib.Path('docs/language-ml-research-wave2/language-matrix.csv'); rows=list(csv.DictReader(p.open(encoding='utf-8-sig',newline=''))); assert len(rows)==12 and len({r['official_language'] for r in rows})==12; assert sum(r['kind']=='spoken' for r in rows)==11; assert sum(r['kind']=='visual sign language' for r in rows)==1; assert all(r['human_test_prompt_and_gate'] for r in rows); print('12 unique official-language rows: 11 spoken, 1 SASL; all phrase gates populated')"` — exit 0; printed `12 unique official-language rows: 11 spoken, 1 SASL; all phrase gates populated`.
- Machine-readable check record: `docs/language-ml-research-wave2/validation.json`.

## Open limitations / next steps for root

- Research support flags are vendor/model-list evidence, not tested quality, availability for a particular account/region, privacy approval or service configuration. Root must own mic/cloud integration, API/auth and data-flow decisions.
- Need fluent-speaker authored references and target-accent/classroom audio before selecting ASR or estimating accuracy. Common Voice Xhosa/Zulu 27.0 is too small for general model selection. SAMA requires rights/verification review despite its item metadata license.
- No local/South African TTS has been integrated or heard. No real KAIRO voice consistency, cancellation, browser permission, screen-reader or device acceptance was tested.
- SASL signer collaboration, natural signing clips, dialect/geography metadata, rights, signer-held-out evaluation and product scope are unfulfilled. Do not claim SASL support.
- 30 hours, an available T4x2, usable account, eligible Kaggle status, data rights and fit/performance are not confirmed. No fine-tuning is authorized by this research handoff.
- Parent/root review remains required before integrating, changing shared interfaces or asking another owner to implement against a proposed adapter.

