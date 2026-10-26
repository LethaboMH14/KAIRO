[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='High')]
param([Parameter(Mandatory)][string]$ReceiptPath,[Parameter(Mandatory)][string]$PriorRevision,[Parameter(Mandatory)][string]$Project,[Parameter(Mandatory)][string]$Region,[Parameter(Mandatory)][string]$Service)
$ErrorActionPreference='Stop'
$receipt=Get-Content -Raw -LiteralPath $ReceiptPath | ConvertFrom-Json
foreach($field in @('project','region','service','image','commit')) { if(!$receipt.$field) { throw "Receipt missing $field." } }
if($receipt.project -ne $Project -or $receipt.region -ne $Region -or $receipt.service -ne $Service) { throw 'Receipt target does not match requested rollback target.' }
if($PriorRevision -notmatch ('^'+[regex]::Escape($Service)+'-[a-z0-9-]+$')) { throw 'Prior revision name must match this service.' }
$gcloud=Get-Command gcloud -ErrorAction Stop
$existing=& $gcloud.Source run revisions describe $PriorRevision --project $Project --region $Region --format='value(metadata.name)' 2>$null
if($LASTEXITCODE -ne 0 -or ($existing -join '').Trim() -ne $PriorRevision) { throw 'Prior revision could not be verified in the requested project and region.' }
$message="Set $Service traffic to prior revision $PriorRevision in $Project/$Region"
if($PSCmdlet.ShouldProcess($message,'Change Cloud Run traffic')) {
  & $gcloud.Source run services update-traffic $Service --project $Project --region $Region --to-revisions "$PriorRevision=100" --quiet
  if($LASTEXITCODE -ne 0) { throw 'Cloud Run rollback command failed.' }
}
