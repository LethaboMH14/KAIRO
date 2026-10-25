# Restore the multi-source lesson page heading

The actual hosted browser walkthrough found that BundleClassroom reused sw-header, which the shared KAIRO shell intentionally hides for the older workspace header. The lesson content rendered, but the page H1 was not visible. Use the existing visible sw-heading class instead. No API, data, source citations, security policy or narrator contract changes.

Acceptance: clean production build and the actual hosted synthetic lesson -> motor -> direction -> CV walkthrough. The pre-fix heading observation remains in browser-cloud-heading-failure.json. The font/UTF-8 fixes are already merged separately in PR115.
