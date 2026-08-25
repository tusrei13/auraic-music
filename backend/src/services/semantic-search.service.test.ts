import { describe, it, expect, vi } from 'vitest'
import { performSemanticSearch } from './semantic-search.service'
import * as jamendoService from './jamendo.service'

describe('Semantic Search with Embeddings & Graceful Fallback', () => {
  it('CASE 1: Matches semantic intent and computes similarity scores', async () => {
    const mockTracks = [
      {
        id: 'jamendo:1',
        title: 'Rainy Night In Tokyo',
        audioUrl: 'http://test.audio/rain.mp3',
        image: 'http://test.img/rain.jpg',
        duration: 200,
        artist: { id: 'jamendo:a1', name: 'Lofi Maker', avatar: '' },
        album: null,
        source: 'jamendo' as const,
        genres: ['lofi', 'sad', 'ambient']
      },
      {
        id: 'jamendo:2',
        title: 'Sad Piano Melancholy',
        audioUrl: 'http://test.audio/piano.mp3',
        image: '',
        duration: 180,
        artist: { id: 'jamendo:a2', name: 'Piano Man', avatar: '' },
        album: null,
        source: 'jamendo' as const,
        genres: ['piano', 'sad']
      },
      {
        id: 'jamendo:3',
        title: 'Calm Rainfall',
        audioUrl: 'http://test.audio/rain2.mp3',
        image: '',
        duration: 220,
        artist: { id: 'jamendo:a3', name: 'Nature', avatar: '' },
        album: null,
        source: 'jamendo' as const,
        genres: ['ambient', 'rain']
      },
      {
        id: 'jamendo:4',
        title: 'Quiet Tears',
        audioUrl: 'http://test.audio/tears.mp3',
        image: '',
        duration: 210,
        artist: { id: 'jamendo:a4', name: 'Acoustic Soul', avatar: '' },
        album: null,
        source: 'jamendo' as const,
        genres: ['acoustic', 'sad']
      },
      {
        id: 'jamendo:5',
        title: 'Late Night Raindrop',
        audioUrl: 'http://test.audio/drop.mp3',
        image: '',
        duration: 195,
        artist: { id: 'jamendo:a5', name: 'Chill Hub', avatar: '' },
        album: null,
        source: 'jamendo' as const,
        genres: ['chillout', 'lofi']
      }
    ]

    vi.spyOn(jamendoService, 'getJamendoTracks').mockResolvedValue(mockTracks)

    const result = await performSemanticSearch('nhạc buồn nghe dưới trời mưa', { limit: 5 })

    expect(result.intentTags).toContain('sad')
    expect(result.intentTags).toContain('rain')
    expect(result.isFallback).toBe(false)
    expect(result.results.length).toBe(5)
    expect(result.results[0].semanticScore).toBeGreaterThan(0.2)
    expect(result.results[0].matchedReason).toBeDefined()
  })

  it('CASE 2: Gracefully falls back to standard search on upstream error', async () => {
    // First call throws error, fallback call returns direct keyword results
    vi.spyOn(jamendoService, 'getJamendoTracks')
      .mockRejectedValueOnce(new Error('Jamendo Tag Service Unavailable'))
      .mockResolvedValueOnce([
        {
          id: 'jamendo:10',
          title: 'Direct Keyword Fallback Track',
          audioUrl: 'http://test.audio/direct.mp3',
          image: '',
          duration: 180,
          artist: { id: 'jamendo:a10', name: 'Artist Ten', avatar: '' },
          album: null,
          source: 'jamendo' as const,
          genres: ['pop']
        }
      ])

    const result = await performSemanticSearch('nhạc buồn', { limit: 10 })

    expect(result.isFallback).toBe(true)
    expect(result.results.length).toBe(1)
    expect(result.results[0].matchedReason).toBe('Kết quả tìm kiếm trực tiếp')
  })
})
