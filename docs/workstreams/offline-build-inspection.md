# Offline build dependency inspection

Use the no-dependency Node CLI to inspect a known Vite `dist` directory without changing it:

```powershell
node tools/offline-inspection/inspect.mjs studio/dist
```

The report reads `index.html`, follows absolute `/assets/*.js` and `/assets/*.css` references, and uses a small bounded JavaScript scanner to follow recognized static `import`, `export ... from`, and side-effect imports. This is not a complete JavaScript parser. Dynamic `import()` calls are intentionally excluded because they are not part of the static offline shell. Declarations beyond the scanner's 200-token bound and unrecognized static declarations are reported as unsupported, and cause a nonzero exit. Same-origin asset references are realpathed and contained within the supplied build directory before their contents are read. Out-of-root symlinks are reported without inspecting their targets. Malformed percent-encoded paths are reported instead of aborting. No network access is made.

The output includes the path set, counts and byte totals, missing/unsafe references, unsupported syntax, query/hash paths, external HTML/CSS/font resources, and API/private paths in the discovered shell references. It compares the discovered JavaScript import edges with the regex currently used by `prepareOfflineShell` and lists differences using only previously checked in-root file contents. A nonzero exit status indicates a usage error or a reported missing, unsafe, unsupported, query/hash or API/private path.

The tool sets `currentBuildConfirmed` to false. Do not describe output from a `dist` folder as current source evidence until the build identity and timestamp are confirmed independently. This QA task used only small temporary fixtures; it did not inspect the app's actual `dist`, run a browser, install a service worker, or claim offline acceptance.

Fixture tests cover compact/static import forms, dynamic import exclusion, missing dependencies, external CSS/font URLs, API path references, read-only behavior, malformed encoded paths, scanner bounds, and an out-of-root symlink whose target's distinctive imports/resources must not be observed. Run them with:

```powershell
node --test tools/offline-inspection/inspect.test.mjs
```
