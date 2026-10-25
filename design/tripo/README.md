# Tripo exploration (CHARACTER-003-TRIPO)

Closed on 22 October 2026 at the user's direction. Nothing here ships: the deployed teacher stays the Rain build from CHARACTER-002.

## What was done

- **CLI:** the official `tripo-cli` 0.7.2 is installed globally. Tripo's developer docs name `npm install -g tripo-cli`. It is signed in to the international developer account by device authorisation. Analytics are off for runs (`TRIPO_ANALYTICS_ENABLED=0`). The developer API balance is 0, so no generation went through the CLI.
- **Studio credits:** the user's credits were in Tripo Studio (web), 200 free plus 300 from a referral. Generation happened there through the user's signed-in Chrome.
- **Concept pictures:** made with Nano Banana and the T Pose template, at 10 credits each. The references were two crops of the team's own boards:
  - `reference/kairo-teacher-ref.png`, from `coordination/briefs/AVATAR-AND-PATHWAYS/concept-reference.png`.
  - `reference/soft-cinematic-ref.png`, from `assets/design-reference/teacher/avatar-directions-v1.png`, direction A.
- **HD models:** H3.1, Ultra mesh, 4K PBR, remove lighting, about 2 million triangles, 55 credits each:
  - stylised A;
  - human-like B;
  - photoreal C, made with the one-time 8K trial at 0 credits.
- **Curvy Disney-style teacher:** the user generated this from the soft-cinematic concept. `reference/tripo-showcase-sheet.jpg` shows five frames from the user's 4-second showcase video (front, side, back).
- **Refused prompt:** Tripo's content filter refused a prompt that described a curvier figure in body-part terms, with the message "This image does not meet our content guidelines".

## Why it stops here

- **Free plan:** 3D export and multi-view are members-only, and free generations are public.
- **Rights:** Tripo's Terms of User Agreement, last updated 11 July 2025, §5.2.1 say Tripo "retains all rights" in the inputs and outputs of users who use the service free of charge. Paid users get those rights under §5.2.2. Treat every Tripo output, including the showcase sheet, as an internal visual reference only.
- **No face rig:** the meshes have no separate eyes, mouth interior or blendshapes. They cannot lip-sync, blink or move their gaze, which the Rain build's runtime contract requires.

## Using it later

- **Visual target:** the showcase sheet is a target for the Rain pipeline: curvier silhouette, softer stylised face and the blazer outfit. Reshape Rain toward it in `design/character/blender` rather than importing a Tripo mesh.
- **If a paid plan is bought:**
  - Export the GLB.
  - Rig it with rig v3.0 using `-p model=v3.0-20260909 -p spec=unreal`. Unreal Mannequin bone names are close to the runtime's skeleton.
  - Treat the face as Rain's head or as a separate face-rig task.
- **CLI reference:** `tripo docs --llm` prints the full agent guide.
- **API prices**, from the [v3.1 page](https://developers.tripo3d.com/en/models/v3-1):

  | Generation | Credits |
  |---|---|
  | Text | 10–40 |
  | Image or multiview | 20–50 |
  | Ultra geometry | +20 |
