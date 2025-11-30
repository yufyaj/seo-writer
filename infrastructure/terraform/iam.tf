# Cloud Run サービスアカウント
resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-${var.environment}"
  display_name = "Cloud Run Service Account (${var.environment})"
}

# Cloud SQL クライアント権限
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Secret Manager アクセス権限
resource "google_secret_manager_secret_iam_member" "database_url" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "auth_secret" {
  secret_id = google_secret_manager_secret.auth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "gemini_api_key" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "encryption_key" {
  secret_id = google_secret_manager_secret.encryption_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cron_secret" {
  secret_id = google_secret_manager_secret.cron_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Scheduler サービスアカウント
resource "google_service_account" "scheduler" {
  account_id   = "scheduler-${var.environment}"
  display_name = "Cloud Scheduler Service Account (${var.environment})"
}

# Cloud Scheduler が Cloud Run を呼び出す権限
resource "google_cloud_run_service_iam_member" "scheduler_invoker" {
  location = var.region
  service  = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

# 出力
output "cloud_run_service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}

output "scheduler_service_account_email" {
  description = "Cloud Scheduler service account email"
  value       = google_service_account.scheduler.email
}
