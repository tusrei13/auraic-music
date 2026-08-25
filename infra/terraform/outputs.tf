output "frontend_url" {
  value       = module.cdn.frontend_url
  description = "Public CDN URL for Auraic Web App"
}

output "api_endpoint" {
  value       = module.cdn.api_url
  description = "Public CDN API URL for Auraic Backend"
}

output "database_endpoint" {
  value       = module.database.endpoint
  description = "PostgreSQL cluster connection endpoint"
  sensitive   = true
}

output "media_bucket_name" {
  value       = module.storage.media_bucket_name
  description = "S3/R2 Bucket name for audio and artwork assets"
}

output "backup_bucket_name" {
  value       = module.storage.backup_bucket_name
  description = "S3/R2 Bucket name for database backups"
}
