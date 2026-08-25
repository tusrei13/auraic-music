variable "environment" { type = string }
variable "app_name" { type = string }

# Media Bucket (Audio Assets & Artworks)
resource "aws_s3_bucket" "media" {
  bucket = "${var.app_name}-${var.environment}-media"
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "Content-Length", "Accept-Ranges"]
    max_age_seconds = 86400
  }
}

# Automated Database Backup Snapshots Bucket
resource "aws_s3_bucket" "backups" {
  bucket = "${var.app_name}-${var.environment}-db-backups"
}

resource "aws_s3_bucket_lifecycle_configuration" "backups_retention" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    expiration {
      days = 30 # 30 days retention policy for disaster recovery
    }
  }
}

output "media_bucket_name" {
  value = aws_s3_bucket.media.id
}

output "backup_bucket_name" {
  value = aws_s3_bucket.backups.id
}
