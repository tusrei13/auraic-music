import { describe, it, expect } from 'vitest'
import { getAllMoods, MOOD_DEFINITIONS } from './mood-mix.service'

describe('Mood Mix Service', () => {
  it('returns all predefined mood taxonomy profiles', () => {
    const moods = getAllMoods()
    expect(moods.length).toBeGreaterThanOrEqual(5)
    expect(moods.some(m => m.id === 'chill')).toBe(true)
    expect(moods.some(m => m.id === 'focus')).toBe(true)
    expect(moods.some(m => m.id === 'energetic')).toBe(true)
  })

  it('contains valid tags and gradients for each mood', () => {
    for (const mood of Object.values(MOOD_DEFINITIONS)) {
      expect(mood.id).toBeDefined()
      expect(mood.title).toBeDefined()
      expect(mood.tags.length).toBeGreaterThan(0)
      expect(mood.gradient).toBeDefined()
    }
  })
})
