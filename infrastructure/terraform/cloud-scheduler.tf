# Cloud Scheduler ジョブ（毎時実行）
resource "google_cloud_scheduler_job" "hourly_scheduler" {
  name             = "hourly-scheduler-${var.environment}"
  description      = "Triggers the scheduler API every hour to run scheduled article generation"
  schedule         = "0 * * * *" # 毎時0分に実行
  time_zone        = "Asia/Tokyo"
  attempt_deadline = "320s" # Cloud Run のタイムアウト + バッファ

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "60s"
    max_doublings        = 2
  }

  http_target {
    http_method = "GET"
    uri         = "${google_cloud_run_v2_service.main.uri}/api/cron/scheduler"

    headers = {
      "Authorization" = "Bearer ${random_password.cron_secret.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.main.uri
    }
  }

  depends_on = [
    google_project_service.services,
    google_cloud_run_v2_service.main,
  ]
}

# 出力
output "scheduler_job_name" {
  description = "Cloud Scheduler job name"
  value       = google_cloud_scheduler_job.hourly_scheduler.name
}
