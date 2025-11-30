# 全体の出力をまとめたファイル
# 各リソースファイルにも個別の出力がありますが、
# このファイルでは重要な出力を一覧で確認できるようにしています

output "summary" {
  description = "Deployment summary"
  value = {
    cloud_run_url     = google_cloud_run_v2_service.main.uri
    db_connection     = google_sql_database_instance.main.connection_name
    artifact_registry = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}"
    scheduler_job     = google_cloud_scheduler_job.hourly_scheduler.name
  }
}
