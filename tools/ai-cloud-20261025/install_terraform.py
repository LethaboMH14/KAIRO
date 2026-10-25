"""Install an official checksum-verified local Terraform CLI; no infrastructure apply."""
import hashlib,io,json,platform,subprocess,urllib.request,zipfile
from pathlib import Path
r=Path(__file__).resolve().parents[2];base='https://releases.hashicorp.com/terraform/'
def download(url,limit):
 with urllib.request.urlopen(url,timeout=90) as response:
  value=response.read(limit+1)
  if len(value)>limit:raise RuntimeError('Download exceeded its bound.')
  return value
versions=json.loads(download(base+'index.json',4_000_000))['versions']
version=max((v for v in versions if all(x.isdigit() for x in v.split('.'))),key=lambda s:tuple(map(int,s.split('.'))))
if platform.machine().lower() not in ('amd64','x86_64'):raise SystemExit('Only the verified Windows amd64 package is configured.')
name=f'terraform_{version}_windows_amd64.zip'
checks=download(base+version+f'/terraform_{version}_SHA256SUMS',1_000_000).decode()
expected=next(line.split()[0] for line in checks.splitlines() if line.split()[-1]==name)
package=download(base+version+'/'+name,100_000_000)
if hashlib.sha256(package).hexdigest()!=expected:raise SystemExit('Terraform checksum mismatch.')
target=r/'tools/ai-cloud-20261025/bin';target.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(package)) as z:(target/'terraform.exe').write_bytes(z.read('terraform.exe'))
print(json.dumps({'installed':True,'version':version,'sha256':expected,'source':base+version+'/'+name,'infrastructureApplied':False}))
