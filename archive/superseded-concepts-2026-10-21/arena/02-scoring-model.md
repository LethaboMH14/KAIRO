# Stage 2 - Scoring model (scoring-reverse-eng, 2026-10-05)

## Verdict
Overall confidence: **LOW** for the weights, **MEDIUM** for the structure and the round-1 gate, **HIGH** only for the facts quoted verbatim (7 criteria, 2 rounds, hands-on round 1, 3 finalists per category). No single weight vector is defensible, so the model carries weight uncertainty through to the ranking instead of hiding it.

## Status of deliverables (read before using anything)
- `arena/score.py` **does not exist yet**. The partial file is `arena/score.py.partial` (109 lines: header, constants, gate constants, `PROBES` table; md5 3c1ba73746e005fbace092e01c9833c5). I renamed it because a file with no functions and no `main` would make `python arena/score.py --selftest` exit 0 with no output, which looks like a pass. The functions (prior, CSV input, gate, simulation, verdict, report, `--selftest`, CLI) were **not written**. Three attempts to append them were refused by a PreToolUse hook: "Not logged into Semgrep Guardian. Ask the guardian mcp to login." The hook let `.md` writes through. I did not work around it.
- Self-test: **NOT RUN**. Determinism (two runs, byte-identical): **NOT RUN**. Do not use `score.py` until it is finished and both checks pass.
- The evidence-alpha numbers in section 5 were computed by code: a read-only `python -c` run over the `PROBES` table, now in `score.py.partial`. They were not worked out by hand.

## 1. The brief, read literally
Verbatim (01-rules-spec.md, section 3, checked in the live browser):
> "There are 2 judging rounds. Round 1 – the judging panel sits with the apps loaded on devices, "play around" with them and score on the following criteria."
> "Entries are shortlisted from judging round 1 and finalists move on to judging round 2. Then 3 finalists are selected per category and the winner is announced at the main event."

Awards FAQ (01-rules-spec.md, section 2): "All submissions need to be complete to the point where the judges need to be able to use it and see its full capabilities."

Seven criteria, no weights: Product, Creativity, Usability, Sustainability, Impact, Presentation, Intelligence (FAQ wording is in 01-rules-spec.md, section 3).

| Item | What the sources say |
|---|---|
| Weights | Not stated anywhere |
| Score scale | Not stated. 1-5 is our assumption for internal rating only |
| Aggregation across judges (sum, mean or rank) | Not stated |
| Caps or thresholds | None stated. The "complete to the point where the judges need to be able to use it" line is a threshold, so it is modelled as a gate, not as a weight |
| Direction | Every criterion is higher-is-better |
| Applies to the hackathon category? | **Inference, not verbatim.** It is an Awards FAQ. R4 infers from ITWeb that hackathon submissions enter the same December awards judging |
| Round-2 criteria | Not stated. Hypertext 2024 (read through a summariser, unverified) gives "creativity, feasibility, technical execution and impact potential, with live pitches" |

## 2. Reconstructed function

    Round 1 (shortlist; non-compensatory):
      eligible(i) = mean_product(i) >= 3  AND  mean_usability(i) >= 3
    Score (compensatory):
      S(i | w) = sum_c w_c * x_ic        x_ic = mean rater score 1..5, w on the simplex (sums to 1)
      w ~ Dirichlet(alpha)               alpha: two scenarios, section 5
    Ranking per weight draw: sort key (fails gate, -S, idea name)
    Report per idea: E[S], P(rank 1), P(top 3), rank p5-p95, and P(rank 1) without the gate
    Round 2: not modelled separately. Same criteria assumed; Presentation is probably heavier there (live pitches)

Why not a single weight vector: an Impact-heavy vector and a Product/Sustainability-heavy vector both fit the winners below, and they would pick different ideas. Choosing either one would mean optimising a guess.

## 3. Probe table (the evidence the prior rests on)
Mark key: 1 = the source shows the winner excelled on this; .5 = partial or inferred; 0 = visibly weak or absent; - = cannot be observed from the source. Basis: E = explicit in the R4 description; J = my judgement from that description.

