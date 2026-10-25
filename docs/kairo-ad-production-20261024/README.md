# KAIRO — “When it clicks” · production notes (first cut v0.1)

24 October 2026 · KAIRO-AD-PROD-037 · Claude Code desktop, `claude-kairo-ad-20261024-a`, claude-opus-5-5, effort max.
Brief: `coordination/briefs/claude-kairo-ad-20261024/CLAUDE-START-HERE.md` and `docs/claude-kairo-ad-20261024/CREATIVE-DIRECTION.md`.
Editable project: [`design/kairo-ad-20261024/`](../../design/kairo-ad-20261024/README.md).

**Status:** a playable, offline-rebuildable 20-second concept cut (master and a lighter web copy), a silent-readable
cut and a review-labelled cut, with stems and captions — all validated. The reduced-motion companion and the
entrant-placeholder cut are built into the compositor and checked as stills, but were not rendered: rendering
stopped at 12:58 so the machine was free before the 13:30 submission window. It is **not** final, not submitted and not organiser-approved.
Three things in it are stand-ins, and every copy says so:

1. **Voice is temporary.** KAIRO and the student thoughts use a local open-weight synthetic voice (Kokoro-82M,
   Apache-2.0). It is not KAIRO's app voice (Google Aoede) and not a person. The agent could not generate Aoede:
   `gcloud` had no active account in its environment, and it did not read credential files.
2. **The student is fictional and generated** (Codex AD-STILLS-036, built-in image generation). Not the user,
   not a testimonial. The master carries a small “Dramatisation.” super.
3. **Product screens are reconstructed**, not recorded: typeset in the compositor from the app's real copy, with
   the real motor model and the real KAIRO model. The master carries “Interface reconstructed for illustration.”
   The capture list says how to replace them with genuine recordings.

## The film

| Time | Picture | Sound | What is real here |
|---|---|---|---|
| 0.0–3.0 | Fictional student at his desk (still A), slow push. “Will I pass?”, “Where do I start?”, “Can I prove it?” arrive as KAIRO-style chips tethered to him; fainter study, funding and work fragments settle into the corners. A small KAIRO pathmark sticker sits on his laptop lid. | Three thoughts, staggered, overlapping near the end; quiet drone, quickening tick and a rising air sweep. Everything stops at exactly 3.000 s. | Approved pathmark vector. |
| 3.0–5.0 | Hard cut on the silence to an over-the-shoulder plate (still C). KAIRO's space is already on his screen; one clean push carries us into it. KAIRO appears; the three questions (and the motor fragment) fly into a four-step path and turn into its labels: My material · My lesson · Explore · My working. | One warm chime. KAIRO: “Meet KAIRO.” | Actual KAIRO model (Blender render of the shipped GLB, shipped Acknowledge clip, Rhubarb-timed mouth through the app's own viseme table). Path labels are the app's flow labels. |
| 5.0–8.0 | My material \| My lesson. A sentence of the material is highlighted; the lesson's citation [1] is checked: “Check the source” → “✓ Source checked”, a line runs back to the passage. The figure is the motor's own section outline. | KAIRO: “Bring your material. Check the source.” Soft tap. | Material text, part copy and button wording come from `motorContent.ts`/the app; the section outline is `motorGeometry.json` from the real motor. |
| 8.0–12.0 | The copper section line lifts off the page and lands exactly on the cutaway motor (projected through the render camera), which then makes one orbit. Part 6, Squirrel cage, “Bars where current is induced.” is selected; Operate is pressed and the rotor turns. Caption: “Speeds here are slowed and not to scale.” | KAIRO: “Explore the motor. Practise explaining why.” Precise click, rotor whir, musical lift. | Actual motor GLB, its real cut variants and part names; the app's real Inspect/Explode/Operate modes and caption. |
| 12.0–16.0 | Practice card: “Try one small experiment — Pause the model and explain which observation supports that explanation.” The learner's explanation is typed and kept: “Saved to My working”. A My working card collects source, explanation and observation. The path's last step completes. | KAIRO: “Keep work you can show.” Soft confirmation. | Prompt text is the app's operate-mode practice prompt. The learner's sentence is written for the advert. No grades, stars, mastery or certificates anywhere. |
| 16.0–20.0 | Back out through the laptop; the learner again, calmer, with the organised path where the scattered questions were. Moss brand close: KAIRO beside a clean laptop silhouette carrying the lockup, “Put knowledge to work.”, “Explore KAIRO”, Rain/Blender credit. Lockup on screen ≈ 2.1 s, slogan ≈ 1.6 s; everything holds still from 19.0 s. | KAIRO: “KAIRO. Put knowledge to work.” Bell, resolved chord, silence by 19.85 s. | Approved lockup vectors, existing slogan. |

