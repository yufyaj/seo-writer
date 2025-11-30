# Cloud SQL 自動起動・停止スケジューラ

# プロジェクト番号を取得
data "google_project" "current" {
  project_id = var.project_id
}

# Cloud Functions サービスエージェントに Artifact Registry 読み取り権限を付与
resource "google_project_iam_member" "functions_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:service-${data.google_project.current.number}@gcf-admin-robot.iam.gserviceaccount.com"

  depends_on = [google_project_service.services]
}

# Cloud Build サービスアカウントに必要な権限を付与
resource "google_project_iam_member" "cloudbuild_logs" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${data.google_project.current.number}@cloudbuild.gserviceaccount.com"

  depends_on = [google_project_service.services]
}

# Cloud Build サービスアカウントにストレージ読み取り権限を付与
resource "google_project_iam_member" "cloudbuild_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_project.current.number}@cloudbuild.gserviceaccount.com"

  depends_on = [google_project_service.services]
}

# Cloud Functions 用のサービスアカウント
resource "google_service_account" "sql_scheduler" {
  account_id   = "sql-scheduler-${var.environment}"
  display_name = "SQL Scheduler Service Account (${var.environment})"
}

# Cloud SQL Admin 権限を付与
resource "google_project_iam_member" "sql_scheduler_admin" {
  project = var.project_id
  role    = "roles/cloudsql.admin"
  member  = "serviceAccount:${google_service_account.sql_scheduler.email}"
}

# Cloud Functions 用のストレージバケット
resource "google_storage_bucket" "functions" {
  name                        = "${var.project_id}-functions-${var.environment}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}

# Cloud Functions のソースコード
resource "google_storage_bucket_object" "sql_scheduler_source" {
  name   = "sql-scheduler-${filemd5("${path.module}/functions/sql-scheduler.zip")}.zip"
  bucket = google_storage_bucket.functions.name
  source = "${path.module}/functions/sql-scheduler.zip"
}

# Cloud SQL 起動用 Function
resource "google_cloudfunctions2_function" "start_sql" {
  name     = "start-sql-${var.environment}"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "startSql"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.sql_scheduler_source.name
      }
    }
  }

  service_config {
    min_instance_count    = 0
    max_instance_count    = 1
    available_memory      = "128Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.sql_scheduler.email
    environment_variables = {
      PROJECT_ID    = var.project_id
      INSTANCE_NAME = google_sql_database_instance.main.name
    }
  }

  depends_on = [
    google_project_service.services,
    google_project_iam_member.functions_artifact_registry,
    google_project_iam_member.cloudbuild_logs,
    google_project_iam_member.cloudbuild_storage,
  ]
}

# Cloud SQL 停止用 Function
resource "google_cloudfunctions2_function" "stop_sql" {
  name     = "stop-sql-${var.environment}"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "stopSql"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.sql_scheduler_source.name
      }
    }
  }

  service_config {
    min_instance_count    = 0
    max_instance_count    = 1
    available_memory      = "128Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.sql_scheduler.email
    environment_variables = {
      PROJECT_ID    = var.project_id
      INSTANCE_NAME = google_sql_database_instance.main.name
    }
  }

  depends_on = [
    google_project_service.services,
    google_project_iam_member.functions_artifact_registry,
    google_project_iam_member.cloudbuild_logs,
    google_project_iam_member.cloudbuild_storage,
  ]
}

# Cloud Functions の呼び出し権限
resource "google_cloud_run_service_iam_member" "start_sql_invoker" {
  location = var.region
  service  = google_cloudfunctions2_function.start_sql.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_cloud_run_service_iam_member" "stop_sql_invoker" {
  location = var.region
  service  = google_cloudfunctions2_function.stop_sql.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

# 10:00 JST に起動するスケジューラ
resource "google_cloud_scheduler_job" "start_sql" {
  name        = "start-sql-${var.environment}"
  description = "Start Cloud SQL instance at 10:00 JST"
  schedule    = "0 10 * * *"
  time_zone   = "Asia/Tokyo"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.start_sql.service_config[0].uri

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloudfunctions2_function.start_sql.service_config[0].uri
    }
  }

  depends_on = [google_project_service.services]
}

# 22:00 JST に停止するスケジューラ
resource "google_cloud_scheduler_job" "stop_sql" {
  name        = "stop-sql-${var.environment}"
  description = "Stop Cloud SQL instance at 22:00 JST"
  schedule    = "0 22 * * *"
  time_zone   = "Asia/Tokyo"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.stop_sql.service_config[0].uri

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloudfunctions2_function.stop_sql.service_config[0].uri
    }
  }

  depends_on = [google_project_service.services]
}
