# Runs a KAIRO character script in background Blender with the project-local MPFB setup.
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/character/blender/run-blender.ps1 -Script <path.py> [-BlendFile <file.blend>] [-Out <dir>] [-Mode <name>] [-TempDir <dir>]
# The script receives "-- <Out> <Mode>" after Blender's own arguments.
# Mirrors tools/claude-kit/launch-blender.ps1: Blender user/config/data paths point at the project's
# tools/claude-kit folders, embedded .blend scripts stay disabled and global preferences are not touched.
param(
  [Parameter(Mandatory = $true)][string]$Script,
  [string]$BlendFile,
  [string]$Out = '.',
  [string]$Mode = 'default',
  [string]$TempDir
)
$ErrorActionPreference = 'Stop'
$kairoRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$kit = Join-Path $kairoRoot 'tools/claude-kit'
$blenderInfo = Get-Content -LiteralPath (Join-Path $kairoRoot 'tools/blender-install.json') -Raw | ConvertFrom-Json
$env:BLENDER_USER_SCRIPTS = Join-Path $kit 'blender-scripts'
$env:BLENDER_USER_CONFIG = Join-Path $kit 'blender-config'
$env:BLENDER_USER_DATAFILES = Join-Path $kit 'blender-data'
$env:BLENDER_USER_RESOURCES = Join-Path $kit 'blender-user'
if (-not $TempDir) { $TempDir = Join-Path $kit 'temp' }
New-Item -ItemType Directory -Force $TempDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir
$priorAppData = $env:APPDATA
$env:APPDATA = Join-Path $kit 'profile-roaming'
try {
  $arguments = @('--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '1')
  if ($BlendFile) { $arguments += $BlendFile }
  $arguments += @('--python', $Script, '--', $Out, $Mode)
  & $blenderInfo.executable @arguments
  exit $LASTEXITCODE
} finally { $env:APPDATA = $priorAppData }
