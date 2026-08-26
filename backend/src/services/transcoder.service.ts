import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { logger } from '../lib/logger'
import { globalJobQueue } from '../lib/queue'

export interface TranscodeOptions {
  segmentDurationSeconds?: number
  audioBitrate?: string // e.g. '192k', '256k', '320k'
  targetOutputDir?: string
}

export interface TranscodeResult {
  success: boolean
  manifestPath: string
  hlsRelativeUrl: string
  segmentCount: number
  error?: string
}

export const getFfmpegBinaryPath = (): string => {
  return process.env.FFMPEG_PATH || 'ffmpeg'
}

/**
 * Transcodes a raw local audio asset (e.g. mp3/wav/flac) into an HLS stream (.m3u8 + .ts segments)
 * optimized for adaptive, low-latency audio streaming.
 */
export async function transcodeAudioToHls(
  inputFilePath: string,
  trackId: string,
  options: TranscodeOptions = {}
): Promise<TranscodeResult> {
  const segmentDuration = options.segmentDurationSeconds || 6
  const bitrate = options.audioBitrate || '192k'
  const mediaRoot = path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), 'media'))
  const outputDir = options.targetOutputDir || path.join(mediaRoot, 'hls', String(trackId))
  const manifestFileName = 'playlist.m3u8'
  const manifestFullPath = path.join(outputDir, manifestFileName)
  const segmentPattern = path.join(outputDir, 'segment_%03d.ts')
  const hlsRelativeUrl = `/media/hls/${trackId}/${manifestFileName}`

  // 1. Validate input file
  if (!existsSync(inputFilePath)) {
    const errorMsg = `Input audio file does not exist: ${inputFilePath}`
    logger.warn(errorMsg)
    return {
      success: false,
      manifestPath: '',
      hlsRelativeUrl: '',
      segmentCount: 0,
      error: errorMsg,
    }
  }

  // 2. Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  // 3. Construct FFmpeg command arguments
  const ffmpegArgs = [
    '-y', // Overwrite output files without asking
    '-i', inputFilePath,
    '-codec:a', 'aac',
    '-b:a', bitrate,
    '-hls_time', String(segmentDuration),
    '-hls_list_size', '0',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', segmentPattern,
    manifestFullPath,
  ]

  const ffmpegBin = getFfmpegBinaryPath()

  return new Promise((resolve) => {
    logger.info(`Starting HLS transcoding for track '${trackId}' with bitrate ${bitrate}`)
    const process = spawn(ffmpegBin, ffmpegArgs)

    let stderrOutput = ''

    process.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString()
    })

    process.on('error', (err) => {
      logger.warn(`FFmpeg process spawn failed for track '${trackId}'. (Is FFmpeg installed at '${ffmpegBin}'?)`, undefined, { error: err.message })
      resolve({
        success: false,
        manifestPath: '',
        hlsRelativeUrl: '',
        segmentCount: 0,
        error: `FFmpeg execution error: ${err.message}`,
      })
    })

    process.on('close', async (code) => {
      if (code === 0 && existsSync(manifestFullPath)) {
        try {
          const files = await fs.readdir(outputDir)
          const segments = files.filter((f) => f.endsWith('.ts'))
          logger.info(`HLS transcoding completed successfully for track '${trackId}' (${segments.length} segments generated)`)
          resolve({
            success: true,
            manifestPath: manifestFullPath,
            hlsRelativeUrl,
            segmentCount: segments.length,
          })
        } catch (readErr) {
          resolve({
            success: true,
            manifestPath: manifestFullPath,
            hlsRelativeUrl,
            segmentCount: 0,
          })
        }
      } else {
        const errorMsg = `FFmpeg exited with code ${code}. Stderr snippet: ${stderrOutput.slice(-300)}`
        logger.warn(`HLS transcoding failed for track '${trackId}'`, undefined, { error: errorMsg })
        resolve({
          success: false,
          manifestPath: '',
          hlsRelativeUrl: '',
          segmentCount: 0,
          error: errorMsg,
        })
      }
    })
  })
}

// Register background job handler for asynchronous audio transcoding
globalJobQueue.registerHandler('AUDIO_TRANSCODE_JOB', async (data: { inputFilePath: string; trackId: string; bitrate?: string }) => {
  return await transcodeAudioToHls(data.inputFilePath, data.trackId, { audioBitrate: data.bitrate })
})
