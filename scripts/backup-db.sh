#!/usr/bin/env bash
set -euo pipefail

# Auraic Database Backup Automation Script
echo "========================================="
echo "   Auraic Automated Database Backup      "
echo "========================================="

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/auraic_db_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "📦 Dumping and compressing database to ${BACKUP_FILE}..."
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"

echo "🔒 Generating SHA-256 Checksum..."
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

echo "✅ Backup successfully created:"
ls -lh "${BACKUP_FILE}" "${CHECKSUM_FILE}"

# Optional: Upload to S3/R2 if AWS/Cloudflare CLI is configured
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo "☁️ Uploading backup to S3/R2 bucket: ${BACKUP_S3_BUCKET}..."
  aws s3 cp "${BACKUP_FILE}" "s3://${BACKUP_S3_BUCKET}/db-backups/"
  aws s3 cp "${CHECKSUM_FILE}" "s3://${BACKUP_S3_BUCKET}/db-backups/"
  echo "✅ Cloud upload complete."
fi

# Retention cleanup (keep last 30 days)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
echo "🧹 Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "auraic_db_*.sql.gz*" -mtime "+${RETENTION_DAYS}" -delete
echo "✨ Backup job finished successfully."
