import { describe, expect, it } from 'vitest'
import { decodeCatalogCursor, encodeCatalogCursor } from './catalog.controller'

describe('catalog cursor', () => {
  it('round-trips an offset without exposing it in the API contract', () => {
    const cursor = encodeCatalogCursor(48)
    expect(cursor).not.toBe('48')
    expect(decodeCatalogCursor(cursor)).toBe(48)
  })

  it('falls back safely for malformed cursors', () => {
    expect(decodeCatalogCursor('not-a-valid-offset')).toBe(0)
    expect(decodeCatalogCursor(undefined)).toBe(0)
  })
})
