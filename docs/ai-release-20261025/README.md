# AI release staging package — 25 October 2026

**Status:** clean, allowlisted staging source assembled and statically checked. This is packaging evidence only; root owns the build, integration, container build, cloud preflight, and deployment.

## Need and judging evidence

- **Product:** keep the existing authenticated source → reviewed lesson → practice path packageable with its actual server imports, curriculum data, Python extraction support, and built client.
- **Sustainability:** a reproducible PowerShell allowlist emits a per-file SHA-256 manifest and checks that local imports resolve and external imports are declared in `package.json`.
- **Intelligence:** stage the existing AI runtime and its evidence/event validators without implying that a model, predictor, or new listening flow was validated in the cloud.
- **Acceptance evidence:** `stage.ps1` produced 142 files (71,268,831 bytes), excluded private/local dependencies, and its static validator passed on Node v24 with 32 staged source modules, a 35-file hosted/feature import closure, and two resolved `dist/index.html` asset references.

## Run

From the repository root:

```powershell
.\tools\ai-release-20261025\stage.ps1
```

The script requires the existing `studio/dist/index.html`, replaces only the checked `tools/ai-release-20261025/stage` directory, writes `tools/ai-release-20261025/stage-evidence.json`, and runs static validation. Run the validator independently with:

```powershell
node tools/ai-release-20261025/validate-stage.mjs tools/ai-release-20261025/stage
```

Use `tools/ai-release-20261025/stage` as the Docker build context. The staged Dockerfile targets Node 24, preserves the existing Python/Tesseract extraction environment, installs only production npm dependencies in the image build, and launches `server/learner-entry.mjs`. No build, package installation, image build, cloud access, billing, or deployment was run during this staging task.

## Allowlisted contents

- Hosted entry and local static import dependencies: `studio/server/learner-entry.mjs`, account/repository/workspace/avatar/student-space modules, AI runtime, opportunities, extraction coverage, listening core, workspace model/passage/native-extraction modules, `google.mjs`, and `trace.mjs`.
- TypeScript modules required by server imports: evidence selection, lesson draft validation/types, learner pattern-event validation, workspace/extraction-summary types, plus the extraction coverage, opportunities, and listening UI source folders.
- Runtime data and assets: the two `studio/data/student-spaces/*.json` curriculum records, the allowlisted `studio/dist`, `tools/material_ingestion/extract.py`, and the project’s pinned npm manifests.
- Opportunity evidence/fixtures: `data/opportunities-20261025/source-evidence.json`, `data/public/opportunities/fnb-current-review.json`, and `rmb-preparation-matrix.json`. The FNB/RMB files are dated research/preparation snapshots whose own status labels remain unknown; they are not inputs to `listOpportunities`, not current vacancies, and not advertised by this runtime. The live opportunity helper uses its reviewed in-code seed and displays its source status/checked date.

## Safety and limits

- The copy list is explicit; the stage rejects `.env*`, `*.local*`, `.git`, `node_modules`, `data/private`, and symlinks. It never copies the repository wholesale.
- The static validator checks relative imports in staged server/source modules, checks external package names against declared dependencies, verifies hosted and feature-entry closures, and checks root HTML asset references. It does not execute the server, typecheck/compile source, install packages, build a container, or verify cloud configuration.
- The stage targets the existing private learner service shape. It makes no public IAM change and supplies no credentials or live provider readiness.
- The existing `studio/dist` includes the opportunities page and extraction/source workspace code, but does not contain the new listening transcript-review panel. Listening source is included, but the current built UI will not display that panel until root builds and integrates it.
- Opportunities source is not proof that a vacancy is open. AI runtime source is not proof of provider access or learning gains. Automated closure success does not establish production readiness.

## Remaining work

Root should review the manifest and Dockerfile, rebuild the frontend after integration decisions, run the owned test/build lanes, build and inspect the container artifact, perform the approved read-only cloud preflight, and preserve IAM-private access. Deployment and release acceptance remain separate decisions.
