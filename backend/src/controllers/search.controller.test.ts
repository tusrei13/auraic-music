import { describe, expect, it } from 'vitest'
import { buildSearchResult } from './search.controller'

describe('buildSearchResult', () => {
  it('deduplicates artists and albums while preserving tracks', () => {
    const songs = [
      {
        id: 'engine:1', title: 'First', audioUrl: 'https://example.com/1.mp3', image: 'cover-1', duration: 100,
        artist: { id: 'engine:7', name: 'Artist', avatar: 'artist-1' },
        album: { id: 'engine:9', title: 'Album', coverImage: 'album-1', artistId: 'engine:7' },
        source: 'engine' as const, genres: [],
      },
      {
        id: 'engine:2', title: 'Second', audioUrl: 'https://example.com/2.mp3', image: 'cover-2', duration: 120,
        artist: { id: 'engine:7', name: 'Artist', avatar: 'artist-1' },
        album: { id: 'engine:9', title: 'Album', coverImage: 'album-1', artistId: 'engine:7' },
        source: 'engine' as const, genres: [],
      },
    ]

    expect(buildSearchResult(songs, [{ id: 'engine:7', name: 'Artist', avatar: 'artist-1' }])).toEqual({
      songs,
      artists: [songs[0].artist],
      albums: [songs[0].album],
    })
  })

  it('does not infer unrelated artists from track results', () => {
    const songs = [{
      id: 'engine:1', title: 'No Limits', audioUrl: 'https://example.com/1.mp3', image: 'cover-1', duration: 100,
      artist: { id: 'engine:7', name: 'Cosmic Fruits', avatar: 'artist-1' }, album: null,
      source: 'engine' as const, genres: [],
    }]

    expect(buildSearchResult(songs, [])).toMatchObject({ songs, artists: [], albums: [] })
  })
})