# Engineering in the main KAIRO app

22 October 2026. Open `/engineering` or choose **Explore studios → Engineering Studio** from the Computer Science home page. On the currently reported preview, the route is http://127.0.0.1:4173/engineering. The app must run from this project and serve the current source/build.

The integration lazy-loads Claude's delivered EngineeringStudio with its existing onExit contract. Its Back to studios action returns to `/`. MotorScene remains separately lazy-loaded. No dependencies, shared provider, server or Engineering implementation files were changed.

The studio picker now also links the source workspace, workplace practice, role preparation, progress and teacher rehearsal, so the existing learning-to-work features are reachable from the home screen. Its existing modal scrolling and focus handling remain in place. README's obsolete statements about unfinished source intake and unclaimed Engineering have been corrected.

The delivered motor supports part selection, cutaway, staged explosion/reassembly, an illustrative operating field, a drawing alternative, reduced motion, captions, a stationary-part question and synchronous-speed practice. These behaviours were verified in Claude's isolated harness; see coordination/handoffs/claude-engineering.md and docs/engineering/verification.md. They are not newly browser-verified integration claims.

## Checks on the integrated build

- TypeScript/Vite production build passed. The lazy EngineeringStudio and MotorScene chunks are emitted. A shared Three/OrbitControls chunk still produces the existing size warning; this is not a measured performance guarantee.
- All 29 application tests passed.
- All 21 Engineering calculation/asset tests passed, rerun against the shipped source and GLB.
- Runtime asset/geometry hashes match Claude's manifest.
- New integrated browser interaction check remains **pending**: the computer-use tool rejected authority to observe the local preview under its URL policy. No alternate browser, raw protocol or indirect UI method was used to bypass that restriction. No fresh screenshot or phone check is claimed.

Claude previously reported 50/50 isolated headless Edge scenarios, with performance varying substantially on the shared Intel UHD laptop. That is prior module evidence, not current main-app browser acceptance. Final integration acceptance still needs home-picker navigation, part selection, cutaway/explosion/operation, calculator, 2D fallback and exit checks in an authorised browser, plus a real phone/accessibility review.

## Boundaries

The operating demonstration uses exaggerated slip and visual playback speed; the calculator gives rotating-field synchronous speed, not a real loaded shaft speed. The model is educational and has not received qualified engineering content review. It does not confer practical electrical competence.

No avatar or live motor-expert AI was added. CHARACTER-002 and CHARACTER-002-TOOLS remain actively owned by claude-character-20261021-a. The latest bus records Rain v3 as the selected base, with MPFB as an alternate; the character contract remains in progress. Integration has not modified those files, exported a final character, invoked Claude automatically or provisioned cloud services.
