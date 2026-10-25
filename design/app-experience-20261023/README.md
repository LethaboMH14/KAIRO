# KAIRO complete experience review

Open `index.html` directly. No installation, server or account is needed. Start with **Journey → First visit**, or open **All screens**. Use the main buttons to follow the learning path; review-footer Previous/Next traverses the selected journey. **Phone view** changes the layout; **Build notes** describes existing route foundations versus planned integration. **Visual boards** opens six generated reference images.

This is a design prototype containing 112 screen states, not the running production application. It uses real saved Rain and studio imagery with source hashes in `assets/provenance.json`. It does not call a network service, upload selected file bytes, use a microphone, authenticate a person, contact an employer or create a public link. State remains in this tab's memory. The sample-notes download is a real local Markdown download, explicitly labelled.

Authoritative copy/navigation: `screens.js` and the rendered HTML. Machine-readable export: `screen-contract.json`. Generated image-board wording, personal names, dates and language/service availability are illustrative and must not override these contracts. Selected brand reference: `assets/brand-reference.png`. The logo shown in HTML is a layout reconstruction; final path master/wordmark production and reproduction checks remain required.

Re-run structural checks with `node verify.cjs` and catalogue generation with `node build-catalogue.cjs`. These checks do not use browser automation. `verification.json` records their limits. Prior browser observation denial is preserved; no browser/audio/device acceptance is claimed.

Read the plan in `../../docs/blueprint/experience/README.md` and `BUILD-PLAN.md` before implementing. Existing app routes are foundations; a matching route does not prove the new layout or feature already exists. Brand approval and this design task do not authorise deployment or public applications.
