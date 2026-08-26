import { describe, it, expect } from 'vitest'
import { transcodeAudioToHls, getFfmpegBinaryPath } from './transcoder.service'
import { globalJobQueue } from '../lib/queue'
import path from 'node:path'

describe('HLS Audio Transcoder Service', () => {
  it('returns configured FFmpeg binary path', () => {
    const binPath = getFfmpegBinaryPath()
    expect(binPath).toBeDefined()
    expect(typeof binPath).toBe('string')
  })

  it('gracefully rejects when input audio file does not exist', async () => {
    const fakePath = path.join(process.cwd(), 'media', 'nonexistent-audio-file.mp3')
    const result = await transcodeAudioToHls(fakePath, 'track-test-999')

    expect(result.success).toBe(false)
    expect(result.error).toContain('does not exist')
    expect(result.segmentCount).toBe(0)
  })

  it('triggers asynchronous transcoding through globalJobQueue without blocking', async () => {
    const jobId = await globalJobQueue.add('AUDIO_TRANSCODE_JOB', {
      inputFilePath: 'media/test.mp3',
      trackId: 'test-async-track',
      bitrate: '192k'
    })

    expect(jobId).toBeDefined()
    expect(jobId).toContain('auraic-jobs')
  })
})
