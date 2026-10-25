# Read the existing service first. No new paid service, public IAM, or cluster.
terraform {
  required_version = ">= 1.6"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 7.0" }
  }
}
provider "google" {
  project = var.project_id
  region  = var.region
}
variable "project_id" {
  type    = string
  default = "kairo-access-20261021"
}
variable "region" {
  type    = string
  default = "africa-south1"
}
data "google_cloud_run_v2_service" "kairo" {
  name     = "kairo-app"
  location = var.region
}
output "service_uri" {
  value = data.google_cloud_run_v2_service.kairo.uri
}
