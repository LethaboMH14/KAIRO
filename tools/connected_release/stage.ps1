param([string]$EvidencePath='docs/experience-connected-20261024/stage-evidence.json')
$ErrorActionPreference='Stop'
$releaseRoot=$PSScriptRoot
$repoRoot=(Resolve-Path -LiteralPath (Join-Path $releaseRoot '../..')).Path
$stageRoot=Join-Path $releaseRoot 'stage'
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'studio/server') -Force | Out-Null
# Explicit allowlist: never copy .env, private records, local credentials or the full repository.
foreach($name in @('package.json','package-lock.json')){Copy-Item -LiteralPath (Join-Path $repoRoot "studio/$name") -Destination (Join-Path $stageRoot "studio/$name")}
foreach($folder in @('account','learner-repository','learner-workspace','avatar','student-space')){Copy-Item -LiteralPath (Join-Path $repoRoot "studio/server/$folder") -Destination (Join-Path $stageRoot 'studio/server') -Recurse -Force}
foreach($name in @('learner-entry.mjs','google.mjs','trace.mjs')){Copy-Item -LiteralPath (Join-Path $repoRoot "studio/server/$name") -Destination (Join-Path $stageRoot "studio/server/$name")}
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'studio/server/workspace') -Force | Out-Null
foreach($name in @('model.mjs','native-extraction.mjs','passages.mjs')){Copy-Item -LiteralPath (Join-Path $repoRoot "studio/server/workspace/$name") -Destination (Join-Path $stageRoot "studio/server/workspace/$name")}
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'studio/data') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'studio/data/student-spaces') -Destination (Join-Path $stageRoot 'studio/data') -Recurse -Force
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'studio/src') -Force | Out-Null
foreach($folder in @('evidence-selection-core','lesson-draft-core')){Copy-Item -LiteralPath (Join-Path $repoRoot "studio/src/$folder") -Destination (Join-Path $stageRoot 'studio/src') -Recurse -Force}
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'tools/material_ingestion') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'tools/material_ingestion/extract.py') -Destination (Join-Path $stageRoot 'tools/material_ingestion/extract.py')
Copy-Item -LiteralPath (Join-Path $repoRoot 'studio/dist') -Destination (Join-Path $stageRoot 'studio') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $releaseRoot 'Dockerfile') -Destination (Join-Path $stageRoot 'Dockerfile')
$files=Get-ChildItem -LiteralPath $stageRoot -Recurse -File
if($files.Where({$_.Name -like '*.local*' -or $_.Name -like '.env*' -or $_.FullName -match 'data[\/]private|node_modules'}).Count){throw 'Deployment allowlist check failed'}
$evidenceTarget=[IO.Path]::GetFullPath((Join-Path $repoRoot $EvidencePath))
if(!$evidenceTarget.StartsWith($repoRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Evidence output must remain in the repository'}
@{fileCount=$files.Count;bytes=($files | Measure-Object Length -Sum).Sum;allowlistChecked=$true} | ConvertTo-Json | Set-Content -LiteralPath $evidenceTarget

