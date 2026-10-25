"""Extract verified MPFB into the project extension repo; use the launcher to enable."""
from pathlib import Path
import zipfile,hashlib,json
ROOT=Path(__file__).resolve().parents[2];archive=ROOT/'assets/reference/claude-kit/mpfb-v2.0.18.zip';dest=ROOT/'tools/claude-kit/blender-extensions/mpfb'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad'
dest.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(archive) as z:
 for info in z.infolist():
  path=(dest/info.filename).resolve()
  if not path.is_relative_to(dest.resolve()):raise ValueError('Unsafe archive path')
 z.extractall(dest)
print(json.dumps({'installedPath':str(dest),'initExists':(dest/'__init__.py').exists(),'manifestExists':(dest/'blender_manifest.toml').exists()}))
