import { describe, expect, it } from 'vitest'
import { searchResponseContract } from './contracts'

const track = { id: 'track:1', title: 'Moonlit Drive', audioUrl: 'https://cdn.example.com/track.mp3', image: 'https://cdn.example.com/track.jpg', duration: 120, artist: { id: 'artist:1', name: 'Aura', avatar: 'https://cdn.example.com/artist.jpg' }, album: null, source: 'auraic', genres: [] }

describe('frontend API contracts', () => {
  it('validates search responses', () => expect(searchResponseContract.parse({ songs: [track], artists: [track.artist], albums: [], pagination: { nextCursor: null } }).songs[0].title).toBe('Moonlit Drive'))
  it('validates search pagination', () => expect(searchResponseContract.parse({ songs: [track], artists: [track.artist], albums: [], pagination: { nextCursor: null } }).pagination.nextCursor).toBeNull())
})
