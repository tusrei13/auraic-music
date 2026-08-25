import { getJamendoTracks, JamendoSong } from './jamendo.service'
import { extractSemanticTags, computeCosineSimilarity } from './embeddings.service'
import { logger } from '../lib/logger'

export interface SemanticSearchResultItem extends JamendoSong {
  semanticScore: number
  matchedReason?: string
}

export async function performSemanticSearch(
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  query: string
  intentTags: string[]
  totalResults: number
  results: SemanticSearchResultItem[]
  isFallback: boolean
}> {
  const limit = options.limit || 24
  const offset = options.offset || 0

  if (!query || !query.trim()) {
    return { query, intentTags: [], totalResults: 0, results: [], isFallback: false }
  }

  const { expandedTags, semanticKeywords } = extractSemanticTags(query)
  logger.debug(`Semantic query '${query}' expanded to tags: ${expandedTags.join(', ')}`)

  try {
    let rawTracks: JamendoSong[] = []

    // 1. If semantic tags detected, search Jamendo by tags first
    if (expandedTags.length > 0) {
      const tagSearchString = expandedTags.slice(0, 3).join('+')
      rawTracks = await getJamendoTracks({
        tags: tagSearchString,
        limit: Math.min(limit * 2, 50),
        offset
      })
    }

    // 2. Fallback or merge with standard search if semantic tags yielded few results
    if (rawTracks.length < 5) {
      const standardTracks = await getJamendoTracks({
        search: query,
        limit,
        offset
      })

      // Merge and deduplicate by track ID
      const existingIds = new Set(rawTracks.map(t => t.id))
      for (const st of standardTracks) {
        if (!existingIds.has(st.id)) {
          rawTracks.push(st)
        }
      }
    }

    // 3. Score and Re-rank tracks using Cosine Similarity
    const scoredTracks: SemanticSearchResultItem[] = rawTracks.map(track => {
      const trackTokens = [
        ...track.title.toLowerCase().split(/\s+/),
        ...track.artist.name.toLowerCase().split(/\s+/),
        ...track.genres.map(g => g.toLowerCase())
      ]

      const similarity = computeCosineSimilarity(semanticKeywords, trackTokens)
      const hasDirectTagMatch = track.genres.some(g => expandedTags.includes(g.toLowerCase()))
      const semanticScore = Math.min(1, Math.round((similarity * 0.7 + (hasDirectTagMatch ? 0.3 : 0)) * 100) / 100)

      let matchedReason = 'Phù hợp với từ khóa tìm kiếm'
      if (hasDirectTagMatch) {
        matchedReason = `Phù hợp với chủ đề & thể loại: ${expandedTags.slice(0, 2).join(', ')}`
      } else if (similarity > 0.4) {
        matchedReason = 'Tương đồng ngữ nghĩa cao với mô tả'
      }

      return {
        ...track,
        semanticScore,
        matchedReason
      }
    })

    // Sort by semantic score descending
    scoredTracks.sort((a, b) => b.semanticScore - a.semanticScore)

    const paginated = scoredTracks.slice(0, limit)

    return {
      query,
      intentTags: expandedTags,
      totalResults: scoredTracks.length,
      results: paginated,
      isFallback: expandedTags.length === 0
    }
  } catch (error) {
    logger.warn('Semantic search failed, falling back to standard search', undefined, { error })
    // Safe Fallback
    const fallbackTracks = await getJamendoTracks({ search: query, limit, offset })
    return {
      query,
      intentTags: [],
      totalResults: fallbackTracks.length,
      results: fallbackTracks.map(t => ({ ...t, semanticScore: 0.5, matchedReason: 'Kết quả tìm kiếm trực tiếp' })),
      isFallback: true
    }
  }
}
