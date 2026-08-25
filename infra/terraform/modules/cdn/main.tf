variable "environment" { type = string }
variable "domain_name" { type = string }
variable "backend_origin" { type = string }
variable "frontend_origin" { type = string }

# Local computed domain names
locals {
  app_hostname = var.environment == "production" ? var.domain_name : "${var.environment}.${var.domain_name}"
  api_hostname = var.environment == "production" ? "api.${var.domain_name}" : "api-${var.environment}.${var.domain_name}"
}

output "frontend_url" {
  value = "https://${locals.app_hostname}"
}

output "api_url" {
  value = "https://${locals.api_hostname}"
}
