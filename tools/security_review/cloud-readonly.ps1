$ErrorActionPreference='Stop'
$targetProject='kairo-access-20261021'
$runtimeIdentity='kairo-app-runtime@kairo-access-20261021.iam.gserviceaccount.com'
$service=(& gcloud.cmd run services describe kairo-app --project=$targetProject --region=africa-south1 --format=json | ConvertFrom-Json)
if($LASTEXITCODE){throw 'Cloud Run metadata read failed'}
$iam=(& gcloud.cmd run services get-iam-policy kairo-app --project=$targetProject --region=africa-south1 --format=json | ConvertFrom-Json)
if($LASTEXITCODE){throw 'Cloud Run IAM read failed'}
$bucket=(& gcloud.cmd storage buckets describe gs://kairo-access-20261021-materials --format=json | ConvertFrom-Json)
if($LASTEXITCODE){throw 'Bucket policy read failed'}
$projectPolicy=(& gcloud.cmd projects get-iam-policy $targetProject --format=json | ConvertFrom-Json)
if($LASTEXITCODE){throw 'Project policy read failed'}
$keys=(& gcloud.cmd iam service-accounts keys list --iam-account=$runtimeIdentity --project=$targetProject --format=json | ConvertFrom-Json)
if($LASTEXITCODE){throw 'Service account key metadata read failed'}
# Export selected configuration only. Never serialize full service env or personal IAM identities.
$container=$service.spec.template.spec.containers[0]
@{
 checkedAt=(Get-Date).ToUniversalTime().ToString('o');readOnly=$true;browserObserved=$false
 revision=$service.status.latestReadyRevisionName
 allUsersInvoker=[bool]@($iam.bindings | Where-Object {$_.role -eq 'roles/run.invoker' -and $_.members -contains 'allUsers'}).Count
 allAuthenticatedUsersInvoker=[bool]@($iam.bindings | Where-Object {$_.role -eq 'roles/run.invoker' -and $_.members -contains 'allAuthenticatedUsers'}).Count
 runtimeIsExpected=($service.spec.template.spec.serviceAccountName -eq $runtimeIdentity)
 runtimeProjectRoles=@($projectPolicy.bindings | Where-Object {$_.members -contains ('serviceAccount:'+$runtimeIdentity)} | ForEach-Object {$_.role})
 userManagedRuntimeKeyCount=@($keys | Where-Object {$_.keyType -eq 'USER_MANAGED'}).Count
 maxInstances=$service.spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
 resources=$container.resources.limits
 bucketLocation=$bucket.location;bucketUniformAccess=$bucket.uniform_bucket_level_access;bucketPublicAccessPrevention=$bucket.public_access_prevention;bucketSoftDelete=$bucket.soft_delete_policy
 envValuesExported=$false;privateObjectsRead=$false
} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath docs/security-submission-20261024/cloud-config.json
