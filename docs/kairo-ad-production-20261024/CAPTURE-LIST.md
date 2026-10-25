# Human capture list — what the user records to finish the cut

The agent did not observe or record the browser, screen or camera; that restriction still stands. The product
sections of v0.1 are **reconstructed** from real app copy and the real motor/KAIRO models. These captures replace
them with genuine footage and supply the entrant's own opening and close. Record at 1920×1080 (or larger, 16:9),
30 fps, with handles of about one second before and after each action.

## Before recording

- Use the **local preview** (`http://127.0.0.1:4188`, started with `KAIRO_LOCAL_CURRICULUM=engineering`; see the
  root README). It is a single-user workspace with prepared engineering material. Do not record the hosted judge
  login: never show synthetic judge passwords, the credentials file, account emails or the IAM URL.
- Browser zoom 100 %, window maximised, bookmarks bar hidden, notifications off (Windows Focus), no other tabs
  visible. Prefer a full-screen browser window so the address bar can be cropped.
- Slow, deliberate pointer movement; pause half a second before and after each click.
- Use only synthetic or public sample material. No personal documents, names, student numbers or faces other
  than the entrant's own.

## Entrant shots (for the entrant-compatible cut)

| ID | Slot | What to record | Notes |
|---|---|---|---|
| E1 | 0.0–3.0 s | You at your laptop (medium close-up), saying the three thoughts: “Will I pass?” · “Where do I start?” · “Can I prove it?” — or your own 3-second hook. | Quiet room, eye-level, soft key light from a window or lamp, lens cleaned. Record two clean takes plus a take with the three lines spoken separately (we can stagger them). Leave space in the upper corners for the thought cards. |
| E2 | 16.5–17.6 s (+ voice to 19.5 s) | You to camera, relaxed: “KAIRO. Put knowledge to work.” | The line runs over the brand close; a 1–1.5 s on-camera moment is enough. Hold a still, settled expression for a second after the line. |
| E3 | wild | 10 s of room tone in the same space, nobody speaking. | Lets us blend your takes cleanly. |

Phone audio is acceptable if it is close and quiet; a lapel/headset mic is better. Do not speed up delivery to fit.

## Product footage (replaces the reconstructed interface)

| ID | Beat / slot | Route | Synthetic scenario and action | Duration | Crop / hide |
|---|---|---|---|---|---|
| P1 | Source, 5.0–6.5 s | `/sources` | Open the prepared engineering material; show its extraction review with the “Reviewed source · ready to build from” strip; scroll gently to a passage about the rotor. | 4 s | Crop to the source workspace; hide file paths and any account area. |
| P2 | Source check, 6.5–8.0 s | `/classroom?lesson=…` (the lesson built from P1) | Click the lesson's citation / “Check the sources for this step”, so the quoted source passage is visible beside the lesson text. | 3 s | Crop to lesson + quote. |
| P3 | Motor, 8.0–10.5 s | `/engineering` | Cutaway on; select **Squirrel cage** (part 6) in the parts list so its card reads “Bars where current is induced.”; one slow orbit by drag. | 4 s | Full 3D view + part card; keep the “Speeds here are slowed and not to scale.” caption when in Operate. |
| P4 | Motor consequence, 10.5–12.0 s | `/engineering` | Switch the mode to **Operate** with **Normal supply**; let the rotor turn for two seconds. | 3 s | Same crop as P3; no measured-speed claims on screen. |
| P5 | Practice, 12.0–14.0 s | `/engineering` → “Try one small experiment” (or the lesson's practice tab) | Type a short explanation in your own words (e.g. the rotor turns a little slower than the field, so current keeps being induced); save it. | 4 s | Crop to the practice panel; type slowly. |
| P6 | Working, 14.0–16.0 s | `/evidence` | Show the saved item in My working. | 2–3 s | No grades, stars or scores exist; don't add any. |
| P7 (optional) | breadth tile | `/pump-lab` | One readable pump view. | 2 s | Only if legible as a small tile. |
| P8 (optional) | breadth tile | `/computer-science` | One readable request-trace step. | 2 s | Only if legible as a small tile. |

The compositor can corner-pin P1–P6 into the laptop screen of still 03 (`SCREEN` in `compose/build.py`) and into
the product space. Captures must be labelled as real app recordings only if they are unedited screen recordings
of the running app; cuts that shorten navigation are fine, but do not fake instant extraction or AI answers.

## Delivery

Save recordings under a new folder (for example `design/kairo-ad-20261024/footage/`), keep the originals untouched,
and note date, device, route and any edits. Then tell the editor (Claude) which files map to E1–E3 and P1–P8.
