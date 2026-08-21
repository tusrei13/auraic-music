import ffmpeg from 'fluent-ffmpeg'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const BITRATES = [128, 256, 320] as const
const mediaRoot = path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), 'media'))

if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)

const runFfmpeg = (inputPath: string, outputPath: string, bitrate: number) => new Promise<void>((resolve, reject) => {
  ffmpeg(inputPath)
    .audioCodec('aac')
    .audioBitrate(`${bitrate}k`)
    .format('hls')
    .outputOptions([
      '-hls_time 6',
      '-hls_playlist_type vod',
      '-hls_segment_filename',
      path.join(path.dirname(outputPath), `${bitrate}_%03d.ts`),
    ])
    .on('end', () => resolve())
    .on('error', reject)
    .save(outputPath)
})

export interface TranscodingResult {
  mediaId: string
  mediaDirectory: string
  masterPlaylist: string
  duration: number | null
}

export const transcodeToHls = async (inputPath: string): Promise<TranscodingResult> => {
  const mediaId = randomUUID()
  const outputDirectory = path.join(mediaRoot, mediaId)
  await fs.mkdir(outputDirectory, { recursive: true })

  try {
    await Promise.all(BITRATES.map((bitrate) =>
      runFfmpeg(inputPath, path.join(outputDirectory, `${bitrate}.m3u8`), bitrate)
    ))

    const masterPlaylist = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"',
      '128.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=256000,CODECS="mp4a.40.2"',
      '256.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=320000,CODECS="mp4a.40.2"',
      '320.m3u8',
      '',
    ].join('\n')
    const masterPath = path.join(outputDirectory, 'master.m3u8')
    await fs.writeFile(masterPath, masterPlaylist, 'utf8')

    const probe = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (error, data) => error ? reject(error) : resolve(data))
    })

    return {
      mediaId,
      mediaDirectory: outputDirectory,
      masterPlaylist: `/media/${mediaId}/master.m3u8`,
      duration: probe.format.duration ? Math.round(probe.format.duration) : null,
    }
  } catch (error) {
    await fs.rm(outputDirectory, { recursive: true, force: true })
    throw error
  } finally {
    await fs.rm(inputPath, { force: true })
  }
}
