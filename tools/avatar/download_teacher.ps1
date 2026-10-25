$ErrorActionPreference = 'Stop'
$avatarRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$avatarSource = Join-Path $avatarRoot 'assets/reference/teacher'
New-Item -ItemType Directory -Force $avatarSource | Out-Null
$avatarCommit = '2afe6d79779313db8909badebf46f9805a6c7b70'
$avatarBase = "https://raw.githubusercontent.com/met4citizen/TalkingHead/$avatarCommit"
$avatarFile = Join-Path $avatarSource 'mpfb-original.glb'
Invoke-WebRequest "$avatarBase/avatars/mpfb.glb" -OutFile $avatarFile
if ((Get-FileHash -LiteralPath $avatarFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne '63c645a2a863b9972e9a9c2ed576a1de4c390b8475508e1473e69c87a3ee299c') { throw 'Avatar checksum mismatch. Do not prepare or serve this file.' }
Invoke-WebRequest "$avatarBase/README.md" -OutFile (Join-Path $avatarSource 'TalkingHead-README.md')
Invoke-WebRequest "$avatarBase/LICENSE" -OutFile (Join-Path $avatarSource 'TalkingHead-LICENSE.txt')
Write-Output 'Pinned CC0 model and provenance downloaded. No external code was executed.'