| Row | Grp | Wt | Prod | Crea | Usab | Sust | Impa | Pres | Inte | Basis |
|---|---|---|---|---|---|---|---|---|---|---|
| 2021 Sisa | hack | 1.0 | - | - | - | - | - | - | - | Description NOT FOUND, so the row contributes nothing |
| 2022 YabiSaba | hack | 1.0 | .5 | .5 | - | .5 | 0 | - | 0 | Impa 0 = E ("Not a social problem"). Crea .5 and Sust .5 = J (unusual niche; a booking marketplace implies commission revenue). Inte 0 = no AI described |
| 2023 Thutofy | hack | 1.0 | .5 | .5 | .5 | - | 1 | - | 1 | Impa 1 and Inte 1 = E (youth unemployment; "built-in AI", job recommendations). Usab .5 = J (gamified). Revenue NOT FOUND |
| 2024 Jiinue | hack | 1.0 | .5 | 0 | - | - | 1 | - | 1 | Inte 1 = E: "predictive analysis of job trends" matches the rubric wording "forecast, predict". Crea 0 = J (job matching is a crowded category). "Planned upskilling courses" means features were incomplete and it still won |
| 2025 Usagey | hack | 1.0 | 1 | 0 | - | 1 | 0 | - | 0 | Prod 1 = live product site. Sust 1 = B2B billing product. Impa 0 = E. Crea 0 = J: usage-based billing is an established category (Stripe Billing, Orb, Lago; my own knowledge, not sourced) |
| 2019 Naked Insurance | overall | 0.5 | 1 | .5 | 1 | 1 | .5 | - | 1 | Usab 1 = E ("in under three minutes"). Inte 1 = E (AI/chatbot) |
| 2020 EasyEquities | overall | 0.5 | 1 | .5 | - | 1 | .5 | - | 0 | J |
| 2021 Ambani Africa | overall | 0.5 | 1 | 1 | .5 | - | 1 | - | 0 | Crea 1 = E (also won the Gaming category). Free to users, so Sust is unobservable |
| 2022 Shoprite app | overall | 0.5 | 1 | 1 | - | 1 | .5 | - | 0 | Crea 1 = E ("first-to-market"; also won Most Innovative) |
| 2023 Kena Health | overall | 0.5 | 1 | .5 | - | 1 | 1 | - | 0 | Sust 1 = E (R185 price) |
| 2024 Matric Live | overall | 0.5 | 1 | .5 | .5 | - | 1 | - | .5 | Inte .5: AI chat is not forecasting |
| 2025 Vula Medical | overall | 0.5 | 1 | 0 | - | - | 1 | - | 0 | Prod 1 = E (traction: 2.5m referrals, 2,300+ facilities) |
| AppsAfrica 2023 selection basis | process | 0.5 | 1 | - | - | .5 | 1 | - | - | "planning, technical expertise and understanding of a social problem". Read through a summariser, unverified |
| Hypertext 2024 judging summary | process | 0.5 | 1 | 1 | - | .5 | 1 | .5 | - | "creativity, feasibility, technical execution and impact potential, with live pitches". Read through a summariser, unverified |
| FAQ round-1 mechanism | mech | 1.0 | 1 | - | 1 | - | - | - | - | Verbatim FAQ: judges "play around" with the apps on devices, and the app must be usable by the judges |

Row weights: hackathon-category winners count 1.0 because this is the category we enter. Overall winners count 0.5: same rubric, but established products with traction, so a different bar. Process statements count 0.5 because they are unverified summaries. The mechanism row counts 1.0 because it is primary, verbatim and current.

### Which criteria appear to separate winners from the field
**Main caveat: the sources only show winners.** No source shows the field, or even the non-winning finalists. So no criterion's power to separate winners from the rest is actually measured. "Present in winners" is not the same as "decides the winner".

| Criterion | Inference | Confidence | What would raise it |
|---|---|---|---|
| Product (complete, working, well scoped) | Most likely to separate. The FAQ requires judges to be able to use the app. 4/4 described hackathon winners had a coherent product. Only 328 of 607 teams completed in 2025, so completion alone cuts the field roughly in half | MEDIUM | Organiser confirms a completeness threshold; or the non-winning 2025 finalists were less complete |
| Usability | Round 1 is unassisted play, so judges experience it directly. Press never describes it, so no winner evidence either way | LOW-MEDIUM | Judge debrief; organiser answer |
| Impact (size of the problem) | **Not required to win**: 2 of 4 hackathon winners (YabiSaba, Usagey) were not social products. Most of the field addresses social problem statements, so a social framing alone probably does not separate entries | LOW | The 2025 problem statements; the 2025 finalists |
| Sustainability (path to revenue) | 2 of 4 hackathon winners had an obvious revenue model. 2025 had a VC panel on "viable tech business" | LOW | Same as above |
| Intelligence | 2 of 4 hackathon winners (2023, 2024) had AI, and Jiinue's predictive analysis matches the rubric wording. 2022 and 2025 had none. In 2026 most entries will have an LLM, so the quality of forecasting, not its presence, is what could separate entries | LOW | Organiser answer; 2025 finalists |
| Creativity | The winners are not visibly novel (job matching, usage billing) | LOW | Finalists versus winner comparison |
| Presentation | Not observable in any source. Probably matters in round 2 (live pitches) | UNKNOWN | Organiser: what does Presentation mean in an unassisted round 1? |

