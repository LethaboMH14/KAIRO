$ErrorActionPreference = 'Stop'
$releaseRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $releaseRoot '../..')).Path
$stageCandidate = [IO.Path]::GetFullPath((Join-Path $releaseRoot 'stage'))
$expectedStage = [IO.Path]::GetFullPath((Join-Path $releaseRoot 'stage'))
$releasePrefix = $releaseRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if ($stageCandidate -ne $expectedStage -or !$stageCandidate.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to stage outside tools/ai-release-20261025/stage.'
}

$studioRoot = Join-Path $stageCandidate 'studio'
$deniedPattern = '(^|[\\/])(?:\.git|node_modules|private)(?:[\\/]|$)|(^|[\\/])\.env[^\\/]*$|\.local(?:$|[.])'

function Assert-AllowedSource([string]$relativePath) {
  if ([IO.Path]::IsPathRooted($relativePath) -or $relativePath -match $deniedPattern) {
    throw "Rejected allowlist source path: $relativePath"
  }
  $fullPath = (Resolve-Path -LiteralPath (Join-Path $repoRoot $relativePath)).Path
  $repoPrefix = $repoRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
  if (!$fullPath.StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Source escaped repository: $relativePath" }
  return $fullPath
}

function Copy-AllowedFile([string]$relativePath, [string]$stageRelativePath) {
  $source = Assert-AllowedSource $relativePath
  if (!(Test-Path -LiteralPath $source -PathType Leaf)) { throw "Required staging file is missing: $relativePath" }
  if ((Get-Item -LiteralPath $source).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Symlinks are not accepted in the staging allowlist: $relativePath" }
  if ($relativePath -match $deniedPattern) { throw "Denied staging file: $relativePath" }
  $destination = Join-Path $stageCandidate $stageRelativePath
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Copy-AllowedTree([string]$relativePath, [string]$stageRelativePath) {
  $source = Assert-AllowedSource $relativePath
  if (!(Test-Path -LiteralPath $source -PathType Container)) { throw "Required staging directory is missing: $relativePath" }
  $items = @(Get-ChildItem -LiteralPath $source -Force -Recurse)
  foreach ($item in $items) {
    $itemRelative = [IO.Path]::GetRelativePath($repoRoot, $item.FullName)
    if ($itemRelative -match $deniedPattern) { throw "Denied file or folder found in allowlist tree: $itemRelative" }
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Symlinks are not accepted in the staging allowlist: $itemRelative" }
  }
  $destination = Join-Path $stageCandidate $stageRelativePath
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
  foreach ($file in $items | Where-Object { !$_.PSIsContainer }) {
    $fileRelative = [IO.Path]::GetRelativePath($source, $file.FullName)
    $target = Join-Path $destination $fileRelative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
  }
}

$distSource = Assert-AllowedSource 'studio/dist'
if (!(Test-Path -LiteralPath (Join-Path $distSource 'index.html') -PathType Leaf)) {
  throw 'studio/dist/index.html is missing. Build is owned by root; stage only after dist exists.'
}

if (Test-Path -LiteralPath $stageCandidate) {
  $resolvedStage = (Resolve-Path -LiteralPath $stageCandidate).Path
  if ($resolvedStage -ne $expectedStage -or !$resolvedStage.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to clean a stage directory whose resolved path is outside the package subtree.'
  }
  Remove-Item -LiteralPath $resolvedStage -Recurse -Force
}
New-Item -ItemType Directory -Path $studioRoot -Force | Out-Null

# Production package metadata: no installed modules are copied into the stage.
Copy-AllowedFile 'studio/package.json' 'studio/package.json'
Copy-AllowedFile 'studio/package-lock.json' 'studio/package-lock.json'

# Complete static import closure reachable from studio/server/learner-entry.mjs.
foreach ($folder in @('account','learner-repository','learner-workspace','avatar','student-space','ai-runtime','opportunities','opportunity-freshness','owner-retrieval','source-catalog','extraction-coverage','listening-core','bundle-lessons','bundle-lesson-local','lesson-v2','lesson-versions')) {
  Copy-AllowedTree "studio/server/$folder" "studio/server/$folder"
}
foreach ($file in @('learner-entry.mjs','google.mjs','trace.mjs')) {
  Copy-AllowedFile "studio/server/$file" "studio/server/$file"
}
foreach ($file in @('model.mjs','native-extraction.mjs','passages.mjs')) {
  Copy-AllowedFile "studio/server/workspace/$file" "studio/server/workspace/$file"
}

# TypeScript modules imported by hosted server code on Node 24, and their UI companions.
foreach ($folder in @('evidence-selection-core','lesson-draft-core','learner-pattern-events','extraction-coverage-ui','extraction-summary-ui','opportunities','listening-core')) {
  Copy-AllowedTree "studio/src/$folder" "studio/src/$folder"
}
Copy-AllowedFile 'studio/src/workspace/types.ts' 'studio/src/workspace/types.ts'

# Curriculum data read by student-space/model.mjs and only selected public metadata fixtures.
Copy-AllowedTree 'studio/data/student-spaces' 'studio/data/student-spaces'
Copy-AllowedFile 'data/opportunities-20261025/source-evidence.json' 'data/opportunities-20261025/source-evidence.json'
foreach ($file in @('fnb-current-review.json','rmb-preparation-matrix.json')) {
  Copy-AllowedFile "data/public/opportunities/$file" "data/public/opportunities/$file"
}

# Extraction's explicit Python helper and built static client, both required by the hosted entry.
Copy-AllowedFile 'tools/material_ingestion/extract.py' 'tools/material_ingestion/extract.py'
Copy-AllowedTree 'studio/dist' 'studio/dist'
Copy-AllowedFile 'tools/ai-release-20261025/Dockerfile' 'Dockerfile'

$files = @(Get-ChildItem -LiteralPath $stageCandidate -File -Recurse)
$violations = @($files | Where-Object { $_.FullName -match $deniedPattern })
if ($violations.Count) { throw "Stage denylist check failed: $($violations[0].FullName)" }
$evidencePath = Join-Path $releaseRoot 'stage-evidence.json'
$manifest = foreach ($file in $files) {
  [PSCustomObject]@{
    path = [IO.Path]::GetRelativePath($stageCandidate, $file.FullName).Replace('\','/')
    bytes = $file.Length
    sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
}
[PSCustomObject]@{
  schemaVersion = 1
  stagedAt = [DateTimeOffset]::Now.ToString('o')
  nodeBase = 'node:24-bookworm-slim'
  fileCount = $files.Count
  totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
  allowlistChecked = $true
  excluded = @('.env and local credentials','data/private','node_modules','.git','full repository')
  manifest = @($manifest)
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $evidencePath -Encoding utf8

node (Join-Path $releaseRoot 'validate-stage.mjs') $stageCandidate
if ($LASTEXITCODE -ne 0) { throw "Static staging validation failed with exit code $LASTEXITCODE" }
Write-Output "Staged $($files.Count) files ($((($files | Measure-Object Length -Sum).Sum))) bytes at $stageCandidate"
Write-Output "Evidence: $evidencePath"
