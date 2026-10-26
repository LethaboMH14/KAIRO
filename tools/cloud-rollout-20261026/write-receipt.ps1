[CmdletBinding()]
param([Parameter(Mandatory)][string]$Project,[Parameter(Mandatory)][string]$Region,[Parameter(Mandatory)][string]$Service,[Parameter(Mandatory)][string]$Commit,[Parameter(Mandatory)][string]$Image,[Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference='Stop'
if ($Commit -notmatch '^[0-9a-f]{40}$') { throw 'Commit must be a full 40-character lowercase Git SHA.' }
if ($Image -notmatch '^.+@sha256:[0-9a-f]{64}$') { throw 'Image must be pinned by a full sha256 digest.' }
$dir=[IO.Path]::GetFullPath((Split-Path -Parent $OutputPath)); New-Item -ItemType Directory -Force -Path $dir | Out-Null
$path=[IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $path) { throw 'Refusing to overwrite an existing deployment receipt.' }
$receipt=[ordered]@{ schemaVersion=1; createdAt=[DateTimeOffset]::Now.ToString('o'); project=$Project; region=$Region; service=$Service; commit=$Commit; image=$Image }
$receipt | ConvertTo-Json | Set-Content -LiteralPath $path -Encoding utf8
Get-FileHash -LiteralPath $path -Algorithm SHA256 | Select-Object Path,Hash | ConvertTo-Json
