import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import dotenv from 'dotenv'

dotenv.config()

function computeFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

export async function runDatabaseRestore(backupFilePath?: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing!')
  }

  const targetFile = backupFilePath || process.argv[2]
  if (!targetFile || !fs.existsSync(targetFile)) {
    throw new Error(`Backup file not specified or not found: ${targetFile}`)
  }

  const checksumFilePath = `${targetFile}.sha256`
  if (fs.existsSync(checksumFilePath)) {
    const expectedChecksum = fs.readFileSync(checksumFilePath, 'utf8').trim().split(/\s+/)[0]
    const actualChecksum = computeFileSha256(targetFile)

    if (expectedChecksum !== actualChecksum) {
      throw new Error(`🚨 CHECKSUM MISMATCH! File may be corrupted or tampered with.\nExpected: ${expectedChecksum}\nActual:   ${actualChecksum}`)
    }
    console.log(`🔒 [CHECKSUM VERIFIED] ${actualChecksum}`)
  } else {
    console.warn(`⚠️ [WARNING] No .sha256 checksum file found for ${targetFile}. Proceeding with restore...`)
  }

  console.log(`[RESTORE] Restoring database from ${targetFile}...`)

  try {
    const isWindows = process.platform === 'win32'
    if (isWindows) {
      execSync(`pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${dbUrl}" "${targetFile}"`, { stdio: 'inherit' })
    } else {
      execSync(`gunzip -c "${targetFile}" | psql "${dbUrl}"`, { stdio: 'inherit', shell: '/bin/bash' })
    }

    console.log(`✅ [RESTORE SUCCESS] Database restored successfully from ${targetFile}`)
  } catch (error) {
    console.error('❌ [RESTORE FAILED]', error)
    throw error
  }
}

if (process.argv[1]?.includes('restore-database.ts')) {
  runDatabaseRestore()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
