variable "environment" {
  type        = string
  description = "Deployment environment (staging, production)"
  default     = "staging"
}

variable "app_name" {
  type        = string
  description = "Application name prefix"
  default     = "auraic"
}

variable "aws_region" {
  type        = string
  description = "AWS region for resources"
  default     = "ap-southeast-1"
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token for DNS & CDN management"
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  type        = string
  description = "Custom domain name (e.g. auraic.app, staging.auraic.app)"
  default     = "auraic.app"
}

variable "db_name" {
  type        = string
  description = "PostgreSQL database name"
  default     = "auraic_production"
}

variable "db_username" {
  type        = string
  description = "PostgreSQL admin username"
  default     = "auraic_admin"
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class (e.g. db.t4g.micro, db.t4g.medium)"
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  type        = number
  description = "Allocated storage for PostgreSQL in GB"
  default     = 20
}

variable "backend_docker_image" {
  type        = string
  description = "Docker image URI for backend service"
  default     = "ghcr.io/auraic/backend:latest"
}

variable "frontend_docker_image" {
  type        = string
  description = "Docker image URI for frontend service"
  default     = "ghcr.io/auraic/frontend:latest"
}
