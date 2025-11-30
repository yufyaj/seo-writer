variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "asia-northeast1-a"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Cloud Run
variable "cloud_run_service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "seo-writer-web"
}

variable "cloud_run_cpu" {
  description = "Cloud Run CPU allocation"
  type        = string
  default     = "1"
}

variable "cloud_run_memory" {
  description = "Cloud Run memory allocation"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "cloud_run_timeout" {
  description = "Cloud Run request timeout (seconds)"
  type        = number
  default     = 300
}

# Cloud SQL
variable "db_instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "seo-writer-db"
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "seo_writer"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "seo_writer_user"
}

# Artifact Registry
variable "artifact_registry_repository" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "seo-writer"
}

# Scheduler
variable "scheduler_timezone" {
  description = "Cloud Scheduler timezone"
  type        = string
  default     = "Asia/Tokyo"
}

# API Keys
variable "gemini_api_key" {
  description = "Gemini API Key"
  type        = string
  sensitive   = true
}
