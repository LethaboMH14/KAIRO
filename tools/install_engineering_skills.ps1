param()
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectRoot '.claude/skills'
$installer = Join-Path $env:USERPROFILE '.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py'
if (-not (Test-Path -LiteralPath $installer)) {
  throw 'Bundled installer not found. Use BUILD-AND-TOOLS.md and the pinned GitHub revisions; do not run an arbitrary replacement installer.'
}
$groups = @(
  @{ Repo='CloudAI-X/threejs-skills'; Ref='0e181866f095b5f06d005133876e926515390d95'; Names=@('threejs-fundamentals','threejs-interaction','threejs-animation','threejs-materials','threejs-lighting','threejs-loaders') },
  @{ Repo='anthropics/skills'; Ref='dbd4588f9e1033efb41dad4bef2f7947c8993d44'; Names=@('frontend-design') }
)
foreach ($group in $groups) {
  foreach ($skillName in $group.Names) {
    $skillPath = Join-Path $destination $skillName
    if (Test-Path -LiteralPath $skillPath) {
      if (-not (Test-Path -LiteralPath (Join-Path $skillPath 'SKILL.md'))) { throw "Existing directory has no SKILL.md: $skillPath" }
      Write-Output "Already present; preserved: $skillName"
      continue
    }
    & python $installer --repo $group.Repo --ref $group.Ref --path "skills/$skillName" --dest $destination
    if ($LASTEXITCODE -ne 0) { throw "Installation failed: $skillName" }
  }
}
Write-Output 'Skills are project-local. Start the next Claude Code turn/session in this project to discover them. Browser Design does not automatically receive local skills.'
