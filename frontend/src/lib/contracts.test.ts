import { describe, expect, it } from 'vitest'
import { catalogResponseContract, searchResponseContract } from './contracts'

const track = { id: 'jamendo:42', title: 'Moonlit Drive', audioUrl: 'https://cdn.example.com/track.mp3', image: 'https://cdn.example.com/track.jpg', duration: 120, artist: { id: 'artist:1', name: 'Aura', avatar: 'https://cdn.example.com/artist.jpg' }, album: null, source: 'jamendo' as const, genres: [] }

describe('frontend API contracts', () => {
  it('validates catalog responses', () => expect(catalogResponseContract.parse([track])).toEqual([track]))
  it('validates search pagination', () => expect(searchResponseContract.parse({ songs: [track], artists: [track.artist], albums: [], pagination: { nextCursor: null } }).pagination.nextCursor).toBeNull())
})
