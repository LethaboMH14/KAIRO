# Rater rubric (blind scoring)

You are scoring hackathon concepts for the FNB App of the Year Hackathon 2026 (South Africa). You did not write these ideas. Score each concept on seven criteria, 1–5 integers. The criteria are the organiser's published judging questions (verbatim in arena/01-rules-spec.md §3). The anchors below make a score mean the same thing for every rater.

Context you must apply:
- Round 1 is hands-on and unassisted: judges "sit with the apps loaded on devices, 'play around' with them and score". A concept whose key moment needs a teammate, special hardware, real cattle, a partner's API or a staged scene scores low on Usability and Product.
- Build window is about 72 hours, team of 2–4 strong developers using AI coding tools, Android-first or PWA. Assume no partner APIs (no live FNB, SABRIC, CIPC or telco integration) unless the concept works without them.
- In 2025, 607 teams entered and 328 submitted working builds. "Good" is not enough; what matters is what stands out against hundreds of working apps.
- Evidence must exist in the research files for impact claims. Unsupported claims do not earn Impact points.

| Criterion | 5 | 3 | 1 |
|---|---|---|---|
| product | Core loop fully buildable and polishable in 72h with public models and data; solves a stated need end to end | Core loop buildable but rough, or one key part simulated | Depends on partners, data or hardware that do not exist for the team |
| creativity | No SA precedent; a mechanism judges have not seen; not the obvious answer to the statement | Known idea with one fresh twist | Clone of an existing SA product |
| usability | A first-time judge reaches the "wow" in under 60 seconds alone, using what is in their pocket | Reachable with provided sample data in a few minutes | Needs staged setup or explanation |
| sustainability | Clear payer with an existing budget line for this exact cost; plausible next step to scale | Plausible payer, unproven | No credible payer |
| impact | Large, evidenced, growing SA problem, and the app acts on a causal bottleneck | Real problem, but the app touches a symptom or the evidence is thin | Small or unevidenced problem |
| presentation | A judge immediately relates; evidence and emotion in one sentence | Needs explanation before it lands | Hard to explain or abstract |
| intelligence | Prediction or forecasting of user or system behaviour is central to the value (rubric: "forecast, and predict the user's likely future behaviour") | ML present but peripheral | Rules or lookup only |

Output format, strictly CSV with header, one row per concept, no commentary inside the CSV:
idea,product,creativity,usability,sustainability,impact,presentation,intelligence

Use the concept letter-and-name as the idea field exactly as given (for example "A GOMA"). After the CSV, give at most 8 lines: your single strongest and single weakest concept, and the one fatal flaw you see in your top-rated concept.
