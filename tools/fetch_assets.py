"""Download the two reviewed, public studio assets; retain provenance and hashes."""
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = [
    ('studio/public/models/RobotExpressive.glb',
     'https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
     'CC0-1.0', 'Tomás Laulhé; glTF modifications by Don McCurdy',
     'https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/RobotExpressive/README.md'),
    ('assets/reference/classroom.zip', 'https://download.blender.org/demo/test/classroom.zip',
     'CC0-1.0', 'Christophe Seux', 'https://www.blender.org/download/demo-files/'),
]


def main():
    manifest = []
    for relative, url, license_id, author, source in ASSETS:
        destination = ROOT / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            temporary = destination.with_suffix(destination.suffix + '.part')
            request = urllib.request.Request(url, headers={'User-Agent': 'KAIRO-asset-setup/0.1'})
            with urllib.request.urlopen(request, timeout=60) as response, temporary.open('wb') as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
            temporary.replace(destination)
        digest = hashlib.sha256(destination.read_bytes()).hexdigest()
        manifest.append(dict(path=relative, url=url, license=license_id, author=author,
                             source=source, sha256=digest, bytes=destination.stat().st_size,
                             usage='animated temporary guide' if relative.endswith('.glb')
                             else 'downloaded reference; not converted into the running room'))
        print(f'{relative}: {destination.stat().st_size} bytes; SHA256 {digest}')
    (ROOT / 'assets/manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    # Retain the creator's original attribution beside the runtime asset.
    urllib.request.urlretrieve(ASSETS[0][4], ROOT / 'studio/public/models/RobotExpressive.README.md')


if __name__ == '__main__':
    main()
