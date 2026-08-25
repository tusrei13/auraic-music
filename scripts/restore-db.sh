#!/usr/bin/env bash
set -euo pipefail

# Auraic Database Restore Script
echo "========================================="
echo "   Auraic Database Restore Automation    "
echo "========================================="

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

if [ -f "${CHECKSUM_FILE}" ]; then
  echo "🔍 Verifying SHA-256 Checksum..."
  sha256sum -c "${CHECKSUM_FILE}"
  echo "✅ Checksum verified."
else
  echo "⚠️ Warning: No checksum file found at '${CHECKSUM_FILE}'. Proceed with caution."
fi

echo "🚨 CAUTION: This will overwrite data in the target database."
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore aborted by user."
  exit 0
fi

echo "🚀 Restoring database from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"

echo "✅ Database restored successfully."
