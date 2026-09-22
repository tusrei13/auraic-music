import { Request, Response } from 'express'
import { sendInternalError } from '../lib/api-error'
import { prisma } from '../lib/prisma'

export interface SearchSong {
  id: string
  title: string
  audioUrl: string
  image: string
  duration: number
  artist: { id: string; name: string; avatar: string }
  album: { id: string; title: string; coverImage: string; artistId: string } | null
  source: string
  genres: string[]
}

export interface SearchArtist {
  id: string
  name: string
  avatar: string
}

export interface SearchAlbum {
  id: string
  title: string
  coverImage: string
  artistId: string
}

export interface SearchResult {
  songs: SearchSong[]
  artists: SearchArtist[]
  albums: SearchAlbum[]
  pagination: { nextCursor: string | null }
}

export const buildSearchResult = (songs: SearchSong[], matchedArtists: SearchArtist[] = []): Omit<SearchResult, 'pagination'> => {
  const artists = [...new Map(matchedArtists.map((artist) => [artist.id, artist])).values()]
  const albums = [...new Map(
    songs
      .filter((song) => song.album !== null)
      .map((song) => [song.album!.id, song.album!]),
  ).values()]

  return { songs, artists, albums }
}

export const searchAll = async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!query) {
      res.json({ ...buildSearchResult([]), pagination: { nextCursor: null } })
      return
    }

    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { name: { contains: query, mode: 'insensitive' } } },
          { album: { title: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { artist: true, album: true, genre: true },
      orderBy: { playCount: 'desc' },
      take: 24,
    })

    const matchedArtists = await prisma.artist.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { id: true, name: true, avatar: true },
      take: 8,
    })

    const resultSongs: SearchSong[] = songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      audioUrl: song.audioUrl,
      image: song.image,
      duration: song.duration ?? 0,
      artist: { id: song.artist.id, name: song.artist.name, avatar: song.artist.avatar },
      album: song.album
        ? { id: song.album.id, title: song.album.title, coverImage: song.album.coverImage, artistId: song.album.artistId }
        : null,
      source: 'catalog',
      genres: song.genre ? [song.genre.name] : [],
    }))

    res.json({ ...buildSearchResult(resultSongs, matchedArtists), pagination: { nextCursor: null } })
  } catch (error) {
    sendInternalError(res, 'SEARCH_ERROR', 'Lỗi khi tìm kiếm')
  }
}
