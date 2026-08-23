import { describe, expect, it } from 'vitest'
import { createPlaylistSchema, loginSchema, playlistSongParamsSchema, playlistSongSchema, songIdBodySchema } from './validate.middleware'

describe('API request schemas', () => {
  it('accepts valid login data and rejects malformed email', () => {
    expect(loginSchema.safeParse({ body: { email: 'user@example.com', password: 'secret123' } }).success).toBe(true)
    expect(loginSchema.safeParse({ body: { email: 'invalid', password: 'secret123' } }).success).toBe(false)
  })

  it('validates playlist and song payloads', () => {
    expect(createPlaylistSchema.safeParse({ body: { name: 'Favorites' } }).success).toBe(true)
    expect(createPlaylistSchema.safeParse({ body: { name: '   ' } }).success).toBe(false)
    expect(songIdBodySchema.safeParse({ body: { songId: 3 } }).success).toBe(true)
    expect(songIdBodySchema.safeParse({ body: { songId: 0 } }).success).toBe(false)
  })

  it('accepts Jamendo track IDs for playlist operations', () => {
    expect(playlistSongSchema.safeParse({
      body: { songId: 'jamendo:12345', trackId: 'jamendo:12345' },
      params: { id: '00000000-0000-0000-0000-000000000000' },
    }).success).toBe(true)
    expect(playlistSongParamsSchema.safeParse({
      params: { id: '00000000-0000-0000-0000-000000000000', songId: 'jamendo:12345' },
    }).success).toBe(true)
  })
})
