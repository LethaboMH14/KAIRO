# Person-specific judge spaces and research pack

Verified 24 October 2026. Root `codex-connected-release-20261024-e`, gpt-6 / effort unknown. Hosted revision **kairo-app-00004-wcw**, 100% service traffic, **IAM-private**. The user asked for person-specific synthetic students, not a broad public-access permission. No public IAM change was made.

## Implemented

- `KAIRO-ENG-0001`: fictional Lerato; Wits Mechanical Engineering, year 3, 2026, six selected official modules. Relevant motor/pump activities; no generic CS or stock-control studio card.
- `KAIRO-INF-0001`: fictional Thabo; UP BCom specialising in Information Systems, year 2, 2026, five selected INF core modules. Relevant computer-science request trace; no engineering/pump/stock studio cards.
- Server-owned enrolment is resolved by the authenticated Firebase UID from protected `progress/enrolment`. The generic progress-write API rejects this ID. Query parameters do not choose the cohort. Missing enrolment retains the ordinary private-material account flow; malformed enrolment fails visibly.
- Each account has its own prepared source/lesson links (six and five). Motor/pump-linked notes are authored public-reference enrichment. Other items are **module outlines**, not complete course notes. No grades, achievements, completed activity or real university identity was seeded. Student IDs are labels, not passwords.
- Home shows programme, year, module code/title, reference provenance and relevant next actions. Studios and route guards tailor the demo navigation to the assigned programme. This UI tailoring is separate from server-enforced ownership of private sources, lessons and progress.
- Local port 4188 now displays a server-configured engineering curriculum preview. It has zero hosted material links and does not copy cloud private files. Its account status still says local preview. Refresh Home, rather than expecting the existing `/sources` tab to become a curriculum dashboard.

## Credentials and access

The private judge login email/password file is `tools/connected_release/judge-credentials.local.json`, excluded by the existing `*.local*` rule and never staged. Do not paste it into research chats or submission/public docs. The account logins use email/password; the synthetic IDs identify the profile shown after login. Share credentials only through the intended private judge channel.

External judges cannot yet open the IAM-private service directly. An explicit public-login-page/access decision is still required; private account protection does not itself make the website reachable. Do not work around the rejected `allUsers` service invocation change through another gateway or identity. No public reachability check is claimed.

## Verification

- `full-tests.txt`: **639/639**, zero failed/skipped, after adding profile/model integration.
- `final-focused-tests.txt`: independent final rerun **10/10** of actual material HTTP routes, profile resolver and shipped StudentHome/Studios rendering.
- `build.txt`: TypeScript/Vite production build passed; existing >500 kB Three/R3F bundle warning remains.
- `provision-evidence.json`: two synthetic profiles and 11 account-owned prepared materials; credentials/UIDs omitted from report.
- `live-check.json`: **19/19 real private-cloud API checks**: both logins, owner-selected programmes despite query tampering, expected module/material counts, non-writable enrolment, relevant studio metadata, own lessons readable and the other account's source/lesson returning 404.
- `local-check.json`: API-only engineering preview check. No browser page, screenshot, headless browser or human/device acceptance.

Earlier 24 cloud foundation checks remain in `docs/connected-release-20261024/live-check.json`; do not conflate those older results with the 19 checks on this revision. No new paid model call, GPU deployment or training was needed to create the judge examples.

## Research deliverables

1. **Start here:** [explanatory build brief](RESEARCH-CONTEXT.md), then [12 focused prompts](RESEARCH-PROMPTS.md). Attach the brief and one prompt to an external research AI; do not attach credentials/private material.
2. [Provider/hosting review](../provider-hosting-review-20261024/README.md): primary-source claim ledger, corrected assumptions, three bounded proposed experiments. No experiment was executed and no current credit balance was queried.
3. [Independent model evaluation audit](../model-evaluation-audit-20261024/README.md): language/licence limits, Chronos/mastery, embedding/job probability and SASL claims. No model was run or downloaded.
4. [Earlier multimodal research](../multimodal-research-wave2/README.md) and [language/ML research](../language-ml-research-wave2/README.md) provide wider candidate matrices. They remain proposals, not installed pipelines; recheck dated versions/free model eligibility before tests.
5. Two bounded Luna workers delivered engineering/informatics provenance; the engineering worker also delivered actual UI checks. The hosting chat completed its review. The other existing chat returned unrelated ModuleChooser work and did not deliver the broader specialist-model memo requested in this wave. Its active research claim was respected; root used an independent worker in a separate scope to review the four critical promises. Do not treat messages sent as acknowledgement of completed research or clear another owner's claim.

## Next implementation choices

Use prompt 1 to improve **mixed-document coverage and selected-region figure explanation**, then prompt 4 for **editable, cited lesson blocks and representations**. Keep the current managed model API baseline until a measured quality/cost gap justifies self-hosting. Engineering calculations stay deterministic; forecasting/employability scores and SASL translation need separate validated evidence.

The source selection is intentionally bounded, not a complete degree or registered transcript. Semester unknowns remain null in the engineering pack. Native learner usefulness, official curriculum completeness, institutional affiliation, real recovery-email delivery, account deletion/retention workflows, full route/device acceptance and calibrated learning/career models remain open.

Judging need: Product/Usability improve through an immediately relevant start; Intelligence through traceable module/activity matching; Creativity/Presentation through a coherent curriculum-to-studio journey; Sustainability through reusable account/data contracts. Impact and learning gains remain hypotheses until measured with learners. No official scores or guaranteed win are asserted.