## 4. The extreme probe: Usagey 2025
A B2B usage-billing tool (R4: "Not a social problem") won Best Hackathon Solution in a year marketed as "tech for social impact", against 328 completed submissions. If Impact carried a dominant weight, that result would be very unlikely. This is the observation that separates "Impact dominates" from "Product and Sustainability dominate", and the two imply opposite idea choices. YabiSaba 2022 fits the same pattern.

Two caveats:
- The five 2025 problem statements were not retrieved. If one covered small business or entrepreneurship, Usagey may have been judged in scope with moderate impact.
- How strong the 2025 field was is unknown.

## 5. Alpha (two scenarios; the script reports both, never one)
**Agnostic:** alpha = 1 for every criterion. This is the uniform distribution over all weight vectors. Sum 7; standard deviation of each weight 0.124.

**Evidence-informed**, derived mechanically from the probe table:
- S = weighted marks; O = weighted rows where the criterion can be observed.
- Laplace hit rate h = (S+1)/(O+2). A criterion that is never observable stays at 0.5 (no information) instead of being penalised for not appearing in press copy.
- E[w] = h / sum(h); alpha = K * E[w], with K = 14.

These numbers are the output of code run over the `PROBES` table:

| Criterion | S | O | h | E[w] | alpha | sd(w) |
|---|---|---|---|---|---|---|
| product | 8.000 | 9.500 | 0.7826 | 0.1899 | 2.6588 | 0.1013 |
| creativity | 3.500 | 8.000 | 0.4500 | 0.1092 | 1.5288 | 0.0805 |
| usability | 2.500 | 3.500 | 0.6364 | 0.1544 | 2.1620 | 0.0933 |
| sustainability | 4.000 | 5.000 | 0.7143 | 0.1733 | 2.4267 | 0.0977 |
| impact | 5.750 | 8.500 | 0.6429 | 0.1560 | 2.1840 | 0.0937 |
| presentation | 0.250 | 0.500 | 0.5000 | 0.1213 | 1.6987 | 0.0843 |
| intelligence | 2.750 | 7.500 | 0.3947 | 0.0958 | 1.3411 | 0.0760 |

Why K = 14: twice the agnostic total of 7. The evidence is about 9.5 weighted rows of press descriptions that share the same framing, not score sheets, so it should move the prior only modestly. The result is a mild tilt, roughly 2:1 between product (0.19) and intelligence (0.10). The standard deviation of each weight drops from 0.124 to about 0.08-0.10, so the prior still covers most of the simplex.

Intelligence is pulled down mainly by pre-LLM overall winners, which is backward-looking evidence. The agnostic scenario covers the case where that is wrong. The planned `--k` flag varies K.

## 6. The round-1 gate
**Rule:** an idea fails if its mean Product < 3 OR its mean Usability < 3. A failing idea ranks below every passing idea in every weight draw, so its P(rank 1) is 0. A "P1 no-gate" column shows what the gate costs.

**Why a gate and not a weight:** round 1 is unassisted device play, and the FAQ requires an app the judges can use. An app that does not work cannot be rescued by Impact or Creativity. A linear weighted sum cannot represent that, in the same way a linear fit cannot see a cap.

**What the threshold means.** It sits on the anchors already in `arena/rater-rubric.md`:
- Product 3 = "Core loop buildable but rough, or one key part simulated". Product 1 = "Depends on partners, data or hardware that do not exist for the team".
- Usability 3 = "Reachable with provided sample data in a few minutes". Usability 1 = "Needs staged setup or explanation".
- A mean below 3 means the raters lean towards an app a judge cannot run, or cannot get through, on their own. That is exactly the round-1 failure.

