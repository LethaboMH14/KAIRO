[CmdletBinding()]
param([Parameter(Mandatory)][string]$Project,[Parameter(Mandatory)][string]$Region,[string]$QueueLocation='europe-west1',[Parameter(Mandatory)][string]$OutputPath)
$ErrorActionPreference='Stop'
if(!(Get-Command gcloud -ErrorAction SilentlyContinue)){throw 'gcloud CLI is required.'}
function Invoke-GcloudJson([string[]]$Args,[string]$Description){
 $raw=& gcloud @Args 2>$null
 if($LASTEXITCODE -ne 0){return [pscustomobject]@{ok=$false;description=$Description;error='metadata_query_failed'}}
 try{return [pscustomobject]@{ok=$true;data=(($raw -join "`n")|ConvertFrom-Json)}}catch{return [pscustomobject]@{ok=$false;description=$Description;error='invalid_json'}}
}
$services=Invoke-GcloudJson @('run','services','list','--project',$Project,'--region',$Region,'--format=json') 'Cloud Run services'
$buckets=Invoke-GcloudJson @('storage','buckets','list','--project',$Project,'--format=json') 'Cloud Storage buckets'
$databases=Invoke-GcloudJson @('firestore','databases','list','--project',$Project,'--format=json') 'Firestore databases'
$queues=Invoke-GcloudJson @('tasks','queues','list','--project',$Project,'--location',$QueueLocation,'--format=json') 'Cloud Tasks queues'
$runItems=@(); if($services.ok){foreach($svc in $services.data){$runItems+=,[pscustomobject]@{name=$svc.metadata.name;readyRevision=$svc.status.latestReadyRevisionName;url=$svc.status.url}}}
$bucketItems=@(); if($buckets.ok){foreach($b in $buckets.data){$bucketItems+=,[pscustomobject]@{name=([uri]$b.name).Host;location=$b.location;storageClass=$b.storageClass}}}
$dbItems=@(); if($databases.ok){foreach($db in $databases.data){$dbItems+=,[pscustomobject]@{name=($db.name -split '/')[-1];location=$db.locationId;type=$db.type}}}
$queueItems=@(); if($queues.ok){foreach($q in $queues.data){$queueItems+=,[pscustomobject]@{name=($q.name -split '/')[-1];state=$q.state;location=($q.name -split '/')[3]}}}
$result=[ordered]@{schemaVersion=1;checkedAt=[DateTimeOffset]::Now.ToString('o');project=$Project;region=$Region;resources=[ordered]@{cloudRun=$runItems;storageBuckets=$bucketItems;firestore=$dbItems;taskQueues=$queueItems};queryStatus=@([pscustomobject]@{resource='cloudRun';ok=$services.ok},[pscustomobject]@{resource='storage';ok=$buckets.ok},[pscustomobject]@{resource='firestore';ok=$databases.ok},[pscustomobject]@{resource='tasks';ok=$queues.ok});limitations=@('Names and selected metadata only; no learner records, object names, secret payloads, or application contents.','A missing query result is unknown, not proof the resource does not exist.','Billing exports, credit balance/expiry and retention policies require separate authorized checks.')}
$out=[IO.Path]::GetFullPath($OutputPath); $parent=Split-Path -Parent $out; New-Item -ItemType Directory -Force -Path $parent|Out-Null
$result|ConvertTo-Json -Depth 7|Set-Content -LiteralPath $out -Encoding utf8
Get-Content -Raw -LiteralPath $out
