import { describe, expect, it } from 'vitest'
import { buildSearchResult } from './search.controller'

describe('buildSearchResult', () => {
  it('deduplicates artists and albums while preserving tracks', () => {
    const songs = [
      {
        id: 'jamendo:1', title: 'First', audioUrl: 'https://example.com/1.mp3', image: 'cover-1', duration: 100,
        artist: { id: 'jamendo:7', name: 'Artist', avatar: 'artist-1' },
        album: { id: 'jamendo:9', title: 'Album', coverImage: 'album-1', artistId: 'jamendo:7' },
        source: 'jamendo' as const, genres: [],
      },
      {
        id: 'jamendo:2', title: 'Second', audioUrl: 'https://example.com/2.mp3', image: 'cover-2', duration: 120,
        artist: { id: 'jamendo:7', name: 'Artist', avatar: 'artist-1' },
        album: { id: 'jamendo:9', title: 'Album', coverImage: 'album-1', artistId: 'jamendo:7' },
        source: 'jamendo' as const, genres: [],
      },
    ]

    expect(buildSearchResult(songs, [{ id: 'jamendo:7', name: 'Artist', avatar: 'artist-1' }])).toEqual({
      songs,
      artists: [songs[0].artist],
      albums: [songs[0].album],
    })
  })

  it('does not infer unrelated artists from track results', () => {
    const songs = [{
      id: 'jamendo:1', title: 'No Limits', audioUrl: 'https://example.com/1.mp3', image: 'cover-1', duration: 100,
      artist: { id: 'jamendo:7', name: 'Cosmic Fruits', avatar: 'artist-1' }, album: null,
      source: 'jamendo' as const, genres: [],
    }]

    expect(buildSearchResult(songs, [])).toMatchObject({ songs, artists: [], albums: [] })
  })
})