# Rebuilds the KAIRO teacher end to end from the downloaded Rain v3 archive (CC-BY 4.0, Blender Studio).
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/character/blender/build_all.ps1 -Work <scratch dir> [-SkipReview]
# Stages: extract Rain -> UV masks -> textures -> build (identity, materials) -> hair -> wardrobe -> GLB export with clips
# -> WebP + meshopt (glTF-Transform) -> structural inspection, hair clearance, clip hinges + Khronos validator (all
# must pass) -> deploy to studio/public/models/character -> parity re-import and portrait. Stops on the first failure.
param(
  [Parameter(Mandatory = $true)][string]$Work,
  [switch]$SkipReview,
  # Resume from a stage (extract, masks, textures, build, hair, wardrobe, export) when earlier outputs are current.
  [string]$From = 'extract'
)
$stages = @('extract', 'masks', 'textures', 'build', 'hair', 'wardrobe', 'export')
if ($stages -notcontains $From) { throw "Unknown -From stage $From" }
function Wanted($stage) { return $stages.IndexOf($stage) -ge $stages.IndexOf($From) }
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Set-Location $root
$blend = 'design/character/blender/kairo_teacher.blend'
$run = Join-Path $PSScriptRoot 'run-blender.ps1'
$temp = Join-Path $Work 'blender-temp'
New-Item -ItemType Directory -Force $Work, $temp | Out-Null

function Step($name, [scriptblock]$body) {
  $t = Get-Date
  Write-Host "== $name"
  $global:LASTEXITCODE = 0  # a step that runs no native command must not inherit an earlier code
  & $body
  if ($LASTEXITCODE -ne 0) { throw "$name failed with exit code $LASTEXITCODE" }
  Write-Host ("   done in {0:n1}s" -f ((Get-Date) - $t).TotalSeconds)
}
function Blender($script, $blendFile, $out, $mode) {
  $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $run, '-Script', $script, '-TempDir', $temp, '-Out', $out, '-Mode', $mode)
  if ($blendFile) { $args += @('-BlendFile', $blendFile) }
  $log = Join-Path $Work ((Split-Path $script -Leaf) + '.log')
  & powershell @args *>&1 | Out-File -Encoding utf8 $log
  if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 25; throw "$script failed (log: $log)" }
}

$rainDir = Join-Path $Work 'rain'
$rainBlend = Join-Path $rainDir 'Rain v3.3\rain_v3.2.blend'
Step 'extract Rain v3 (hash-checked)' {
  $zip = 'assets/reference/claude-kit/rain-v3.zip'
  $hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
  if ($hash -ne '80217f163f6392dc829233d63c2cfb5e1376775bc34101ad14f39631fea70d24') { throw "rain-v3.zip hash mismatch: $hash" }
  if (-not (Test-Path $rainBlend)) { python -I -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" $zip $rainDir }
}
if (Wanted 'masks') { Step 'UV masks from geometry' { Blender 'design/character/blender/uv_masks.py' $rainBlend $Work 'masks' } }
if (Wanted 'textures') { Step 'textures' {
  python -I design/character/blender/make_textures.py (Join-Path $rainDir 'Rain v3.3\textures') design/character/textures (Join-Path $Work 'hand_faces.json')
  python -I design/character/blender/make_hair_textures.py design/character/textures
  python -I design/character/blender/prepare_web_textures.py
} }
if (Wanted 'build') { Step 'build identity and materials' { Blender 'design/character/blender/build_teacher.py' $rainBlend 'design/character/blender' 'build' } }
if (Wanted 'hair') { Step 'hair' { Blender 'design/character/blender/teacher_hair.py' $blend 'design/character/blender' 'hair' } }
if (Wanted 'wardrobe') { Step 'wardrobe' { Blender 'design/character/blender/teacher_wardrobe.py' $blend 'design/character/blender' 'wardrobe' } }
$export = Join-Path $Work 'export'
Step 'export GLB with face shapes, correctives and clips' { Blender 'design/character/blender/rain_export.py' $blend $export 'full' }
$raw = Join-Path $export 'kairo-teacher.raw.glb'
$final = Join-Path $export 'kairo-teacher.glb'
Step 'compress (WebP colour maps, meshopt geometry)' {
  Push-Location tools/character/node
  try {
    npx gltf-transform webp $raw (Join-Path $export 'webp.glb') --slots baseColorTexture --quality 90
    if ($LASTEXITCODE -ne 0) { throw 'webp failed' }
    npx gltf-transform meshopt (Join-Path $export 'webp.glb') $final --level high
  } finally { Pop-Location }
}
Step 'inspect (raw and final) and validate' {
  python -I design/character/blender/glb_inspect.py $raw (Join-Path $export 'inspect-raw.json')
  if ($LASTEXITCODE -ne 0) { throw 'raw GLB structural problems' }
  python -I design/character/blender/glb_inspect.py $final (Join-Path $export 'inspect-final.json')
  if ($LASTEXITCODE -ne 0) { throw 'final GLB structural problems' }
  python -I design/character/blender/hair_clearance.py $raw (Join-Path $export 'hair-clearance.json')
  if ($LASTEXITCODE -ne 0) { throw 'locs pass through the shirt, body or face' }
  python -I design/character/blender/clip_check.py $raw (Join-Path $export 'clip-check.json')
  if ($LASTEXITCODE -ne 0) { throw 'a clip twists an elbow or knee about its own axis' }
  node design/character/blender/validate_glb.mjs $raw (Join-Path $export 'validator-raw.json')
  if ($LASTEXITCODE -ne 0) { throw 'raw GLB failed the Khronos validator' }
  node design/character/blender/validate_glb.mjs $final (Join-Path $export 'validator-final.json')
}
Step 'deploy to studio/public/models/character' {
  Copy-Item $final 'studio/public/models/character/kairo-teacher.glb' -Force
  Copy-Item (Join-Path $export 'export-report.json') 'docs/character/export-report.json' -Force
  Copy-Item (Join-Path $export 'inspect-final.json') 'docs/character/glb-structure.json' -Force
  Copy-Item (Join-Path $export 'hair-clearance.json') 'docs/character/hair-clearance.json' -Force
  Copy-Item (Join-Path $export 'clip-check.json') 'docs/character/clip-check.json' -Force
  Copy-Item (Join-Path $export 'validator-raw.json') 'docs/character/validator-raw.json' -Force
  Copy-Item (Join-Path $export 'validator-final.json') 'docs/character/validator-final.json' -Force
}
if (-not $SkipReview) {
  $review = Join-Path $Work 'review'
  Step 'parity re-import and portrait' { Blender 'design/character/blender/glb_review.py' $null $review $raw }
  Copy-Item (Join-Path $review 'teacher-portrait.png') 'studio/public/models/character/teacher-portrait.png' -Force
  Copy-Item (Join-Path $review 'parity.json') 'docs/character/parity.json' -Force
}
Get-FileHash 'studio/public/models/character/kairo-teacher.glb' -Algorithm SHA256 | Format-List
Write-Host 'BUILD_ALL_DONE'