**Adjustments to the specified gate:**
1. The threshold stays at 3 on the rater mean, with a 1e-9 tolerance for floating-point error. Exactly 3.00 passes.
2. Added a **BORDERLINE** flag: the means pass, but some single rater scored Product or Usability below 3. Round-1 judges score one by one, so one judge who cannot get the app working is a real risk.
3. At idea stage, Product and Usability are forecasts of the submitted build, not measurements. The gate screens concepts whose key moment needs a teammate, a partner API or special hardware (the rater rubric already says so).
4. With one rater, a mean of 3 is a single opinion. The script flags single-rater ideas.

**What would falsify the gate:** a past winner that judges could not use unassisted, such as a mock-up or deck-only winner. Jiinue's "planned upskilling courses" shows that missing features do not block a win. The gate is about the core flow, not about every feature.

## 7. score.py as designed (finish once the hook is cleared)
- **Input:** `arena/idea_scores.csv` with columns idea, product, creativity, usability, sustainability, impact, presentation, intelligence. Each score 1-5. If rater CSVs arrive separately (for example in `arena/raters/`), concatenate them under one header first.
- **Raters:** several rows per idea are averaged. Inter-rater spread is reported as n, maximum range, mean SD, and the criteria where raters differ by 2 or more points.
- **Simulation:** 20000 Dirichlet draws per scenario. Seeds fixed: seed*100 + scenario for the weights, seed*100 + 50 + scenario for rater resampling. Ideas and rater rows are sorted, and ties are broken by (fails gate, -score, name). Output is UTF-8 with LF line endings.
- **Output per idea:** E[S], P(rank 1), P(top 3), rank p5-p95, and P(rank 1) without the gate.
- **Verdict:** ROBUST only if the same idea leads in both scenarios with P(rank 1) > 0.5. An advisory line repeats the check with rater rows resampled per draw.
- **`--selftest` checks:**
  - A Pareto-dominant idea gets P(rank 1) > 0.95 in both scenarios.
  - Three mirrored ideas each get P(rank 1) within 0.03 of 1/3, and the verdict is NOT ROBUST.
  - A broken app with otherwise perfect scores gets P(rank 1) = 0 with the gate and > 0.95 without it.
  - The BORDERLINE flag fires.
  - Rater averaging and spread are correct.
  - CSV validation works.
  - Dirichlet means match alpha/K within 0.005.
  - Two in-process report renders are identical.
- **Acceptance:** `--selftest` passes, and two separate runs on the same CSV give identical md5.
- **Scope:** ranks are among our own ideas only, not against the field.

## 8. What would raise confidence (best value for effort first)
1. **Email the organiser** (admin@creativespacemedia.co.za, +27 11 467 3341). Ask:
   - Are the 7 criteria weighted?
   - Does the same rubric judge Best Hackathon Solution?
   - What is the score scale?
   - Is there a minimum threshold in round 1?
   - How many judges score each app?
   - What does Presentation mean in an unassisted round 1 (a video, a store listing)?
   - Does round 2 re-score or rank, and are round-1 scores carried over?
2. **Names of the non-winning 2025 and 2024 Best Hackathon Solution finalists.** They are the only possible comparison with the field.
3. **The five 2025 problem statements**, to settle whether Usagey was in scope under a business statement.
4. **Debriefs** with Thato Semenya (FutureDX/Thutofy 2023), Siphiwe Radebe (2024 winners), and 8thWanda (Usagey 2025).
5. **Re-read Hypertext 2024 and AppsAfrica 2023 in raw form**; both are summarised only.

## 9. What would falsify this model
- Published weights replace the prior with a fixed weight vector.
- If judges rank apps holistically rather than score each criterion, the linear form is wrong.
- A winner that did not work would break the gate.
- If the 2025 finalists were all commercial products, Impact is weighted lower than in the evidence scenario. If they were all social products, Usagey was an outlier.

## Limitations
- The marks are my judgement on press descriptions. Several sources were read through a summariser.
- Press copy over-reports Impact and AI and under-reports Usability and Presentation. Treating "unobservable" as no information corrects only part of this. A 0 for "AI not described" is weak evidence.
- The linear form itself is an assumption.
- Overall winners (row weight 0.5) are established businesses, so their high Product and Sustainability marks partly reflect that bar rather than hackathon judging.
- No real ideas were scored here.