Spoken words: KAIRO 24, student thoughts 11, total 35 (counted by `audio/captions.py`; measured timings in
[TRANSCRIPT.md](TRANSCRIPT.md)).

## Craft decisions

- **One visual language from worry to path.** Thoughts are drawn as the same chips the interface uses, so at the
  reveal the questions physically become the four flow steps; at the end the same path sits where the worries
  were. Motion purpose throughout is spatial continuity or explanation, one camera move per beat.
- **The sound break is the reveal.** Thoughts, drone and tick cut at 3.000 s; KAIRO arrives into near silence.
  No flash, no panic sound.
- **Source → motor is a measured match.** The diagram is the motor's own section outline; its landing positions
  are projected through the Blender camera's first frame, so the line lands on the real cutaway.
- **Restraint on breadth.** Pump and request-trace tiles were left out of v0.1 rather than added as unreadable
  extras. Codex's branded “worlds” illustration (KAIRO-BRAND-HERO) was reviewed and not used: its KAIRO and
  equipment are generated approximations, which would undercut the actual-model proof.
- Motion skills read: `animate`, `animation-vocabulary`, `review-animations` (purpose before motion, ease-out
  entrances, no scale-from-zero, staggered entries) and the Remotion markup/captions/multimedia skills (all
  motion derived from the frame number; captions as structured data). The Remotion renderer was not used: it
  renders frames by screenshotting headless Chromium, which falls inside the brief's no-headless-screenshot
  boundary. Blender (EEVEE, offline) and a Python/OpenCV compositor piped to FFmpeg render everything.

## Honest limits

- Temp voice; KAIRO's lip sync follows the temp takes and must be re-rendered when the voice changes
  (`make.py --from audio`). Mouth shapes are Rhubarb phoneme timing through the app's viseme weights — not
  performance capture or hand animation. Pointing was not used: the shipped HandPoint clip only carries finger
  poses (the app solves the arm with IK), so KAIRO gestures with the Explain clip instead.
- Hardware: Intel UHD integrated graphics, 7.7 GB RAM (≈ 0.9 GB free during the session). EEVEE at 16–24 samples;
  some fine hair/edge shimmer is possible. Student stills are 1672×941 upscaled to 1080p with grain.
- The stills' notebook marks are atmospheric; the laptop sticker is an added brand cue, not a real product.
- Reduced-motion companion: no camera pushes, orbit, slides, flights or spinning rotor; cuts and fades only,
  still grain, captions burned in. KAIRO's own character animation and lip sync remain. No 9:16 adaptation yet
  (only after the landscape master is accepted and the need is confirmed).
- Phone-speaker clarity, stranger comprehension and human voice quality are untested — see [ACCEPTANCE.md](ACCEPTANCE.md).
- Organiser format, deadline (noon vs 13:30) and the eligibility of a fictional presenter or synthetic voice are
  unconfirmed. Nothing was uploaded or submitted.

## Judging evidence this cut can support (claims kept to what is shown)

- **Product:** one supported task end to end — material, cited lesson, motor exploration, practice, kept working.
- **Creativity:** worries reorganise into the path; diagram line becomes the motor.
- **Usability:** one sentence per beat, captions, silent-readable cut; comprehension still to be tested.
- **Presentation:** human opening, KAIRO by second 3.4, proof, brand close.
- **Intelligence:** source and citation shown as a check, without inventing capabilities.
- **Sustainability / Impact:** not evidenced by an advert; no revenue, learning-gain or job claims are made.

## Files

- [TRANSCRIPT.md](TRANSCRIPT.md) — measured line timings and word counts.
- [CAPTURE-LIST.md](CAPTURE-LIST.md) — what the user records (entrant opening/close, product footage).
- [ACCEPTANCE.md](ACCEPTANCE.md) — the one-viewing question and other human checks.
- [ASSETS-AND-RIGHTS.md](ASSETS-AND-RIGHTS.md) — every input and tool with licence, provenance and hash.
- [QA.md](QA.md) — ffprobe, full decode, black-frame, audio and final-hold results per cut.
