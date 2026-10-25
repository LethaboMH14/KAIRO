# KAIRO Studio foundation

**23 October connected app update:** the root now opens KAIRO Home with the selected C identity and a shared navigation shell. Start with `/sources?sample=stock`, review the public example, create a lesson, then use the connected `/classroom?lesson=ID` Learn/Practise/Keep-my-work journey. Existing studios live under `/studios`; the former root CS demo is `/computer-science`. Saved reading remains `/saved`. See `../docs/app-flow-20261023/README.md` for actual checks and remaining cloud/device acceptance.

Requires Node 22.13 or later. Dependencies are locked in package-lock.json.

```powershell
npm install
npm run dev
```

Open the printed local URL (default `http://127.0.0.1:4173`). Set `PORT` to choose another local port. The server binds to loopback; it is not exposed publicly.

`npm run build` type-checks and builds the client. `npm test` verifies the real SQLite trace engine, parameter binding and invalid input. `npm start` serves the built client.

The CS studio uses prepared content and a real local parameterized query. The app also has reviewed-source lessons, Rain, Engineering, practice and local evidence. Optional source lesson generation and cited passage help use the configured Google model with explicit consent; Google speech has separate saved consent. Production cloud storage, multi-user authorization and general live retrieval are not implemented. Local lexical search operates only on the current reviewed lesson's citations.

Server model configuration: `KAIRO_CLOUD_ENABLED=1` enables optional calls, `KAIRO_GOOGLE_PROJECT` and `KAIRO_GOOGLE_MODEL` override the existing defaults. Local CLI auth uses explicit `KAIRO_AUTH_MODE=gcloud`; deployment must use an attached least-privilege identity instead. `/api/services` distinguishes enabled configuration from a successful request. No provider secret is exposed to the client. See Settings for learner-facing consent/status.

The premade RobotExpressive model is CC0; see public/models/RobotExpressive.README.md. Browser narration uses the device's speech engine. Progress is stored in the current browser when storage is available. No model API key is required.

For the verified Windows cloud setup, set `KAIRO_CLOUD_ENABLED=1` and `KAIRO_AUTH_MODE=gcloud` in the starting shell. The local server captures the existing CLI token into backend memory. Keep this unauthenticated preview on loopback. Deployment must use a service identity, access controls and durable learner storage. See ../docs/KAIRO-SETUP-AND-ACCOUNTS.md.

See ../assets/manifest.json for downloaded asset source URLs and hashes. The Blender classroom download is a separate reference, not the code-authored room rendered in this foundation.
