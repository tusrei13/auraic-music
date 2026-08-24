export type AnalyticsEventForSummary = {
  userId?: string
  eventType: 'TRACK_STARTED' | 'TRACK_COMPLETED' | 'TRACK_SKIPPED'
  trackId: string
  title: string
  source?: string
  position?: number | null
  duration?: number | null
  occurredAt: Date
}

export const assessAnalyticsQuality = (events: AnalyticsEventForSummary[]) => {
  let invalidTitle = 0
  let invalidTiming = 0
  let unknownSource = 0
  let duplicateStarted = 0
  const recentStarts = new Map<string, number>()

  for (const event of events) {
    if (!event.title.trim()) invalidTitle += 1
    if ((event.position !== null && event.position !== undefined && event.position < 0) || (event.duration !== null && event.duration !== undefined && event.duration < 0) || (event.position !== null && event.position !== undefined && event.duration !== null && event.duration !== undefined && event.position > event.duration)) invalidTiming += 1
    if (event.source !== 'jamendo' && event.source !== 'local') unknownSource += 1
    if (event.eventType === 'TRACK_STARTED') {
      const key = `${event.userId || 'unknown'}:${event.trackId}`
      const previous = recentStarts.get(key)
      if (previous !== undefined && event.occurredAt.getTime() - previous <= 30_000) duplicateStarted += 1
      recentStarts.set(key, event.occurredAt.getTime())
    }
  }

  return { invalidTitle, invalidTiming, unknownSource, duplicateStarted, totalIssues: invalidTitle + invalidTiming + unknownSource + duplicateStarted }
}

export const summarizeAnalyticsEvents = (events: AnalyticsEventForSummary[], days = 7) => {
  const now = new Date()
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const daily = new Map<string, { date: string; started: number; completed: number; skipped: number }>()

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    daily.set(key, { date: key, started: 0, completed: 0, skipped: 0 })
  }

  const topTracks = new Map<string, { trackId: string; title: string; plays: number }>()
  let started = 0
  let completed = 0
  let skipped = 0

  for (const event of events) {
    const dateKey = event.occurredAt.toISOString().slice(0, 10)
    const bucket = daily.get(dateKey)
    if (bucket) bucket[event.eventType === 'TRACK_STARTED' ? 'started' : event.eventType === 'TRACK_COMPLETED' ? 'completed' : 'skipped'] += 1
    if (event.eventType === 'TRACK_STARTED') {
      started += 1
      const current = topTracks.get(event.trackId)
      if (current) current.plays += 1
      else topTracks.set(event.trackId, { trackId: event.trackId, title: event.title, plays: 1 })
    } else if (event.eventType === 'TRACK_COMPLETED') completed += 1
    else skipped += 1
  }

  return {
    periodDays: days,
    totals: { started, completed, skipped },
    daily: [...daily.values()],
    topTracks: [...topTracks.values()].sort((first, second) => second.plays - first.plays).slice(0, 10),
    quality: assessAnalyticsQuality(events),
  }
}
