[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$Project,
 [Parameter(Mandatory)][string]$Region,
 [Parameter(Mandatory)][string]$Service,
 [string[]]$RequiredSecrets = @(),
 [string]$FixturePath
)
$ErrorActionPreference='Stop'
if($FixturePath){$data=Get-Content -Raw -LiteralPath $FixturePath|ConvertFrom-Json}
else {
 $activeProject=(& gcloud config get-value project 2>$null|Out-String).Trim()
 $activeAccount=(& gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>$null|Out-String).Trim()
 if($activeProject -and $activeProject -ne $Project){throw "Configured project differs from requested $Project."}
 if(!$activeAccount){throw 'No active gcloud account.'}
 $raw=& gcloud run services describe $Service --project $Project --region $Region --format=json 2>$null
 if($LASTEXITCODE -ne 0){throw 'Cloud Run service metadata query failed.'}
 $serviceObject=($raw -join "`n")|ConvertFrom-Json
 $iamRaw=& gcloud run services get-iam-policy $Service --project $Project --region $Region --format=json 2>$null
 if($LASTEXITCODE -ne 0){throw 'Cloud Run IAM metadata query failed.'}
 $iamObject=($iamRaw -join "`n")|ConvertFrom-Json
 $secretResults=@()
 foreach($secretName in $RequiredSecrets){
  $version=& gcloud secrets versions list $secretName --project $Project --filter='state=ENABLED' --limit=1 --format='value(name)' 2>$null
  $binding=@($serviceObject.spec.template.spec.containers[0].env|Where-Object{$_.valueFrom.secretKeyRef.name -eq $secretName})
  $secretResults+=,[pscustomobject]@{name=$secretName;enabledVersionPresent=[bool](($version -join '').Trim());serviceBindingPresent=($binding.Count -gt 0)}
 }
 $data=[pscustomobject]@{activeProject=$activeProject;activeAccount=$activeAccount;service=$serviceObject;iam=$iamObject;requiredSecrets=$secretResults}
}
$s=$data.service
if($null -eq $s -or $null -eq $data.iam -or $null -eq $s.spec.template.spec.containers -or $null -eq $s.status){throw 'Service or IAM metadata has unexpected shape.'}
$members=@($data.iam.bindings|ForEach-Object{$_.members}|ForEach-Object{$_})
$public=$members|Where-Object{$_ -in @('allUsers','allAuthenticatedUsers')}
$image=[string]$s.spec.template.spec.containers[0].image
$digest=[regex]::Match($image,'@sha256:[a-f0-9]{64}$').Value
$secrets=@($data.requiredSecrets|ForEach-Object{[pscustomobject]@{name=$_.name;enabledVersionPresent=[bool]$_.enabledVersionPresent;serviceBindingPresent=[bool]$_.serviceBindingPresent}})
$failedSecrets=@($secrets|Where-Object{$_.enabledVersionPresent -ne $true -or $_.serviceBindingPresent -ne $true})
$checks=@(
 [pscustomobject]@{id='project';pass=([string]::IsNullOrWhiteSpace([string]$data.activeProject) -or [string]$data.activeProject -eq '(unset)' -or $data.activeProject -eq $Project)}
 [pscustomobject]@{id='no-public-invoker-binding';pass=(@($public).Count -eq 0)}
 [pscustomobject]@{id='digest-pinned-image';pass=[bool]$digest}
 [pscustomobject]@{id='runtime-service-account';pass=![string]::IsNullOrWhiteSpace([string]$s.spec.template.spec.serviceAccountName)}
 [pscustomobject]@{id='required-secret-bindings';pass=($failedSecrets.Count -eq 0)}
)
$result=[ordered]@{schemaVersion=1;checkedAt=[DateTimeOffset]::Now.ToString('o');project=$Project;region=$Region;service=$Service;activeProjectMatches=([string]::IsNullOrWhiteSpace([string]$data.activeProject) -or [string]$data.activeProject -eq '(unset)' -or $data.activeProject -eq $Project);activeAccountPresent=![string]::IsNullOrWhiteSpace([string]$data.activeAccount);ingress=[string]$s.metadata.annotations.'run.googleapis.com/ingress';publicInvokerBindingPresent=(@($public).Count -gt 0);runtimeServiceAccount=[string]$s.spec.template.spec.serviceAccountName;imageDigest=if($digest){$digest.Substring(1)}else{$null};imageIsDigestPinned=[bool]$digest;activeTraffic=@($s.status.traffic|Where-Object{$_.percent -gt 0}|ForEach-Object{[pscustomobject]@{revision=[string]$_.revisionName;percent=[int]$_.percent}});requiredSecrets=$secrets;checks=$checks;checksPassed=(@($checks|Where-Object{$_.pass -ne $true}).Count -eq 0)}
$result|ConvertTo-Json -Depth 8
if(!$result.checksPassed){exit 2}
