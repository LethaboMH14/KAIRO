# Hosted font/encoding repair — 26 October 2026

Actual authenticated production browser testing found EngineeringStudio stylesheet preload failing while the same authenticated CSS request returned200. Resource traces identified its nested fonts.googleapis.com/css2 import blocked by the existing strict CSP. The local preview had no equivalent CSP, so local studio screenshots alone did not reveal this. Removed that external font dependency and use the existing bundled KairoManrope font; CSP is unchanged.

The browser also showed replacement characters in route titles. Strict byte decoding identified four files with invalid UTF-8 introduced during Windows text writes: router, bundle classroom, direction and engineering programme JSON. Recovered only the invalid CP1252 byte sequences while preserving existing valid UTF-8, then wrote UTF-8 explicitly. Two actual-source regressions fail on merged pre-fix source and pass on the repaired source: strict UTF-8 for application code/public JSON and no off-origin CSS imports forbidden by hosting CSP.

Before evidence: font-before.txt. After evidence: font-after.txt. This is a release repair, not permission to relax CSP, expose private material, activate schedules or claim browser acceptance before the repaired revision is retested.
