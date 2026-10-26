[CmdletBinding()]
param([Parameter(Mandatory)][string]$Project,[Parameter(Mandatory)][string]$Region,[Parameter(Mandatory)][string]$Service,[int]$LookbackDays=7)
$ErrorActionPreference='Stop'
if($LookbackDays -lt 1 -or $LookbackDays -gt 30){throw 'LookbackDays must be between 1 and 30.'}
if(!(Get-Command gcloud -ErrorAction SilentlyContinue)){throw 'gcloud CLI is required.'}
$serviceRaw=& gcloud run services describe $Service --project $Project --region $Region --format=json 2>$null
if($LASTEXITCODE -ne 0){throw 'Cloud Run service metadata query failed.'}
$svc=($serviceRaw -join "`n")|ConvertFrom-Json
$alertsRaw=& gcloud monitoring policies list --project $Project --format=json 2>$null
$alerts=if($LASTEXITCODE -eq 0){@((($alertsRaw -join "`n")|ConvertFrom-Json) | ForEach-Object { [pscustomobject]@{ displayName=$_.displayName; enabled=$_.enabled; combiner=$_.combiner } })}else{@()}
$revisionNames=@($svc.status.traffic | ForEach-Object { $_.revisionName } | Where-Object { $_ })
$revisions=@()
foreach($revision in $revisionNames){
  $raw=& gcloud run revisions describe $revision --project $Project --region $Region --format=json 2>$null
  if($LASTEXITCODE -eq 0){$rev=($raw -join "`n")|ConvertFrom-Json; $revisions += [pscustomobject]@{ revision=$revision; created=[string]$rev.metadata.creationTimestamp; imageDigest=[regex]::Match([string]$rev.spec.containers[0].image,'@sha256:([a-f0-9]{64})$').Groups[1].Value }}
}
[ordered]@{ schemaVersion=1; checkedAt=[DateTimeOffset]::Now.ToString('o'); project=$Project; region=$Region; service=$Service; activeTraffic=@($svc.status.traffic|ForEach-Object{[pscustomobject]@{revision=$_.revisionName;percent=$_.percent}}); revisions=$revisions; monitoringAlerts=$alerts; notes=@('Read-only metadata only. No alert presence or absence is a cost guarantee.','Retention/deletion lifecycle requires application and storage policy evidence; this check does not inspect learner records.','Cost totals require an authorized billing export and are not inferred from Cloud Run metadata.') }|ConvertTo-Json -Depth 8
