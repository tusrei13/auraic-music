import { describe, it, expect, beforeEach } from 'vitest'
import { cacheGet, cacheSet, cacheDel, cacheFlush, getCacheStatus } from './redis'

describe('Redis & In-Memory Cache Adapter', () => {
  beforeEach(async () => {
    await cacheFlush()
  })

  it('stores and retrieves cached items accurately', async () => {
    const payload = { id: 'track-1', title: 'Auraic Melody', duration: 240 }
    await cacheSet('test:track:1', payload, 60)

    const retrieved = await cacheGet<{ id: string; title: string; duration: number }>('test:track:1')
    expect(retrieved).toEqual(payload)
  })

  it('returns null on cache miss', async () => {
    const result = await cacheGet('test:nonexistent:key')
    expect(result).toBeNull()
  })

  it('deletes cached keys correctly', async () => {
    await cacheSet('test:key:to:delete', 'some-value', 60)
    expect(await cacheGet('test:key:to:delete')).toBe('some-value')

    await cacheDel('test:key:to:delete')
    expect(await cacheGet('test:key:to:delete')).toBeNull()
  })

  it('reports cache mode and memory count', () => {
    const status = getCacheStatus()
    expect(status.mode).toBeDefined()
    expect(typeof status.inMemoryKeyCount).toBe('number')
  })
})
