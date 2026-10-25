# Stage 2 decision point — the ranking is clear on value, ambiguous on feasibility

Status: PROVISIONAL. `score.py` (with self-test and determinism check) is blocked by the Semgrep Guardian hook until the user logs in. The numbers below come from an inline run of the same design (stdlib, fixed seed 20261005, 20,000 Dirichlet draws per scenario, sorted iteration, ties broken by name). Full output: `provisional-ranking.txt`. Inputs: `idea_scores.csv` (3 blind raters × 14 concepts: Codex gpt-6-astra/ultra ×2 with different personas, Claude ×1).

## What the numbers say

| Scenario | Leader | P(rank 1) | Runner-up |
|---|---|---|---|
| No gate, agnostic prior | A GOMA | 0.900 | B 0.069 |
| No gate, evidence prior | A GOMA | 0.890 | B 0.079 |
| No gate, A creativity −1 (novelty deflation, since every component of A exists somewhere — R5) | A GOMA | 0.736 / 0.770 | C 0.114 / B 0.133 |
| Round-1 gate ON (mean Product or Usability < 3 fails), either prior | B MINA KUSASA ≈ L PROGRESSION RADAR | 0.502 / 0.519 vs 0.498 / 0.481 | — |

- On value, A leads under every weight vector we can justify, including after deflating its novelty.
- A **fails the hands-on gate**: mean Product is 2.33 (raters gave 2, 2, 3). All three raters independently named the same fatal flaw: *the forecast has no real SA data, so the headline intelligence is a seeded demo.*
- With the gate, there is no robust winner: B and L are a coin flip on a mediocre expected score (about 3.38/5). Both are "good apps that fall into the crowd".
- The repo's previous #1, PaperBridge, ranks about 8th of 14 by raw total (56/105).

**Conclusion:** the lever is scope, not weights. The question is whether A can be re-scoped so that its core loop is buildable and playable (Product ≥ 3) while keeping what made it win (impact evidence, presentation, creativity), and with its intelligence moved onto real held-out data.

## Proposed re-scope: GOMA-core (to be pre-mortemed and then put through the claudex loop)

*Primary statement: 4 Financial inclusion and money confidence ("scam awareness; multilingual support; low-data tools").*

**Hero loop, which a judge completes alone in under 60 seconds from their own inbox:**
1. **Diagnose.** The judge pastes or shares a scam SMS, a WhatsApp screenshot (OCR) or a voice note (STT). They get the strain, what it wants, and the red flags, read aloud in the language they chose (isiZulu, Sesotho, Afrikaans or English).
2. **Predict the next move (the Intelligence centrepiece).** "Here is what they will do next": the two most likely next scammer actions (for example OTP request, remote-access install, "safe account" transfer). A small fine-tuned encoder predicts the stage and the next action. PreScam reports that supervised encoders beat zero-shot LLMs on progression prediction. It is evaluated on **real held-out data** and the actual metric is shown in-app (PreScam if released; fallback PsyScam or other public corpora). This replaces the unprovable regional forecast.
3. **Vaccinate.** A 30-second drill arrives **in the same channel** (simulated SMS or WhatsApp voice note) rehearsing the predicted next move. Inoculation works and is channel-specific (R5, Robb & Wendel RCT brief).
4. **Immunity profile.** A per-tactic Beta-Bernoulli susceptibility model updates visibly as the judge answers drills: "you are most vulnerable to authority and urgency tactics".
- **Showcase strain:** the "transaction manager" job advert (mule recruitment). This is the largest SA white space in R4, framed for unemployed youth, with a consequence explainer (SAFPS listing, account freeze).
- **Cut from the MVP's claims:** the regional "scam weather" forecast. At most it becomes a clearly labelled `sim_` roadmap screen, unlocked once real reports accrue.
- **Bank-side (roadmap, `sim_`):** a JSON intel export (mule accounts, numbers, URLs) that FNB could consume.

**Why this should clear the gate:** the core is classifier + explanation + TTS + drill, which is buildable in 72h with public models. The "wow" is playable alone, and the intelligence claim is measured rather than staged.

**Honest risks:**
- PreScam's release and licence are unconfirmed.
- PreScam is English US/Canada BBB data, so transfer to SA needs a small labelled SA set (`sim_` until real).
- Offline TTS for SA languages does not exist on Hugging Face; fall back to cloud TTS or reviewed cached clips (AMAZWI recordings).
- No novelty claim beyond "the closed loop in SA languages was not found".

## Alternatives on the table
- **A+C fusion:** GOMA-core with the mule-recruiter investigation (CIPC, recruiter-number graph) as a second tab. More ambitious, with a higher risk of failing the Product gate again.
- **Gate-safe B or L:** buildable, but a coin flip on mediocre expected scores. Not recommended given the 607-team field.
