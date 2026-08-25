import Redis from 'ioredis'
import { logger } from './logger'
import { cacheHitsTotal, cacheMissesTotal, cacheOperationsTotal } from './metrics'

let redisClient: Redis | null = null
let isRedisAvailable = false

// In-Memory Fallback Storage
interface InMemoryCacheItem {
  value: string
  expiresAt: number
}
const inMemoryCache = new Map<string, InMemoryCacheItem>()
// In-Memory Sorted Sets map: key -> Map<member, score>
const inMemoryZSets = new Map<string, Map<string, number>>()

const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null)

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis reconnection attempts exceeded limit. Using In-Memory Cache.')
          return null
        }
        return Math.min(times * 200, 2000)
      }
    })

    redisClient.on('connect', () => {
      isRedisAvailable = true
      logger.info('Connected to Redis Cache server successfully')
    })

    redisClient.on('error', (err) => {
      isRedisAvailable = false
      logger.warn('Redis connection issue, falling back to In-Memory Cache', undefined, { error: err.message })
    })
  } catch (error) {
    logger.warn('Failed to initialize Redis client, falling back to In-Memory Cache', undefined, { error })
  }
} else {
  logger.debug('No REDIS_URL configured; running with High-Performance In-Memory Cache adapter')
}

// Clean up expired items from in-memory cache every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, item] of inMemoryCache.entries()) {
    if (now > item.expiresAt) {
      inMemoryCache.delete(key)
    }
  }
}, 60_000).unref()

// ==========================================
// Basic Key-Value Operations
// ==========================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  const store = isRedisAvailable && redisClient ? 'redis' : 'memory'
  cacheOperationsTotal.inc({ operation: 'get', store })

  try {
    if (isRedisAvailable && redisClient) {
      const data = await redisClient.get(key)
      if (data !== null) {
        cacheHitsTotal.inc({ store: 'redis' })
        return JSON.parse(data) as T
      }
      cacheMissesTotal.inc({ store: 'redis' })
      return null
    }
  } catch (err) {
    logger.warn(`Redis get failed for key '${key}', falling back to memory`, undefined, { error: err })
  }

  // In-Memory Fallback
  const cached = inMemoryCache.get(key)
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      cacheHitsTotal.inc({ store: 'memory' })
      try {
        return JSON.parse(cached.value) as T
      } catch {
        return cached.value as unknown as T
      }
    }
    inMemoryCache.delete(key)
  }

  cacheMissesTotal.inc({ store: 'memory' })
  return null
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  const store = isRedisAvailable && redisClient ? 'redis' : 'memory'
  cacheOperationsTotal.inc({ operation: 'set', store })
  const serialized = JSON.stringify(value)

  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.set(key, serialized, 'EX', ttlSeconds)
      return
    }
  } catch (err) {
    logger.warn(`Redis set failed for key '${key}', writing to memory`, undefined, { error: err })
  }

  // In-Memory Fallback
  inMemoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000
  })
}

export async function cacheDel(key: string): Promise<void> {
  const store = isRedisAvailable && redisClient ? 'redis' : 'memory'
  cacheOperationsTotal.inc({ operation: 'del', store })

  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key)
    }
  } catch (err) {
    logger.warn(`Redis del failed for key '${key}'`, undefined, { error: err })
  }
  inMemoryCache.delete(key)
  inMemoryZSets.delete(key)
}

export async function cacheFlush(): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.flushdb()
    } catch (err) {
      logger.warn('Redis flushdb failed', undefined, { error: err })
    }
  }
  inMemoryCache.clear()
  inMemoryZSets.clear()
}

// ==========================================
// Sorted Set (ZSET) Operations for Leaderboards / Real-time Charts
// ==========================================

export async function cacheZIncrBy(key: string, member: string, increment = 1): Promise<number> {
  const store = isRedisAvailable && redisClient ? 'redis' : 'memory'
  cacheOperationsTotal.inc({ operation: 'zincrby', store })

  try {
    if (isRedisAvailable && redisClient) {
      const newScore = await redisClient.zincrby(key, increment, member)
      return parseFloat(newScore)
    }
  } catch (err) {
    logger.warn(`Redis zincrby failed for key '${key}', falling back to memory`, undefined, { error: err })
  }

  // In-Memory Fallback
  let zset = inMemoryZSets.get(key)
  if (!zset) {
    zset = new Map<string, number>()
    inMemoryZSets.set(key, zset)
  }
  const currentScore = zset.get(member) || 0
  const updatedScore = currentScore + increment
  zset.set(member, updatedScore)
  return updatedScore
}

export async function cacheZRevRangeWithScores(
  key: string,
  start = 0,
  stop = 9
): Promise<Array<{ member: string; score: number }>> {
  const store = isRedisAvailable && redisClient ? 'redis' : 'memory'
  cacheOperationsTotal.inc({ operation: 'zrevrange', store })

  try {
    if (isRedisAvailable && redisClient) {
      // Returns [member1, score1, member2, score2, ...]
      const raw = await redisClient.zrevrange(key, start, stop, 'WITHSCORES')
      const result: Array<{ member: string; score: number }> = []
      for (let i = 0; i < raw.length; i += 2) {
        result.push({
          member: raw[i],
          score: parseFloat(raw[i + 1])
        })
      }
      return result
    }
  } catch (err) {
    logger.warn(`Redis zrevrange failed for key '${key}', falling back to memory`, undefined, { error: err })
  }

  // In-Memory Fallback
  const zset = inMemoryZSets.get(key)
  if (!zset) return []

  const sorted = Array.from(zset.entries())
    .sort((a, b) => b[1] - a[1]) // Descending
    .slice(start, stop + 1)
    .map(([member, score]) => ({ member, score }))

  return sorted
}

export function getCacheStatus(): { mode: 'redis' | 'memory'; inMemoryKeyCount: number } {
  return {
    mode: isRedisAvailable ? 'redis' : 'memory',
    inMemoryKeyCount: inMemoryCache.size + inMemoryZSets.size
  }
}
