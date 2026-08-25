import { describe, it, expect, vi } from 'vitest'
import { getPersonalizedRecommendations } from './recommendation.service'

vi.mock('../lib/prisma', () => ({
  prisma: {
    jamendoLike: { findMany: vi.fn().mockResolvedValue([]) },
    jamendoListening: { findMany: vi.fn().mockResolvedValue([]) }
  }
}))

vi.mock('./jamendo.service', () => ({
  getJamendoTracks: vi.fn().mockResolvedValue([
    {
      id: 'jamendo:101',
      title: 'Midnight Jazz',
      audioUrl: 'http://test.audio/1.mp3',
      image: 'http://test.img/1.jpg',
      duration: 180,
      artist: { id: 'jamendo:1', name: 'Jazz Master', avatar: '' },
      album: null,
      source: 'jamendo',
      genres: ['jazz', 'chill']
    }
  ])
}))

describe('Personalized Recommendation Service', () => {
  it('generates recommendations with explainable reasons', async () => {
    const result = await getPersonalizedRecommendations(undefined, { limit: 5 })

    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations[0].explanation).toBeDefined()
    expect(result.recommendations[0].explanation.reason.length).toBeGreaterThan(0)
    expect(result.recommendations[0].explanation.confidence).toBeGreaterThan(0)
    expect(result.metrics.diversityScore).toBeGreaterThan(0)
  })
})
