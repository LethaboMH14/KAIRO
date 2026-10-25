$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$stageRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'deploy')).Path
$serverRoot = Join-Path $stageRoot 'server'
New-Item -ItemType Directory -Path $serverRoot -Force | Out-Null
foreach ($folder in @('hosted-core','hosted-auth')) {
    $sourceRoot = Join-Path $repoRoot "studio/server/$folder"
    $targetRoot = Join-Path $serverRoot $folder
    New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
    Get-ChildItem -LiteralPath $sourceRoot -File -Filter '*.mjs' | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $targetRoot $_.Name)
    }
}
# Explicit allowlist only: no learner data, model assets, local credentials or legacy workspace routes.
Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-Object FullName,Length
