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

export async function runDatabaseBackup(): Promise<{ backupFile: string; checksum: string; sizeBytes: number }> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing!')
  }

  const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'))
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFileName = `auraic-backup-${timestamp}.sql.gz`
  const backupFilePath = path.join(backupDir, backupFileName)
  const checksumFilePath = `${backupFilePath}.sha256`

  console.log(`[BACKUP] Starting automated database backup to ${backupFilePath}...`)

  try {
    // Determine command based on platform
    // Use pg_dump with compression
    const isWindows = process.platform === 'win32'
    if (isWindows) {
      // In Windows powershell/cmd: pg_dump --dbname="..." -F c -f "..."
      execSync(`pg_dump --dbname="${dbUrl}" -F c -f "${backupFilePath}"`, { stdio: 'inherit' })
    } else {
      execSync(`pg_dump "${dbUrl}" | gzip > "${backupFilePath}"`, { stdio: 'inherit', shell: '/bin/bash' })
    }

    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file was not created at ${backupFilePath}`)
    }

    const stats = fs.statSync(backupFilePath)
    const checksum = computeFileSha256(backupFilePath)

    fs.writeFileSync(checksumFilePath, `${checksum}  ${backupFileName}\n`, 'utf8')

    console.log(`✅ [BACKUP SUCCESS] Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`🔒 [CHECKSUM SHA256] ${checksum}`)

    // Clean up local backups older than RETENTION_DAYS (default 30)
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)
    const now = Date.now()
    const files = fs.readdirSync(backupDir)

    for (const file of files) {
      if (file.startsWith('auraic-backup-') && file.endsWith('.sql.gz')) {
        const filePath = path.join(backupDir, file)
        const fileStat = fs.statSync(filePath)
        const ageInDays = (now - fileStat.mtimeMs) / (1000 * 60 * 60 * 24)
        if (ageInDays > retentionDays) {
          console.log(`[CLEANUP] Removing expired backup: ${file} (${ageInDays.toFixed(1)} days old)`)
          fs.unlinkSync(filePath)
          const shaFile = `${filePath}.sha256`
          if (fs.existsSync(shaFile)) fs.unlinkSync(shaFile)
        }
      }
    }

    return { backupFile: backupFilePath, checksum, sizeBytes: stats.size }
  } catch (error) {
    console.error('❌ [BACKUP FAILED]', error)
    throw error
  }
}

if (process.argv[1]?.includes('backup-database.ts')) {
  runDatabaseBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
