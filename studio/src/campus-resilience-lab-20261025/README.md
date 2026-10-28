# Campus Resilience Lab · isolated standalone educational activity

Status: **isolated draft; not mounted in KAIRO, not independently reviewed or deployed**.

## Run the preview

From \`studio/\` with Node **24** installed and \`npm ci\` already completed:

\`\`\`sh
npx vite --host 127.0.0.1
\`\`\`

Open \`http://127.0.0.1:5173/src/campus-resilience-lab-20261025/preview.html\`. This is an isolated Vite preview; do not add a route without coordinator ownership. Run the focused test from \`studio/\`:

\`\`\`sh
node --test tests/campus-resilience-lab-20261025.test.mjs
\`\`\`

**Learning sequence:** read the concept → select a fully-supplied prediction → order four service priorities with native buttons → run six deterministic hourly steps → scrub the scene and read synchronized flow, accessible table and battery state → repeat under cloud cover → see per-service outage coverage in two side-by-side local-unverified attempts. No drag, WebGL, data upload, network access, or external API is required by the component.

## Unit and conservation contract

- Hourly step energy \`E_kWh = P_kW × Δt_hours\`. Every prepared step is **1 h**; total time is six hours.
- Strict priority: for each service in the learner's chosen order, allocate available **solar → grid (if present) → battery AC discharge**. Each group may be partly supplied. Any unused solar charges the battery, subject to input power, SOC ceiling and charge efficiency, then remaining solar is curtailed. Grid never charges the battery in this exercise. Never simultaneously charge and discharge.
- Battery available delivered AC energy is \`min(dischargeLimitKW × hours, batterySOC × dischargeEfficiency)\`. Battery withdrawn from stored energy is \`batteryDelivered / dischargeEfficiency\`.
- Solar to battery is \`min(remainingSolar, chargeLimitKW × hours, (capacityKWh - batterySOC) / chargeEfficiency)\`; stored gain is that input times efficiency.
- \`demand = delivered + unmet\`; \`solar generation + grid used + battery delivered = served + solar charged + curtailed\`; \`SOC_end = SOC_start + stored - withdrawn\`. All quantities are nonnegative within floating-point tolerance, with SOC capped at capacity.
- Replay requires unchanged exact prepared scenario ID, versioned action, validated strict four-service permutation, and full result equality; it detects accidental/naive corruption, **not** malicious signed evidence forgery. Neither the client nor this test code declares evidence verified.

## What is backed by sources versus invented

**Supported modeling principles:** NREL's System Advisor Model battery documentation describes time-series dispatch, model-based battery state and energy-flow accounting; NREL's published battery-storage modeling report describes comparison of PV energy against load and limits from previous-step battery energy. See:
- [NREL SAM battery overview](https://sam.nrel.gov/index.php?Itemid=360&id=94&option=com_content&view=article)
- [DiOrio et al., Technoeconomic Modeling of Battery Energy Storage in SAM, NREL/TP-6A20-64641 (2015)](https://www.nrel.gov/docs/fy15osti/64641.pdf)
- [NREL battery dispatch webinar: outage and critical-load simulations](https://sam.nrel.gov/battery-storage/images/webinar_files/sam-webinars-2023-btm-battery-dispatch.pdf)

The original requested NREL 72586.pdf URL could not be fetched in this session. Do **not** imply that it was reviewed or supports any specific number. External sources are linked as concepts; no figures, drawings, text or screenshots were copied.

**Fictional authored teaching assumptions, not measured by NREL:** invented South African campus; 4 load groups 7 / 4 / 6 / 5 kW, respectively; 22 kW total load; grid on in hours 1 and 6, absent in hours 2–5; grid limit 40 kW; solar profiles baseline 0/7/13/10/5/0 kW and cloud 0/3/8/5/3/0 kW; battery 28 kWh capacity, 18 kWh initial storage, maximum charge and discharge rates 8 kW each, 90% charge and discharge efficiency; no night loads variation; no grid charging; deterministic priority-first single bus policy; no voltage, converter topology, thermal states, battery ageing, uncertainty, transmission losses, reserve, demand response, stability, weather forecast or equipment protection.

The UI represents 2.5D buildings with original SVG polygons. Glowing SVG connector paths are derived directly from the selected hourly values; no random activity or simulated hardware connection. Manual hour scrubbing runs on the exact same six output rows as the reading tables. Reduced-motion CSS and an explicit "Reduce motion" control disable flow animation. At 200% zoom, controls reflow and tables scroll horizontally with explicit headings.

## Untrusted association boundary

\`validateOptionalLessonAssociation\` accepts **metadata only** from a future parent that already knows an owner-reviewed lesson; it checks shape/version but cannot authenticate, authorize or fetch source content. It must never be used to manufacture source claims or save assessment evidence. Real lesson attachment must be introduced separately, after backend owner/auth/consent/revision/replay fencing, independent review and router ownership are agreed. All attempts remain **local-unverified and memory-only**.

## Release gates still open

Exact-head CI (Node 24 serial tests, TS/Vite build, Python coordination), independent subject review, accessible browser/keyboard/200% zoom and real allowed device performance, screenshots where authorised, offline session recovery and route integration. A static code/test inspection cannot replace actual device evaluation. No hardware or operational electrical guidance is offered.
