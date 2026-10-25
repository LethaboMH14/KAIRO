import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
repo_dir=ROOT/'tools/claude-kit/blender-extensions'
repo_dir.mkdir(parents=True,exist_ok=True)
repos=bpy.context.preferences.extensions.repos
repo=next((r for r in repos if r.module=='kairo_local'),None)
if repo is None:
    repo=repos.new(name='KAIRO Local',module='kairo_local',custom_directory=str(repo_dir))
module_name='bl_ext.kairo_local.mpfb'
if not (repo_dir/'mpfb/__init__.py').exists():
    bpy.ops.extensions.package_install_files(filepath=str(ROOT/'assets/reference/claude-kit/mpfb-v2.0.18.zip'),repo='kairo_local',enable_on_install=True)
else:
    bpy.ops.preferences.addon_enable(module=module_name)
