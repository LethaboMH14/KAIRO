# Concepts to score (neutral copy for raters)

Each concept: one primary problem statement (2025 "War Rooms" checked scope), the problem with evidence pointer, the mechanism that is NOT the obvious one, the judge-playable moment (round 1 is unassisted device play), the "Intelligence" component (rubric: "forecast, and predict the user's likely future behaviour"), the revenue path, the honest risk, and the nearest competitor.

Evidence files: research/R1 (fraud, mules), R2 (informal economy), R3 (youth, savings, access), R4 (winners, novelty), R5 (inoculation, in-call). Existing repo concepts (PaperBridge, ProofShift, MarginMesh) are included as controls.

---

## A. GOMA — scam weather, scam vaccines, and a mule shield
*Primary statement: 4 Financial inclusion and money confidence ("scam awareness; multilingual support; low-data tools").*
*Name: from isiZulu ukugoma, "to vaccinate"; check with native speakers.*

- **Problem:** Digital banking fraud losses were R2.4bn in 2025 (110,074 cases). The banking app accounted for 88.6% of cases, yet SABRIC says the apps were not compromised: the victims were coached (R1). People encounter about 258 scams a year (GASA SA, R1). Mules are "often unemployed… young South Africans such as students", recruited with fake "transaction manager" job adverts (FIC, R1).
- **Mechanism (the non-obvious part):** treat scams as an epidemic, not as individual messages.
  1. *Sentinel agent:* the user forwards anything suspicious (SMS, WhatsApp screenshot, voice note, job advert). It handles OCR, isiZulu/Sesotho/Afrikaans/English STT, strain classification and entity extraction (accounts, numbers, URLs).
  2. *Epidemiologist agent:* clusters reports into "strains" and builds a regional, time-aligned forecast ("scam weather"). Scams peak around paydays, SASSA dates, NSFAS disbursement and two-pot windows, so it predicts which strain will surge where next week.
  3. *Vaccinator agent:* sends each user a short, safe simulated scam in the same channel the real one uses (R5: inoculation works but is channel-specific), timed before the forecast wave. A per-user susceptibility model (Bayesian knowledge tracing / bandit over strains) predicts which strain this person would fall for and drills that one.
  4. *Mule shield:* "transaction manager" job adverts are a named strain. Forwarding one returns a consequence explainer (SAFPS listing, account freeze, criminal liability) in the user's language.
  5. *Intel export:* sim_ bank-ready indicators (mule account numbers, phone numbers, URLs) as a feed FNB could consume.
- **Judge-playable moment:** the judge pastes a scam SMS from their own inbox. In seconds they get the strain name, what it wanted, and a voice explanation in the language they chose. Their report lands on the live map and moves the forecast. Then "take a 30-second vaccine": a simulated scam voice note arrives, they decide, and their susceptibility profile updates.
- **Intelligence:** a strain-surge forecast plus a per-user susceptibility prediction. This is literally "predict the user's likely future behaviour".
- **Revenue:** B2B. A bank or telco licenses the intel feed and the white-label vaccine programme (FNB fraud losses are their cost). Employers buy it as staff financial wellness. Free for consumers.
- **Risks:** no SA-language scam dataset exists (labelled sim_ and synthetic until crowd data accrues). Forecasting needs volume; it starts cold and must be seeded. Simulated scams must never be confusable with real ones (opt-in, a watermark word). Drills could annoy users.
- **Nearest competitors:** Truecaller (spam ID), Google Messages scam detection (English), Apate.ai and Cybera (bank-side scam-baiting), YIMA (scam checks). No SA scam-forecast-plus-inoculation product was found (R4 did not search this exact idea; verify).

## B. MINA KUSASA ("Me tomorrow") — your future self at the moment you are about to decide
*Primary statement: 4 ("saving; responsible credit; multilingual").*

