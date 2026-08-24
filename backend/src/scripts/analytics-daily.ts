import { prisma } from '../lib/prisma'
import { summarizeAnalyticsEvents } from '../services/analytics.service'

const requestedDays = Number(process.argv[2] || 1)
const days = Number.isInteger(requestedDays) && requestedDays > 0 && requestedDays <= 90 ? requestedDays : 1

const run = async () => {
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - (days - 1))

  const events = await prisma.analyticsEvent.findMany({
    where: { occurredAt: { gte: since } },
    orderBy: { occurredAt: 'asc' },
    select: { userId: true, eventType: true, trackId: true, title: true, source: true, position: true, duration: true, occurredAt: true },
  })

  process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), summary: summarizeAnalyticsEvents(events, days) }, null, 2)}\n`)
}

run()
  .catch((error) => {
    console.error('Analytics batch failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
