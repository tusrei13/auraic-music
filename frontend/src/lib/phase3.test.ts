import { describe, it, expect, vi } from 'vitest'
import { getMoods, searchSemantic, getPersonalizedRecommendations } from './api'

global.fetch = vi.fn()

describe('Phase 3 Frontend API Client', () => {
  it('calls getMoods and returns mood mix items', async () => {
    const mockMoods = {
      data: [
        { id: 'chill', title: 'Chill & Relax', gradient: 'from-teal-500 to-emerald-700' }
      ]
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMoods
    })

    const res = await getMoods()
    expect(res.data[0].id).toBe('chill')
  })

  it('calls searchSemantic with natural query', async () => {
    const mockResult = {
      query: 'nhạc buồn',
      intentTags: ['sad', 'melancholic'],
      totalResults: 1,
      results: [],
      isFallback: false
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult
    })

    const res = await searchSemantic('nhạc buồn')
    expect(res.intentTags).toContain('sad')
    expect(res.isFallback).toBe(false)
  })

  it('calls getPersonalizedRecommendations and receives explainable reasons', async () => {
    const mockRecs = {
      recommendations: [
        {
          id: 'jamendo:1',
          title: 'Morning Acoustic',
          score: 0.95,
          explanation: {
            reason: 'Gợi ý phù hợp cho buổi sáng tràn đầy năng lượng',
            confidence: 0.85,
            basis: 'time_of_day'
          }
        }
      ],
      context: 'Contextual',
      metrics: { diversityScore: 0.8, count: 1 }
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecs
    })

    const res = await getPersonalizedRecommendations()
    expect(res.recommendations[0].explanation.reason).toContain('buổi sáng')
  })
})
