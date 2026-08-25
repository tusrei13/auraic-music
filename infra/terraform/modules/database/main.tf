variable "environment" { type = string }
variable "app_name" { type = string }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_instance_class" { type = string }
variable "allocated_storage" { type = number }

resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.app_name}-${var.environment}-pg"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = var.db_instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  backup_retention_period   = var.environment == "production" ? 14 : 3
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  auto_minor_version_upgrade = true
  multi_az                  = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = "${var.app_name}-${var.environment}-pg-final-snapshot"

  deletion_protection = var.environment == "production"
}

output "endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "connection_url" {
  value     = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}?schema=public"
  sensitive = true
}
