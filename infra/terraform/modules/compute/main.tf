variable "environment" { type = string }
variable "app_name" { type = string }
variable "database_url" { type = string; sensitive = true }
variable "storage_bucket" { type = string }
variable "backend_image" { type = string }
variable "frontend_image" { type = string }

# Compute outputs for container endpoints
output "backend_endpoint" {
  value = "${var.app_name}-${var.environment}-backend.internal"
}

output "frontend_endpoint" {
  value = "${var.app_name}-${var.environment}-frontend.internal"
}
