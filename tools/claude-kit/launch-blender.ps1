param([string]$BlendFile, [switch]$Verify)
$ErrorActionPreference='Stop'
$kairoRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$blenderInfo=Get-Content -LiteralPath (Join-Path $kairoRoot 'tools/blender-install.json') -Raw | ConvertFrom-Json
$env:BLENDER_USER_SCRIPTS=Join-Path $PSScriptRoot 'blender-scripts'
$env:BLENDER_USER_CONFIG=Join-Path $PSScriptRoot 'blender-config'
$env:BLENDER_USER_DATAFILES=Join-Path $PSScriptRoot 'blender-data'
$env:BLENDER_USER_RESOURCES=Join-Path $PSScriptRoot 'blender-user'
$kairoPriorAppData=$env:APPDATA
$env:APPDATA=Join-Path $PSScriptRoot 'profile-roaming'
$env:TEMP=Join-Path $PSScriptRoot 'temp'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP,$env:BLENDER_USER_CONFIG,$env:BLENDER_USER_DATAFILES,$env:BLENDER_USER_RESOURCES,$env:APPDATA | Out-Null
try {
 if ($Verify) { & $blenderInfo.executable --background --factory-startup --disable-autoexec --python-exit-code 1 --python (Join-Path $PSScriptRoot 'probe_mpfb.py'); exit $LASTEXITCODE }
 if ($BlendFile) { Start-Process -FilePath $blenderInfo.executable -ArgumentList @('--disable-autoexec',('"'+$BlendFile+'"')) -WindowStyle Hidden }
 else { Start-Process -FilePath $blenderInfo.executable -ArgumentList @('--disable-autoexec','--python',(Join-Path $PSScriptRoot 'enable_mpfb.py')) -WindowStyle Hidden }
} finally { $env:APPDATA=$kairoPriorAppData }
