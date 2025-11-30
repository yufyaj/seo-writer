# Artifact Registry リポジトリ
resource "google_artifact_registry_repository" "main" {
  location      = var.region
  repository_id = var.artifact_registry_repository
  format        = "DOCKER"
  description   = "SEO Writer Docker images"

  depends_on = [google_project_service.services]
}

# Cloud Run サービス (v2)
resource "google_cloud_run_v2_service" "main" {
  provider = google-beta

  name     = local.service_name
  location = var.region

  # 認証をバイパスして公開アクセスを許可（組織ポリシーを回避）
  invoker_iam_disabled = true

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    timeout = "${var.cloud_run_timeout}s"

    containers {
      # 初回は手動でイメージをプッシュする必要があります
      # 例: ${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/web:latest
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/web:latest"

      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
        cpu_idle = true
      }

      # 環境変数（Secret Manager から取得）
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.encryption_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "CRON_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cron_secret.secret_id
            version = "latest"
          }
        }
      }

      # 通常の環境変数
      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }

      env {
        name  = "AUTH_URL"
        value = "https://${local.service_name}-${random_id.suffix.hex}.${var.region}.run.app"
      }

      # ヘルスチェック
      startup_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }
        period_seconds = 30
      }

      ports {
        container_port = 3000
      }
    }

    # Cloud SQL への接続
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.services,
    google_artifact_registry_repository.main,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.auth_secret,
    google_secret_manager_secret_version.encryption_key,
    google_secret_manager_secret_version.cron_secret,
  ]
}

# 公開アクセスを許可（組織ポリシーで制限されている場合はGCPコンソールから設定）
# resource "google_cloud_run_v2_service_iam_member" "public" {
#   location = var.region
#   name     = google_cloud_run_v2_service.main.name
#   role     = "roles/run.invoker"
#   member   = "allUsers"
# }

# 出力
output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.main.uri
}

output "artifact_registry_url" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}"
}
