# Lecture Theatre implementation

Local route: http://127.0.0.1:4174/lecture

## Delivered design

Studio 02 reuses Christophe Seux's CC0 Blender Classroom, rather than generating a room from a prompt. `tools/convert_classroom.py` realizes collection instances and exports the main scene to glTF. The output is 15,346,684 bytes, with 830 placed objects and 324 unique meshes. Asset lineage and conversion details are in `studio/public/models/classroom/provenance.json`. Source files remain intact.

The original interior uses older Cycles materials that did not translate faithfully to glTF. LectureScene authors browser PBR replacements using the original material names: warm plaster, timber, green chairs and metal. This is an adapted real-time scene, not a match to the original Cycles render or a hyperrealistic result. It uses ambient, hemisphere and directional light; no GPU/cloud rendering service is needed.

The teaching board uses a native CanvasTexture, updated for each lesson chapter. Camera positions cover the learner's seat, front row and room overview. Overview hides architectural shell pieces for a cutaway. The prepared lesson explains the browser/API/database journey; it is not generated from a user upload. Learners can play/pause, choose chapters, opt into browser speech, use a reading alternative and complete a short assessment. With speech off, chapter timing is 11 seconds. With speech on, advancement follows the browser utterance end event. Browser voice availability and pronunciation vary; human teacher animation and lip sync are not implemented.

Progress is stored in this browser only. A saved completion label appears only after a successful storage write. There is no account sync. The lecture does not call Vertex, bill a cloud renderer or run a database query; its link to Computer Science opens the existing real local query demonstration.

## Integration and trade-offs

`StudioRouter.tsx` selects the lecture route and otherwise opens Computer Science. Lecture assets and code are loaded on demand. The large shared renderer chunk still produces Vite's size warning. The room asset is suitable for a local desktop prototype; mobile GPU performance, compressed geometry, texture baking and production asset budgets remain follow-up work. The reading view preserves lesson access when the room is hidden or cannot load.

The Computer Science selector links to Lecture Theatre. Its spatial object labels were moved down to avoid covering the teaching board. Claude's ENG-001 stays open and separate: only an actual Claude session may claim its reserved engineering folders. The engineering module is not imported until a reviewed handoff is ready.

## Claude setup

Start at `coordination/briefs/START-CLAUDE.md`. It points to a complete Claude Code implementation prompt, an optional Claude Design prototype brief and the integration contract. Installed React/Three.js/R3F/Drei/Blender tooling is sufficient for the first Engineering Studio. No new paid generator is required. The local bus is cooperative and pull based; browser-only Claude Design does not automatically read project files or join it.

## Verification

TypeScript/Vite build and browser review are recorded in `coordination/handoffs/2026-10-21-lecture.md`. Passing a local build is not evidence of production readiness or educational validation.
