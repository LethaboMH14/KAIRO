# God's Eye View: opportunity, architecture and pitch strategy

Research date: 11 October 2026. Repository documentation, package metadata and selected source files were reviewed; the applications were not installed or benchmarked. Rankings are strategic judgments, not measured outcomes or probabilities of winning. This memo extends the earlier six-track research.

## Recommendation

Build **Lifeline**, a community continuity app, under **Climate resilience and essential services**, with small-business continuity as the secondary benefit.

Start with one specific problem: coordinating available backup water for community kitchens and small food businesses during a confirmed interruption. God's Eye View provides an operator's geographic view. Our original work is the dependency model, constrained allocation, verification workflow and offline completion loop.

Problem statement:

> When water stops, community kitchens and small food businesses must decide how to keep operating with limited stored water, transport and money. How might we turn confirmed local needs and available backup supplies into an understandable, achievable plan before services shut down—even with intermittent connectivity?

Pitch sentence: **Lifeline helps a community decide what to do next to keep essential services running.**

This is the strongest use of this repository for the requested ambitious spatial demo. PaperBridge remains a stronger fallback when the team cannot recruit operators, inventory real resources or test a coordination workflow. A beautiful map cannot compensate for missing partners.

## What God's Eye View contributes

[Repository](https://github.com/bilawalsidhu/gods-eye-view): browser-based Cesium globe, spatial layers, voice control, annotations and scene tours. Its README explicitly distinguishes simulated traffic and estimated camera poses from observations. Sensor styles such as FLIR are visual effects over the normal globe. Tracking satellites does not provide a live overhead street video feed.

[Package metadata](https://raw.githubusercontent.com/bilawalsidhu/gods-eye-view/main/package.json): JavaScript modules, Cesium and Vite; exports include application, infrastructure/GeoJSON, scenes and tool interfaces. It also declares tests and boundary checks. These are useful integration signals, not proof that our fork will be reliable.

[Traffic source](https://raw.githubusercontent.com/bilawalsidhu/gods-eye-view/main/src/layers/traffic/model.js): distinguishes simulated roads/flow and uses road-length approximations intended for rendering rather than navigation. Do not route deliveries using animated vehicle dots.

[Annotations source](https://raw.githubusercontent.com/bilawalsidhu/gods-eye-view/main/src/annotations/index.js): provides a renderer/engine integration point for geographic marks and callouts. Our dependency arrows represent relationships verified by operators, not utility pipes inferred from imagery.

[Data catalogue](https://github.com/bilawalsidhu/gods-eye-view/blob/main/DATA_SOURCES.md): external map, weather, imagery and telemetry providers have their own coverage, refresh times and terms. South African camera coverage and detailed local utility topology have not been established. Global forecasts do not establish street-level flood safety.

[License](https://github.com/bilawalsidhu/gods-eye-view/blob/main/LICENSE): source is MIT, with separate third-party data and asset terms. Some bundled datasets are noncommercial. Retain notices, select layers deliberately and audit every asset used in a commercial deployment. Do not assume Google imagery can be downloaded for an offline pack.

## Evidence and choice of pilot

[Stats SA General Household Survey 2025, published 26 May 2026](https://www.statssa.gov.za/publications/P0318/P03182025.pdf):

- Printed page 33 reports 56.8% experiencing water interruptions. This must not be described as 56.8% experiencing prolonged interruptions.
- Printed page 34 reports 37.6% with water-supply dysfunction under the extended-interruption measure discussed there.
- Printed page 35 reports 43.9% for eThekwini households under the metro extended-interruption comparison, versus 7.8% in Cape Town.
- Among households experiencing interruptions of two days or longer, 29.8% used tankers or water vendors as alternatives; 43.7% relied on stored water.
- Printed page 63 reports 22.0% of households with inadequate or severely inadequate food access.

These figures establish need. They do not establish how much Lifeline will reduce downtime, how many customers will adopt it, or how many jobs it will create. Confirm local demand and resources through interviews.

[KZN Premier, 12 May 2022](https://www.gov.za/news/speeches/premier-sihle-zikalala-growth-coalition-breakfast-12-may-2022): estimated flood economic impact around R20 billion and reported a survey of 826 affected companies with R6.4 billion in damage. These are historical estimates reported at that date, not current annual totals, and the company figure must not be added to the overall estimate as a separate loss.

An eThekwini pilot is defensible if there is access to participating kitchens and delivery operators. Choose the actual ward by partner access and observed interruption history. National statistics alone do not identify the best launch neighbourhood.

## Fit across all six tracks

Fit describes the usefulness of this spatial repository, not the importance of the social problem.

| Track | Fit | Useful application | Required evidence or gap |
|---|---|---|---|
| Climate and essential services | Very high | Lifeline: backup-water coordination with deadlines and service dependencies | Confirmed interruption, site needs, supplier capacity, routes and operator acceptance |
| Entrepreneurship and SME growth | High | ColdLoop: arrange spare cooling and transport before an interruption threatens stock | Actual cooling capacity, sensors or verified temperature readings, consent and food-handling protocols |
| Youth employment | Moderate | OpportunityReach: jobs reachable at shift times after transport costs and minimum take-home constraints | Verified vacancies, actual fares and travel schedules; missing taxi data cannot be invented |
| Higher education | Moderate/low | CampusReach: compare feasible study pathways including transport, funding and connectivity | Official eligibility/funding rules, costs and timetables; document completion is usually more important than 3D |
| Financial inclusion | Low/moderate | PayRhythm Local: explain how travel and disruption change an irregular-income household's cash runway | Consented budgets and verified local costs; spatial display is secondary |
| Safety and GBV | Low for personal data; moderate for service operations | CareRelay: staff-only service availability and referral handoff | Survivor-led design and service partners; no public survivor locations, movement trails or inferred safe routes |

Choose one primary track. Serving several groups affected by one outage is coherent; building six unrelated products is not a credible hackathon scope.

## Ranked concepts

These are new combinations evaluated for this repository-led direction. They are not a replacement numerical scoring model for the earlier eight-idea ranking.

| Rank | Concept | Combination | Why it stands out | Principal weakness |
|---|---|---|---|---|
| 1 | Lifeline | GEV + dependency graph + allocation solver + offline field tasks | A geographic problem becomes a feasible intervention, with an explanation and completed handoff | Inventory and coordination depend on real people |
| 2 | ColdLoop | GEV + temperature telemetry + constrained matching/routing | A real sensor reading changes where a trader should move stock; very tangible demo | Food safety, transport, storage consent and sensor calibration |
| 3 | OpportunityReach | GEV + multimodal routing + verified work trials | Measures a candidate's reachable opportunity set; tests which transport intervention opens more options | Reliable informal transport data and actual employers |
| 4 | PaperBridge + CampusReach | OCR + official rules + accessible forms + optional locality view | Direct, measurable application blocker removal with fewer external dependencies | GEV has limited value here and could distract from the strongest workflow |
| 5 | WardLens | GEV + local 3D reconstruction + offline facility audit | A coordinator can inspect a poorly mapped site and attach verified operational records | Reconstruction is visually compelling but expensive; images do not prove structural or water safety |
| 6 | CareRelay Operations | Capacity graph + private referral tasks + limited geography | Reduces failed handoffs when a service cannot accept a referral | Requires specialist partners and careful privacy design; a surveillance aesthetic undermines trust |

ColdLoop may move to first place if the team already has a trader, a cold-storage owner and a real sensor. Lifeline leads when water operators and community kitchens are accessible. PaperBridge leads when neither operational network exists.

## Lifeline: the distinctive mechanisms

### 1. Service dependencies with time

Each participating site supplies its own verified requirements: water use, remaining storage, operating deadline and acceptable backup source. Model service interruption from those inputs. Do not invent buried network connections or infer water quality from an image.

For a constant-use illustrative model, time remaining = usable stored litres / expected litres per hour. Show the uncertainty in both values. Real sites may have batch use, minimum hygiene requirements and restrictions that require different rules.

### 2. Compare feasible interventions

Use optimization to propose allocations subject to available volume, vehicle capacity, delivery windows, acceptable sources, budget and confirmed access. Essential-service minimums and a transparent fairness rule precede commercial value. Keep service-hours and estimated revenue as separate metrics.

Compare a simple baseline such as first-come dispatch against the proposed plan using the exact same inputs. Never label scenario estimates as lives saved or verified money saved.

### 3. Ask the missing question that matters

If the best plan depends on an old tank reading, show two possible outcomes and request an update. A useful question is: “Is supplier A's water still available?” The answer can change the allocation more than adding another map layer.

For an MVP, run explicit scenario branches and identify the unresolved fact that changes the selected plan. Call it decision sensitivity. Formal expected value of information requires calibrated probabilities, which we do not yet have.

### 4. Close the loop on the phone

Operator sees a short task, acknowledges capacity, approves an allocation and records completion. Use an offline outbox with event IDs and duplicate suppression. A disconnected phone can save work; a remote coordinator only sees it after connectivity or a configured local link returns.

A QR receipt can link a delivery and recipient confirmation. It is an audit aid, not proof that physical quantities are correct or a fraud-proof credential.

### 5. Show consequences understandably

Use the globe for an operator overview and one short cinematic transition. The everyday phone interface needs three actions: report status, confirm availability, view my task. Display litres, deadlines and next action. Every important fact carries source, observation time and expiry.

Use English plus one pilot language, for example isiZulu where participants prefer it. Human-review critical text and use recorded prompts as an offline baseline. Speech recognition and code-switching quality must be tested with local speakers on actual target devices.

## Open-source components worth combining

Licences below describe the main source repository when verified. Models, sample assets, map data and distribution obligations require separate review. These projects are selected for documented capabilities and useful engineering foundations; no claim of equivalent polish or successful interoperability is made.

| Project | Field | Role | Source licence / integration limit |
|---|---|---|---|
| [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) | Spatial visualization | Operator globe and scene storytelling | MIT source; separate provider/data/asset terms |
| [NetworkX](https://github.com/networkx/networkx) | Graph science | Dependencies, affected sites and intervention explanation | BSD-3-Clause; requires our domain model |
| [Google OR-Tools](https://github.com/google/or-tools) | Operations research | Allocation, schedules and route constraints | Apache-2.0; only solves constraints supplied by us |
| [PMTiles](https://github.com/protomaps/PMTiles) | Cartography | Compact ward map archive for a separate light mobile view | BSD-3-Clause implementations; locally available archive and reader required for offline use |
| [ODK Collect](https://github.com/getodk/collect) / [docs](https://docs.getodk.org/collect-intro/) | Field research | Fast offline partner inventory and status reporting | Review selected release's licence; use as a collection tool, not an assumed embeddable UI library |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Document vision | Extract litres/time/site from a printed notice or delivery note for confirmation | Apache-2.0 source; model/runtime choice and accuracy need testing |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Edge speech | Local ASR for a language/device combination that passes evaluation | MIT source; model size, memory and language support are not automatic |
| [Meshtastic firmware](https://github.com/meshtastic/firmware) | Radio communications | Optional small status messages between supplied LoRa nodes | GPL-3.0; requires hardware, legal regional settings and measured radio coverage |
| [USEPA WNTR](https://github.com/USEPA/WNTR) | Water engineering | Later hydraulic disruption/repair simulations on a supplied network model | Revised BSD; requires topology, demands and calibration; synthetic models must be labelled |
| [OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner) | Transport planning | OpportunityReach travel feasibility | LGPL-3.0-or-later main licence; GTFS/OSM inputs; no automatic minibus timetable coverage |
| [gsplat](https://github.com/nerfstudio-project/gsplat) | Graphics research | Optional reconstruction of a partner site from authorized imagery | Apache-2.0 source; CUDA/training, capture and registration work; not a GEV plug-in |

The high-value crossing of fields is **spatial visualization + graph science + operations research + field-work software**. Add OCR only if document capture is a real bottleneck. Add speech only when it works for the pilot. Add radio only after a functioning software loop.

Do not put every repository into the first build. Core: GEV, NetworkX, OR-Tools, custom field UI and a small persistent store. ODK can accelerate the initial survey. PMTiles is the next addition if the mobile map is necessary. WNTR, gsplat and radio are stretch research tracks.

## Architecture and data

Field report -> validation/verification -> timestamped event store -> service dependency model -> constrained allocation -> human approval -> operator task -> completion event -> updated state.

GEV reads a sanitized projection of the event store. A small API separates the JavaScript visualization from Python graph/optimization services. Keep raw reports and private contact details out of shared scene links.

First pilot data:

1. One small geography and 6–10 consenting sites.
2. Confirmed needs and remaining supplies entered by their operators.
3. Two backup suppliers and one or two actual delivery operators if available.
4. A small road graph with measured or clearly estimated journey times and manually confirmed closures.
5. Source suitability attested through the participating operator's accepted process; imagery is not a water-quality test.

Use real geography where permitted and visibly label the interruption/resources as simulated whenever they are fixtures. Use actual partner data only with consent. A ward map can use licensed OSM-derived data with appropriate attribution and applicable database obligations.

## Demo: three minutes

- 0:00–0:20: one kitchen operator, one deadline, one interruption. Fly to the ward.
- 0:20–0:45: show the verified service dependencies and estimated operating deadlines.
- 0:45–1:20: compare two allocations with quantities, delivery windows, constraints and a visible baseline.
- 1:20–1:45: reveal an expired supplier reading. Ask for the one update that could change the plan, then recompute it.
- 1:45–2:20: a second phone acknowledges the revised task and records a delivery offline.
- 2:20–2:45: restore connectivity and show one deduplicated completion updating the coordinator's view.
- 2:45–3:00: show measured demo metrics, pilot partner needs and the commercial hypothesis.

The audience should be able to explain who uses it, what they do and what changed. The visual climax is a consequence of a completed action.

## Build sequence, assuming a 72-hour event

Hours 0–8: confirm rules on existing code, licences and judging; interview operators; lock the ward and one workflow; define fixtures and provenance labels.

Hours 8–24: implement persistent reports, graph and allocation constraints. Validate conservation of water, capacity limits and impossible schedules against hand-calculated examples. Prove the workflow in a basic interface.

Hours 24–40: integrate GEV annotations and the slim phone workflow. Use a stable pinned upstream commit. Add source/expiry indicators and approval state.

Hours 40–56: offline save/resume/sync with duplicate suppression, language review and a comparison baseline. Include a no-feasible-plan result.

Hours 56–72: device testing, partner walkthrough, measured demo outcomes, pitch and a recorded backup clearly labelled as such. Stop adding technologies.

## Judging strategy

[Official FAQ](https://appoftheyear.co.za/faqs/) names product, creativity, usability, sustainability, impact, presentation and intelligence. It appears to describe the broader awards process. It is not a verified weighted scorecard for this particular hackathon. Confirm event-specific rules, reuse policy, deadlines and category expectations before development.

| Criterion | Evidence to demonstrate | What remains unproven |
|---|---|---|
| Product | Report -> plan -> acknowledgement -> completion works on two devices | Wider operational reliability |
| Creativity | Decision sensitivity plus understandable service consequences | Distinctiveness against local competitors |
| Usability | Operators complete tasks in the chosen language; measure errors/time | Broader accessibility and language coverage |
| Sustainability | One plausible buyer: NGO coordinating several kitchens; pilot cost estimate | Willingness to pay and unit economics |
| Impact | Allocation feasibility, delivery success and measured interruption experience in a pilot | Causal downtime reduction at scale |
| Presentation | One person's problem and one visible completed action | Delivery under event conditions |
| Intelligence | Recompute feasible allocations under changed capacity/closures; explain infeasibility | Any learned forecasts, which need data and validation |

## Commercial path and honest differentiation

First buyer hypothesis: an NGO or network coordinating multiple community kitchens. Offer a paid coordination service once a small pilot shows useful outcomes. A supplier or bank-sponsored SME network could be a later channel; no FNB endorsement, API access or partnership is assumed.

Measure supplier confirmation effort, cost per coordinated incident, support time, operator retention and willingness to pay. Do not take an emergency markup from vulnerable users as the default business model.

[One Concern's published work](https://oneconcern.com/en/news/hurricane-ian-2022-putting-our-digital-twin-to-the-test/) already describes dependency-based infrastructure and business interruption analytics. Do not claim the invention of resilience digital twins. Our differentiation hypothesis is small community operators, confirmed local capacity, accessible offline tasks, transparent uncertainty and completed interventions. Validate this through local competitor and user research.

The most important pre-build gate: can the team recruit two real users and demonstrate an actual operational handoff? If yes, pursue Lifeline. If the available partners instead have cooling capacity and stock at risk, pursue ColdLoop. If neither is possible, build PaperBridge with an excellent document-to-action workflow and keep the geospatial demo optional.
