import { describe, it, expect } from 'vitest'
import { extractSemanticTags, computeCosineSimilarity } from './embeddings.service'

describe('Embeddings & Semantic Search Service', () => {
  it('extracts semantic tags and keywords from natural language query', () => {
    const { expandedTags, semanticKeywords } = extractSemanticTags('nhạc buồn nghe dưới trời mưa')
    expect(expandedTags).toContain('sad')
    expect(expandedTags).toContain('rain')
    expect(expandedTags).toContain('melancholic')
    expect(semanticKeywords).toContain('buon')
    expect(semanticKeywords).toContain('mua')
  })

  it('computes cosine similarity accurately between token arrays', () => {
    const queryTokens = ['sad', 'acoustic', 'guitar']
    const itemTokensA = ['sad', 'acoustic', 'piano', 'slow']
    const itemTokensB = ['electronic', 'dance', 'upbeat']

    const scoreA = computeCosineSimilarity(queryTokens, itemTokensA)
    const scoreB = computeCosineSimilarity(queryTokens, itemTokensB)

    expect(scoreA).toBeGreaterThan(0.5)
    expect(scoreB).toBe(0)
  })
})
