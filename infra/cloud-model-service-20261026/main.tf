terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type        = string
  description = "Existing project. No APIs, billing, IAM roles, buckets, databases or clusters are created by this module."
}

variable "region" {
  type        = string
  description = "Existing Cloud Run region, subject to quota and model runtime acceptance."
}

variable "service_name" {
  type        = string
  description = "Distinct private model endpoint; must not be the existing learner API service."
  default     = "kairo-model-host"

  validation {
    condition     = startswith(var.service_name, "kairo-model-")
    error_message = "The model service must use a distinct kairo-model-* name."
  }
}

variable "image" {
  type        = string
  description = "Reviewed Artifact Registry image pinned by sha256 digest."

  validation {
    condition     = can(regex("@sha256:[0-9a-f]{64}$", var.image))
    error_message = "Set image to a full sha256-pinned container reference."
  }
}

variable "runtime_service_account" {
  type        = string
  description = "Dedicated least-privilege runtime account for the model service."
}

variable "app_invoker_service_account" {
  type        = string
  description = "Existing learner API runtime account allowed to invoke this service."
}

variable "container_port" {
  type        = number
  default     = 8080
  description = "HTTP port exposed by the model adapter container."
}

variable "memory" {
  type        = string
  default     = "2Gi"
  description = "Small CPU model starting allocation; adjust only from measured peak RSS and regional quota."
}

variable "cpu" {
  type        = string
  default     = "2"
  description = "CPU allocated during request processing."
}

variable "request_timeout" {
  type        = string
  default     = "30s"
  description = "Bounded synchronous inference deadline."
}

resource "google_cloud_run_v2_service" "model" {
  name                = var.service_name
  location            = var.region
  # Cloud Run-to-Cloud Run requires VPC routing for INTERNAL ingress. No such
  # network is verified here, so keep the endpoint IAM-authenticated rather
  # than add a paid VPC connector or create an unreachable private service.
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = true

  template {
    service_account                  = var.runtime_service_account
    timeout                          = var.request_timeout
    max_instance_request_concurrency = 1
    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      image = var.image
      ports { container_port = var.container_port }
      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = true
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "app_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.model.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.app_invoker_service_account}"
}

output "service_name" { value = google_cloud_run_v2_service.model.name }
output "service_uri" { value = google_cloud_run_v2_service.model.uri }
output "image" { value = var.image }
