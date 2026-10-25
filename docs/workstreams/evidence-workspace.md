# Evidence workspace portfolio downloads

The evidence workspace now offers **Download portfolio HTML** and **Download portfolio JSON**. Each action reads the saved version 1 profile, uses its raw saved case records, and optionally includes the current in-memory WorkSim run. It passes raw records to the replay validating portfolio builder; it does not pass previously summarized artifacts back as source data.

An incomplete or invalid case is listed by source index in the downloaded file. Download feedback reports how many records were omitted. If saved progress cannot be read, the export fails visibly and leaves browser data unchanged. No export action saves the current WorkSim run, uploads anything, or submits an application. Existing individual Markdown downloads are preserved.

HTML and JSON use `text/html;charset=utf-8` and `application/json;charset=utf-8`. The standalone HTML shows per-attempt support exposure for simulation events; the shop-case model declares help exposure unknown because it does not record it. Records remain self-reported, local and unverified. Synthetic scenario data stays labeled synthetic.

`studio/tests/evidence-workspace.test.mjs` exercises actual records through the same pure download-preparation helper used by the UI, and checks JSON/HTML contents, help exposure, linked lesson identity, incomplete-run rejection and invalid profile handling.

## Learner-facing presentation

The workspace uses the shared ivory/olive/brass continuity palette and 16px main copy with larger task headings and mobile-sized download controls. Tabs and actions use learner language such as **Saved practice**, **Service case**, and **Check my report**. Scenario identity and replay explanation stay in expandable case details; fictional, local, self-reported and unverified status stays visible beside the relevant record.

Portfolio feedback distinguishes errors (`role="alert"`) from completion of the user action (`role="status"`). It says “Download requested. Check your browser downloads” because an anchor click cannot confirm that the browser saved the file. The message reports excluded counts without claiming successful receipt.

Validation after the UX increment: `node --test tests/evidence-workspace.test.mjs tests/portfolio-export.test.mjs` passed 7 tests; scoped TypeScript compilation of the workspace, helper and adapter passed. No browser or visual acceptance is claimed.