- **Problem:** SARS reported R43.42bn paid on 2,403,379 approved savings-pot directives by 31 Jan 2025; a later radio report quoting the SARS Commissioner gives about R57bn and almost 4 million withdrawals (Jun 2025). Alexforbes: 67% of 2025 claimants claimed again in 2026; average claim over R14,000. Stated reasons (Old Mutual Corporate, no sample size): basic living costs 34%, debt 26%, emergencies 26% (R3). **Counter-evidence (R3):** withdrawals are largely need-driven; Hershfield 2011 Study 1 is N=50 with p=.035 one-tailed (two-tailed 0.073); the only real-money field test (Mexico, ~50,000 savers) moved one-time contributions from 1.5% to 1.7%; MIT Future You (N=344) measured anxiety and future-self continuity, not saving.
- **Mechanism:** the user takes a selfie and gets an age-progressed avatar that speaks their language. At decision moments (savings-pot withdrawal, mashonisa loan, "send money to this new payee") the user opens Mina Kusasa. Their future self explains the deterministic consequence computed from their own figures: tax on withdrawal, lost compounding, loan cost spiral. No model writes a figure. The forecast uses their income pattern (irregular income supported).
- **Judge-playable moment:** the judge takes a selfie and their 65-year-old self speaks to them in isiZulu about a R10,000 withdrawal.
- **Intelligence:** a cash-flow forecast from the user's own pattern, plus a counterfactual simulation.
- **Revenue:** a bank or retirement-fund retention tool (assets under management kept); white-label.
- **Risks:** MIT "Future You" showed connection and anxiety effects, not reduced withdrawals (R4). Face-ageing models may perform worse on darker skin (must test). A selfie is POPIA special personal information (biometrics). It is a standalone app people must remember to open. Novelty is moderate (MIT, Merrill Lynch precedent).
- **Nearest competitors:** MIT Future You, Discovery Bank content. No SA product found.

## C. IMBONGOLO ("the donkey") — catch the mule recruiter before your account becomes the getaway car
*Primary statement: 2 Youth employment and work readiness.*

- **Problem:** this is the largest white space in R4 (recruit-side detection). The FIC links mules to unemployed youth and students via fake adverts. Accounts are bought openly on Facebook Marketplace (GroundUp, R1). There are 5.0m unemployed youth (R1).
- **Mechanism:** the job seeker forwards any job advert, DM or recruiter number. A multi-agent investigation runs: CIPC company check, address plausibility (is the "office" a house?), recruiter-number reuse across adverts (graph), pay-to-apply and receive-and-forward language patterns, and a grooming-stage model (approach, trust, account or ID request, test transfer, forward instruction) that predicts the next step. Verdict and consequences are given by voice in the user's language, with a hand-off to verified opportunities (SA Youth).
- **Judge-playable moment:** the judge pastes a provided sample advert, or a real one from Facebook.
- **Intelligence:** a grooming-trajectory model that predicts the recruiter's next ask.
- **Revenue:** banks (fewer mules), job platforms (trust and safety API), universities and TVETs.
- **Risks:** no labelled SA data (sim_); SAFPS mule listings fell 33% in 2024 (counter-signal); narrow single-feature app.
- **Nearest competitors:** bank awareness pages; BioCatch and ANZ bank-side detection.

## D. GHOST ROOM — is this res real before you pay the deposit?
*Primary statement: 1 Access to higher education ("cost planning; student wellness").*

- **Problem:** fake student accommodation on Facebook and WhatsApp, with deposits of R1,500–R5,000 lost each January. NSFAS funded 1,441 non-existent beds in one case (R1); 130,000 students were at eviction risk at the start of 2025 (R1).
- **Mechanism:** the student shares a listing (screenshot or link). Checks: perceptual-hash and reverse-image reuse of the photos; a Street View cross-check that the address exists and the exterior matches the photos (CV); price-versus-area anomaly; whether the payee name matches the stated landlord; urgency-script detection. Verdict plus a "pay only via held deposit" recommendation.
- **Judge-playable moment:** the judge opens any Facebook Marketplace rental and shares it.
- **Intelligence:** a listing-risk model; price prediction for the area.
- **Revenue:** universities and NSFAS (accredited-housing gatekeeping), deposit-protection fee via a bank.
- **Risks:** Street View coverage in townships; reverse-image APIs cost money; counts of victims are anecdotal (R1).
- **Nearest competitors:** DigsConnect (own listings only), HousingAnywhere (escrow, global).

## E. SHELF SCORE (spaza) — your shelf is your credit file
*Primary statement: 3 Youth entrepreneurship and small-business growth.*

- **Problem:** spaza registration: 82,924 applications lodged Jul 2024–Jun 2025, 15,528 approved (18.7%) (Parliament reply, R2); R500m Spaza Shop Fund approved 1,319 shops by Jun 2026 (R2). 94% of MSMEs use cash and 59% keep records (repo research). **Counter-evidence (R2):** NielsenIQ is building a field-audit census of 189,000 traditional-trade outlets; Flash + Shop2Shop hold about 177,000 informal traders; SKU-110K is non-commercial licence; no African retail image dataset found.
- **Mechanism:** the owner pans the phone across the shelf. Dense detection (SKU-110K-pretrained YOLO) produces a stock count; OCR reads expiry dates; expired or recalled stock is flagged; reorders are suggested; a stock-turnover signal feeds a working-capital offer.
- **Judge-playable moment:** the judge pans across any snack table at the venue.
- **Intelligence:** demand and stock-out forecasting.
- **Revenue:** lenders and FMCG brands paying for data.
- **Risks:** expiry OCR on cluttered shelves is hard (R4); Lesaka already sells spaza POS data from 90,000+ shops; the credit signal is unproven.
- **Nearest competitors:** Mfoodie2go, Lesaka, Vuleka, A2Pay; Cuanto Tengo (MIT).

