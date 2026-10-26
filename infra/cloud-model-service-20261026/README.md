# Private CPU Cloud Run model service (proposal)

This is a separate, explicitly gated service template for the small model being acquired by the model-readiness workstream. It cannot target `kairo-app`: validation requires a service name beginning `kairo-model-`. It creates only one Cloud Run service and one invoker IAM member; it does not create a service account, registry, database, bucket, secret, VPC, GPU or cluster.

## Adapter contract

The container must expose `POST /embed` (model owner to confirm exact request/response schema), `GET /health` (status only) and accept `PORT`. It must not log inputs or persist learner text. It needs no secret by default. The current proposal uses Cloud Run ingress `all` plus required IAM authentication, with only `kairo-app-runtime` granted `roles/run.invoker` and no `allUsers` binding. Cloud Run-to-Cloud Run internal ingress requires VPC routing, which has not been observed; this template avoids creating a paid VPC connector or making an internal-only service the app cannot reach. Confirm this network exposure tradeoff during review. Exact HTTP paths, payloads, model license and source revision remain pending the model owner’s signed-off handoff.

## Cost and privacy defaults

Region must be explicitly set after current regional quota/availability checks. Min instances 0, max 1, concurrency 1, request-only CPU, 2 CPU / 2 GiB starting envelope, and a 30 second request timeout bound concurrency and memory. Cold starts can be slow; benchmark load and query latency before use. No local model weights or source text are stored in the container filesystem. A model cache may only contain licensed immutable weights and must be included in image size and cold-start measurement.

These values are conservative starting caps, not verified fit or a cost quote. Get the actual container image size, weight size, peak RSS, startup time, per-request latency, provider-free credits, regional CPU/memory quota and gross post-credit Cloud Run estimate before plan/apply. Alerting is not a hard spend cap. Root reviews any plan and owns deployment/traffic.

## Safe review sequence

1. Fill `terraform.tfvars` from a reviewed model-owner handoff: project, region, image digest, dedicated service account, current app runtime account.
2. `terraform fmt -check`, `terraform init`, `terraform validate`.
3. Generate a saved plan and inspect every create/update/destroy. Expected shape is one new distinct model service plus one IAM member, with zero changes to `kairo-app`, `kairo-core`, existing IAM, storage or database.
4. Never apply from this package until root confirms exact image, quota, cost ceiling, privacy, adapter, tests, and no-traffic staging procedure. The current service is independently managed; do not import it or replace its Terraform owner.

The template uses the Cloud Run v2 service resource and request-based CPU allocation. Cloud Run documents request-based billing as the default for sporadic traffic; probes require instance-based billing, so this initial service does not configure a Cloud Run health probe. The container's `/health` response is reserved for an operator smoke after a revision is deployed. Cloud Run calls to an internal-ingress service need VPC routing, so this proposal uses authenticated IAM ingress without adding a VPC. See [Cloud Run billing settings](https://docs.cloud.google.com/run/docs/configuring/billing-settings), [Cloud Run ingress restrictions](https://docs.cloud.google.com/run/docs/securing/ingress), and the [Terraform Cloud Run v2 resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service).

No Terraform init/plan/apply or cloud resource creation has been run by this package.
