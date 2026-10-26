[CmdletBinding()]
param([Parameter(Mandatory)][uri]$Uri,[Parameter(Mandatory)][string]$ExpectedHost,[int]$TimeoutSec=20,[int]$MaxBytes=65536)
$ErrorActionPreference='Stop'
if ($Uri.Scheme -ne 'https' -or $Uri.Host -ne $ExpectedHost -or $Uri.UserInfo) { throw 'Smoke URI must be HTTPS on the explicitly expected host, without user-info.' }
$timer=[Diagnostics.Stopwatch]::StartNew()
try {
  $response=Invoke-WebRequest -Uri $Uri -Method Get -MaximumRedirection 0 -TimeoutSec $TimeoutSec -MaximumRetryCount 0 -ErrorAction Stop
  $status=[int]$response.StatusCode
  $bytes=[Text.Encoding]::UTF8.GetByteCount([string]$response.Content)
  if ($bytes -gt $MaxBytes) { throw "Smoke body exceeded configured bound ($MaxBytes bytes)." }
  $result=[ordered]@{ checkedAt=[DateTimeOffset]::Now.ToString('o'); host=$Uri.Host; status=$status; durationMs=$timer.ElapsedMilliseconds; bodyBytes=$bytes; contentType=[string]$response.Headers['Content-Type']; locationPresent=[bool]$response.Headers['Location'] }
  $result | ConvertTo-Json
  if ($status -lt 200 -or $status -ge 400) { exit 2 }
} catch {
  $code=if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{$null}
  [ordered]@{ checkedAt=[DateTimeOffset]::Now.ToString('o'); host=$Uri.Host; status=$code; durationMs=$timer.ElapsedMilliseconds; errorClass=$_.Exception.GetType().Name } | ConvertTo-Json
  exit 2
}
