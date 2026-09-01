import { prisma } from '../lib/prisma'
import { getJamendoTracks, JamendoSong } from './jamendo.service'
import { logger } from '../lib/logger'
import { getTracer } from '../lib/tracing'

const tracer = getTracer('auraic-backend')

export interface RecommendationExplanation {
  reason: string
  confidence: number
  basis: 'likes' | 'history' | 'time_of_day' | 'trending' | 'genre_affinity'
}

export interface RecommendedTrackItem extends JamendoSong {
  explanation: RecommendationExplanation
  score: number
}

function getTimeOfDayContext(): { tag: string; label: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return { tag: 'acoustic+morning+pop', label: 'buổi sáng tràn đầy năng lượng' }
  } else if (hour >= 12 && hour < 18) {
    return { tag: 'focus+electronic+ambient', label: 'buổi chiều tập trung làm việc' }
  } else if (hour >= 18 && hour < 22) {
    return { tag: 'chillout+relax+lofi', label: 'buổi tối thư giãn' }
  } else {
    return { tag: 'ambient+night+synthwave', label: 'đêm muộn tĩnh lặng' }
  }
}

export async function getPersonalizedRecommendations(
  userId?: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  recommendations: RecommendedTrackItem[]
  context: string
  metrics: { diversityScore: number; count: number }
}> {
  const limit = options.limit || 20
  const timeContext = getTimeOfDayContext()

  return tracer.startActiveSpan('recommendation.get_personalized', async (span) => {
    try {
      // Case 1: Anonymous user / No user session -> Contextual Time-of-Day + Trending
      if (!userId) {
        span.setAttributes({ 'recommendation.user_id': userId || 'anonymous', 'recommendation.limit': limit })
        const tracks = await getJamendoTracks({
          tags: timeContext.tag,
          limit,
          order: 'popularity_week'
        })

        const recommendations: RecommendedTrackItem[] = tracks.map((track, idx) => ({
          ...track,
          score: Math.round((1 - idx * 0.03) * 100) / 100,
          explanation: {
            reason: `Gợi ý phù hợp cho ${timeContext.label}`,
            confidence: 0.85,
            basis: 'time_of_day' as const
          }
        }))

        span.setAttributes({ 'recommendation.count': recommendations.length, 'recommendation.basis': 'time_of_day' })
        return {
          recommendations,
          context: `Contextual recommendation based on ${timeContext.label}`,
          metrics: { diversityScore: 0.8, count: recommendations.length }
        }
      }

      // Case 2: Authenticated user -> Hybrid signals (Likes + Recent History + Time Context)
      span.setAttributes({ 'recommendation.user_id': userId, 'recommendation.limit': limit })
      const [userLikes, userHistories] = await Promise.all([
        prisma.jamendoLike.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.jamendoListening.findMany({
          where: { userId },
          orderBy: { listenedAt: 'desc' },
          take: 15
        })
      ])

      span.setAttributes({
        'recommendation.likes_count': userLikes.length,
        'recommendation.history_count': userHistories.length,
      })

      // Collect seed artists and genres from user activity
      const seedArtists = new Set<string>()
      userLikes.forEach(l => seedArtists.add(l.artistName))
      userHistories.forEach(h => seedArtists.add(h.artistName))

      const seedTrackTitles = userLikes.slice(0, 3).map(l => l.title)

      let candidateTracks: JamendoSong[] = []
      let primaryBasis: RecommendationExplanation['basis'] = 'time_of_day'
      let reasonTemplate = `Phù hợp cho ${timeContext.label}`

      if (seedArtists.size > 0) {
        primaryBasis = 'genre_affinity'
        const firstArtist = Array.from(seedArtists)[0]
        reasonTemplate = `Dựa trên sở thích của bạn với nghệ sĩ ${firstArtist}`

        candidateTracks = await getJamendoTracks({
          search: firstArtist,
          limit: Math.min(limit * 2, 40)
        })
      }

      span.setAttributes({ 'recommendation.candidate_count': candidateTracks.length, 'recommendation.basis': primaryBasis })

      // Merge with time-context tracks if candidate pool is small
      if (candidateTracks.length < limit) {
        const timeTracks = await getJamendoTracks({
          tags: timeContext.tag,
          limit,
          order: 'popularity_total'
        })
        const existingIds = new Set(candidateTracks.map(t => t.id))
        timeTracks.forEach(t => {
          if (!existingIds.has(t.id)) candidateTracks.push(t)
        })
      }

      // Filter out tracks user has already listened to recently if possible
      const listenedIds = new Set(userHistories.map(h => `jamendo:${h.trackId}`))

      const scoredTracks: RecommendedTrackItem[] = candidateTracks.map((track, idx) => {
        const alreadyHeard = listenedIds.has(track.id)
        const score = Math.max(0.2, (1 - idx * 0.025) * (alreadyHeard ? 0.7 : 1))

        let explanation: RecommendationExplanation
        if (seedTrackTitles.length > 0 && idx < 3) {
          explanation = {
            reason: `Vì bạn đã thích bài hát "${seedTrackTitles[idx % seedTrackTitles.length]}"`,
            confidence: 0.92,
            basis: 'likes' as const
          }
        } else if (primaryBasis === 'genre_affinity') {
          explanation = {
            reason: reasonTemplate,
            confidence: 0.88,
            basis: 'genre_affinity' as const
          }
        } else {
          explanation = {
            reason: `Gợi ý phù hợp cho ${timeContext.label}`,
            confidence: 0.80,
            basis: 'time_of_day' as const
          }
        }

        return {
          ...track,
          score: Math.round(score * 100) / 100,
          explanation
        }
      })

      scoredTracks.sort((a, b) => b.score - a.score)
      const finalRecs = scoredTracks.slice(0, limit)

      // Compute diversity metric (ratio of unique artists / total recommendations)
      const uniqueArtists = new Set(finalRecs.map(r => r.artist.id))
      const diversityScore = finalRecs.length > 0 ? uniqueArtists.size / finalRecs.length : 1

      span.setAttributes({
        'recommendation.count': finalRecs.length,
        'recommendation.diversity_score': diversityScore,
        'recommendation.basis': primaryBasis,
      })
      return {
        recommendations: finalRecs,
        context: 'Personalized Hybrid Content-Based & Context Recommendation',
        metrics: {
          diversityScore: Math.round(diversityScore * 100) / 100,
          count: finalRecs.length
        }
      }
    } catch (error) {
      logger.error('Failed to generate personalized recommendations', undefined, { error })
      const fallbackTracks = await getJamendoTracks({ limit, order: 'popularity_total' })
      span.setAttributes({ 'recommendation.fallback': true, 'recommendation.count': fallbackTracks.length })
      return {
        recommendations: fallbackTracks.map(t => ({
          ...t,
          score: 0.5,
          explanation: {
            reason: 'Bài hát thịnh hành được cộng đồng nghe nhiều nhất',
            confidence: 0.7,
            basis: 'trending' as const
          }
        })),
        context: 'Trending Fallback',
        metrics: { diversityScore: 0.9, count: fallbackTracks.length }
      }
    } finally {
      span.end()
    }
  })
}
