# Judge student spaces and external research handoff

Root `codex-connected-release-20261024-e`, Codex, gpt-6 / effort unknown. User requested person-specific synthetic engineering and CS/informatics judge identities, and further research of the pasted answer with Luna workers/chats plus an updated explanatory brief/prompts. Public website IAM permission was not granted.

## Changed files / ownership

- Root: `studio/server/student-space/model.mjs`, `studio/src/student-space/StudentSpace.tsx`, `studio/tests/student-space.test.mjs`, `tools/judge_spaces/`, `docs/judge-spaces-20261024/` and this handoff under JUDGE-SPACES-024.
- Root's existing integration claim: StudioRouter, AppShell, Studios, AccountPage, learner-entry, learner-workspace catalog codes, local server, stage and Docker definitions. Home has an explicitly separate current claim. Shared profile contract was published before worker implementations in `docs/judge-spaces-20261024/CONTRACT.md`.
- Curriculum workers: `studio/data/student-spaces/{engineering,informatics}.json`, own evidence and handoffs, claims completed. Actual exposed settings were registered, not assumed from requested Luna settings.
- Separate UI worker delivered actual-component tests/evidence under its own claim; independently read and rerun by root. No competing router/provider owner.
- Root README refresh has explicit README.md ownership. It now links verified cloud/student status and the external research pack instead of describing all code as undeployed.

## Interfaces and decisions

Authenticated `GET /api/account/learning-space` returns `{space:null}` for an ordinary account without enrolment, or a normalized synthetic programme space from that UID's protected `progress/enrolment`. Generic PUT progress accepts only `learner_*`, so students cannot assign their own cohort. Public curriculum metadata is shared; private sources/lessons remain owner-scoped. Module links are validated opaque IDs. Navigation restrictions are UI relevance, not the sole authorization barrier.

Local preview has an explicit server-only `KAIRO_LOCAL_CURRICULUM` setting and returns no private hosted links. It is not an authentication mechanism. Port 4188 was restarted only after verifying the exact process and listener. Browser observation remains off; only JSON APIs were checked.

One-shot provisioner creates two fictional email/password accounts and original KAIRO enrichment/module-outline sources and extractive lessons. It records credentials only in the ignored local configuration directory. No real student data, false marks, paid generation, training or GPU use. The first credential adapter attempts failed before seeding; final run succeeded using explicit operator token authentication with quota-project metadata and the existing restricted sign-up API configuration. No credential was printed.

## Verified evidence

Private revision `kairo-app-00004-wcw`, 100% service traffic. 639/639 full suite, final 10/10 focused actual-component/HTTP checks, production build, provisioning of 6+5 materials and **19/19 actual private-cloud API checks** passed. Check `docs/judge-spaces-20261024/README.md` and its named evidence files. The UI test substitutes only the account-context hook; it renders the real Home/Studios components. It does not certify the full router under real browser navigation.

The hosting chat completed a current primary-source review. The second chat did not return the assigned broader specialist memo; it returned unrelated ModuleChooser results and then an authorization concern about messaging another task. Its active research scope was not taken over. Root obtained an independent four-claim audit from a bounded worker in another scope. No claim that all chats, Claude or a model received/acted upon messages is inferred.

External research pack: `RESEARCH-CONTEXT.md`, `RESEARCH-PROMPTS.md` (12 specific prompts). Model/hosting recommendations remain research; no open-source model is declared better without a bounded evaluation, no exact career/mastery forecasts, and no pose-to-SASL translation claim.

## Remaining / next

Service remains IAM-private because the public `allUsers` / service-level `roles/run.invoker` step was rejected by automatic review and the subsequent user response requested person-specific experiences instead of explicitly authorising public access. No alternate public gateway or bypass. Resolve access deliberately before giving judges the URL. Local Home is the visible curriculum preview; hosted demo credentials remain private.

Next useful research/implementation: full mixed-document extraction coverage/typed anchors, selected-region figure explanation with consent, editable cited lesson blocks, then measured tutoring and learning/role analytics. The programme selections are partial and synthetic; no institutional affiliation, registered transcript, human/device acceptance or measured impact/traction. Keep the deleted schedule off and retain source/revision, narrator and capability boundaries.
