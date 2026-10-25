"""Install a checksum-verified portable Blender LTS inside this workspace."""
import hashlib
import json
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = '4.5.14'
NAME = f'blender-{VERSION}-windows-x64.zip'
BASE = 'https://download.blender.org/release/Blender4.5/'


def main():
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    archive = cache / NAME
    sums = urllib.request.urlopen(BASE + f'blender-{VERSION}.sha256', timeout=45).read().decode()
    expected = next(line.split()[0] for line in sums.splitlines() if line.split()[-1] == NAME)
    if not archive.exists():
        temporary = archive.with_suffix('.part')
        with urllib.request.urlopen(BASE + NAME, timeout=90) as response, temporary.open('wb') as output:
            total = 0
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                total += len(chunk)
                if total % (32 * 1024 * 1024) == 0:
                    print(f'Downloaded {total // (1024 * 1024)} MiB', flush=True)
        temporary.replace(archive)
    actual = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    if actual != expected:
        raise RuntimeError('Official Blender checksum does not match; archive not executed or extracted')
    destination = ROOT / 'blender'
    destination.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            try:
                (destination / member.filename).resolve().relative_to(destination.resolve())
            except ValueError:
                raise RuntimeError('Archive contains an escaping path') from None
        executable = destination / f'blender-{VERSION}-windows-x64' / 'blender.exe'
        if not executable.exists():
            bundle.extractall(destination)
    manifest = dict(version=VERSION, executable=str(executable), url=BASE + NAME, sha256=actual,
                    mode='portable, project-local; system PATH unchanged')
    (ROOT / 'blender-install.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == '__main__':
    main()
