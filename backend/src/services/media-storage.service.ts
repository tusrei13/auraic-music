import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import path from 'node:path'

interface StorageConfig {
  client: S3Client
  bucket: string
  publicBaseUrl: string
}

const getStorageConfig = (): StorageConfig | null => {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) return null

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicBaseUrl,
  }
}

const contentTypeFor = (filePath: string) => {
  if (filePath.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
  if (filePath.endsWith('.ts')) return 'video/mp2t'
  return 'application/octet-stream'
}

const readFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await readFiles(entryPath))
    else files.push(entryPath)
  }
  return files
}

export const isR2Configured = () => getStorageConfig() !== null

export const publishMediaDirectory = async (
  mediaDirectory: string,
  mediaId: string,
): Promise<string | null> => {
  const config = getStorageConfig()
  if (!config) return null

  const files = await readFiles(mediaDirectory)
  await Promise.all(files.map(async (filePath) => {
    const relativePath = path.relative(mediaDirectory, filePath).replaceAll('\\', '/')
    await config.client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: `media/${mediaId}/${relativePath}`,
      Body: await fs.readFile(filePath),
      ContentType: contentTypeFor(filePath),
      CacheControl: filePath.endsWith('.m3u8') ? 'public, max-age=60' : 'public, max-age=31536000, immutable',
    }))
  }))

  return `${config.publicBaseUrl}/media/${mediaId}/master.m3u8`
}
