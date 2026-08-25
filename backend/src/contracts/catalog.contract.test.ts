import { describe, expect, it } from 'vitest'
import { catalogResponseContract, searchResponseContract } from './catalog.contract'

const track = {
  id: 'jamendo:42',
  title: 'Moonlit Drive',
  audioUrl: 'https://cdn.example.com/moonlit-drive.mp3',
  image: 'https://cdn.example.com/moonlit-drive.jpg',
  duration: 213,
  artist: { id: 'jamendo-artist:7', name: 'Aura Artist', avatar: 'https://cdn.example.com/artist.jpg' },
  album: { id: 'jamendo-album:9', title: 'Night Signals', coverImage: 'https://cdn.example.com/album.jpg', artistId: 'jamendo-artist:7' },
  source: 'jamendo' as const,
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  genres: ['ambient'],
}

describe('public API response contracts', () => {
  it('accepts the catalog payload consumed by the frontend', () => {
    expect(catalogResponseContract.parse([track])).toEqual([track])
  })

  it('accepts search entities and its opaque pagination cursor', () => {
    const response = { songs: [track], artists: [track.artist], albums: [track.album], pagination: { nextCursor: 'NDg' } }
    expect(searchResponseContract.parse(response)).toEqual(response)
  })

  it('rejects responses missing required license-source metadata', () => {
    expect(() => catalogResponseContract.parse([{ ...track, source: undefined }])).toThrow()
  })
})
