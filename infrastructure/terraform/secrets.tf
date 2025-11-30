# Secret Manager - データベース接続URL
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${var.db_user}:${random_password.db_password.result}@localhost/${var.db_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
}

# Secret Manager - Auth Secret
resource "random_password" "auth_secret" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "auth-secret-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "auth_secret" {
  secret      = google_secret_manager_secret.auth_secret.id
  secret_data = random_password.auth_secret.result
}

# Secret Manager - Gemini API Key
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}

# Secret Manager - Encryption Key
resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret" "encryption_key" {
  secret_id = "encryption-key-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "encryption_key" {
  secret      = google_secret_manager_secret.encryption_key.id
  secret_data = base64encode(random_password.encryption_key.result)
}

# Secret Manager - Cron Secret
resource "random_password" "cron_secret" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret" "cron_secret" {
  secret_id = "cron-secret-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "cron_secret" {
  secret      = google_secret_manager_secret.cron_secret.id
  secret_data = random_password.cron_secret.result
}