## F. ISIKWELETU ("debt") — an agent that knows the debt collector's rules better than the collector
*Primary statement: 4 ("responsible credit").*

- **Problem:** NCR: 36.05% of 29.24m credit-active consumers had impaired records (June 2025), about 10.5m people (computed). Household saving ratio -1.3% of disposable income (Q1 2026); household debt about 61–62% of disposable income; Gen Z took 53% of non-bank personal-loan originations in Q1 2026 (TransUnion) (all R3). Prescribed-debt collection volumes: NOT RESEARCHED.
- **Mechanism:** the user photographs a letter of demand, SMS or court notice. OCR and extraction pull the creditor, dates and amounts. A deterministic rules engine checks the National Credit Act (prescription after 3 years; in-duplum rule; s129 notice requirements; prohibited fees). An agent drafts a response in the user's language, and an affordability forecast proposes a sustainable repayment plan.
- **Judge-playable moment:** the judge photographs a provided sample collection letter.
- **Intelligence:** a repayment-capacity forecast, and prediction of which creditor will accept which arrangement (later, from outcomes).
- **Revenue:** success fee on rands saved; debt counsellors as a B2B tool.
- **Risks:** legal-advice regulation; rules must be reviewed by an attorney.
- **Nearest competitors:** debt counsellors, DebtBusters (human-led).

## G. QUIET EXIT — economic abuse: see it, block it, plan the way out
*Primary statement: 5 Safer communities and GBV response ("privacy-first; discreet access").*

- **Problem:** CBA found more than 8,000 customers in 3 months receiving abusive payment-reference messages. It open-sourced its model, and its stated future work is non-English coverage (R1). SA economic-abuse prevalence: 9% past-year (Gauteng, n=491, 2010 data) — old and regional (R3).
- **Mechanism:** (bank side) a multilingual abusive-payment-reference classifier for SA languages, extending the open AITD model. (Survivor side) a disguised app holds a timestamped, hash-chained evidence locker (reusing the VUKA chain) and a "freedom fund" forecaster: how many months until a safe exit is affordable, given irregular income and hidden savings.
- **Judge-playable moment:** the judge sends a test payment reference containing an abusive phrase in isiZulu and watches it get flagged. This is a bank-side mock, so round-1 playability is moderate.
- **Intelligence:** escalation-pattern detection over time; exit-affordability forecast.
- **Revenue:** bank compliance and wellbeing (CBA precedent).
- **Risks:** a survivor-safety design needs specialist partners; the device may be monitored by the abuser; the demo must use fictional data only.
- **Nearest competitors:** CBA Next Chapter (Australia); in SA, nothing found (unverified).

## H. LAST-MILE SIREN — warnings people actually act on
*Primary statement: 6 Climate resilience and essential services ("local alerts").*

- **Problem:** flood deaths in KZN (2022) and Eastern Cape (2025) despite SAWS warnings (to verify; not yet researched).
- **Mechanism:** ingest SAWS warnings; turn them into a local-language voice call and voice note from a trusted local voice; collect "I'm safe / I need help" check-ins; keep a registry of vulnerable households; route help between neighbours.
- **Judge-playable moment:** a simulated warning triggers a call to the judge's own phone in isiZulu.
- **Intelligence:** risk forecast per household from elevation and river proximity.
- **Revenue:** municipalities, insurers (claims reduction).
- **Risks:** unresearched evidence; telephony cost; a life-safety liability claim.

## I–N. Controls and lower-ranked
- **I. PaperBridge** (repo #1): offline camera checker for NSFAS-type forms. Statement 1.
- **J. ProofShift** (repo #2): employer-defined task evidence cards. Statement 2.
- **K. MarginMesh** (repo #4): split-case group buying for spazas. Statement 3.
- **L. Progression Radar:** forecasts NSFAS funding loss from module results (109,761 of 546,685 university and 79,461 of 210,989 TVET NSFAS students did not meet progression criteria; repo research). Statement 1.
- **M. Scam Circuit Breaker:** on an Android device, detect "call with unknown number + remote-access app + banking app foreground" and interrupt in the user's language. Google already pilots this with UK banks (R5). Statement 4.
- **N. Leak Bounty:** paid, ML-verified leak reports. LeakNet exists; there is a perverse incentive (people breaking pipes to claim). Statement 6.
