import { afterEach, describe, expect, it, vi } from 'vitest'
import { getJamendoTracks } from './jamendo.service'

describe('getJamendoTracks', () => {
  afterEach(() => {
    delete process.env.JAMENDO_CLIENT_ID
    vi.unstubAllGlobals()
  })

  it('maps Jamendo tracks and reuses the short-lived cache', async () => {
    process.env.JAMENDO_CLIENT_ID = 'test-client'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        headers: { status: 'success' },
        results: [{
          id: 42,
          name: 'International Track',
          duration: 187,
          artist_name: 'International Artist',
          artist_id: 7,
          image: 'https://example.com/cover.jpg',
          audio: 'https://example.com/track.mp3',
        }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await getJamendoTracks({ limit: 1, tags: 'ambient' })
    const second = await getJamendoTracks({ limit: 1, tags: 'ambient' })

    expect(first[0]).toMatchObject({
      id: 'jamendo:42',
      title: 'International Track',
      duration: 187,
      source: 'jamendo',
      artist: { id: 'jamendo:7', name: 'International Artist' },
    })
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})