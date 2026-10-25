# Existing-service discovery before Terraform adoption

This is a read-only Terraform root. Run `terraform init` and `terraform plan` with your local Google credentials. It reads the existing IAM-private Cloud Run service; it creates no infrastructure. Do not commit state, `.terraform/`, plan files or credentials. State can include sensitive configuration.

The current deployment remains the existing Cloud Run release process. Managing that same service from Terraform requires a separate import, captured existing configuration, an explicit reviewed plan showing no unintentional changes, and a single writer. This root deliberately does not claim that adoption has happened.

Google-managed Vertex inference houses Gemini and optional embedding inference; Groq/OpenRouter/AIML remain external HTTPS providers, called only by the server with consent and configured credentials. Firebase handles accounts, Firestore owns private records, Storage owns private uploads, and Cloud Tasks retries bounded imports. No new GKE cluster or GPU VM is needed for the pilot. A future independently hosted pretrained model needs its own licence, GPU/CPU memory benchmark, region, idle-cost cap and evaluation before deployment. Synthetic CPU ML evaluation is separate from inference serving; no trained learner model is promoted by this change.

Kubernetes becomes justified only when measured requirements demand custom GPU serving, scheduling or workload isolation beyond the existing managed services. Terraform is provisioning; it is not lesson/agent orchestration. The application's typed gateway and import state machine currently orchestrate work. LangGraph remains a candidate for durable multi-step jobs, not an installed dependency or claimed deployed agent.

References: [Cloud Run Terraform resource and import](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service), [GKE machine learning overview](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/machine-learning), [Vertex embeddings](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings).
