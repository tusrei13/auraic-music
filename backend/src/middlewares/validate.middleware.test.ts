import { describe, expect, it } from 'vitest'
import { adminSettingsSchema, analyticsEventSchema, createPlaylistSchema, likeToggleSchema, loginSchema, playlistSongParamsSchema, playlistSongSchema, songIdBodySchema } from './validate.middleware'

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

  it('validates analytics playback events', () => {
    expect(analyticsEventSchema.safeParse({
      body: { eventType: 'TRACK_STARTED', trackId: 'jamendo:123', title: 'Track' },
    }).success).toBe(true)
    expect(analyticsEventSchema.safeParse({
      body: { eventType: 'TRACK_UNKNOWN', trackId: 'jamendo:123', title: 'Track' },
    }).success).toBe(false)
  })

  it('accepts complete Jamendo like metadata', () => {
    expect(likeToggleSchema.safeParse({ body: { songId: 'jamendo:123', title: 'Track', artistName: 'Artist', image: 'https://example.com/cover.jpg', audioUrl: 'https://example.com/audio.mp3' } }).success).toBe(true)
    expect(likeToggleSchema.safeParse({ body: { songId: 'invalid-source' } }).success).toBe(false)
  })

  it('restricts admin settings to known, bounded values', () => {
    expect(adminSettingsSchema.safeParse({ body: { siteName: 'Auraic', defaultLanguage: 'vi', maintenanceMode: 'off' } }).success).toBe(true)
    expect(adminSettingsSchema.safeParse({ body: { maintenanceMode: 'enabled' } }).success).toBe(false)
    expect(adminSettingsSchema.safeParse({ body: { secret: 'should-not-pass' } }).success).toBe(false)
  })
})
