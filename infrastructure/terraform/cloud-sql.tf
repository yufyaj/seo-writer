# Cloud SQL インスタンス（PostgreSQL）
resource "google_sql_database_instance" "main" {
  name             = local.db_instance
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = var.environment == "prod"
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.environment == "prod"
      backup_retention_settings {
        retained_backups = var.environment == "prod" ? 7 : 1
      }
    }

    ip_configuration {
      ipv4_enabled = true
      # Cloud Runからの接続はCloud SQL Auth Proxyを使用
      # 必要に応じてauthorized_networksを設定
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    maintenance_window {
      day  = 7 # 日曜日
      hour = 3 # 3:00 UTC
    }
  }

  deletion_protection = var.environment == "prod"

  depends_on = [google_project_service.services]
}

# データベース
resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

# データベースユーザーのパスワード
resource "random_password" "db_password" {
  length  = 32
  special = false
}

# データベースユーザー
resource "google_sql_user" "main" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

# 出力
output "db_instance_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "db_instance_ip" {
  description = "Cloud SQL instance IP address"
  value       = google_sql_database_instance.main.public_ip_address
}
