import { Request, Response } from 'express'
import { sendInternalError } from '../lib/api-error'
import { getJamendoArtists, getJamendoTracks, JamendoArtist, JamendoSong } from '../services/jamendo.service'

export const buildSearchResult = (songs: JamendoSong[], matchedArtists: JamendoArtist[] = []) => {
  const artists = [...new Map(matchedArtists.map((artist) => [artist.id, artist])).values()]
  const albums = [...new Map(
    songs
      .filter((song): song is JamendoSong & { album: NonNullable<JamendoSong['album']> } => song.album !== null)
      .map((song) => [song.album.id, song.album]),
  ).values()]

  return { songs, artists, albums }
}

export const searchAll = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || ''
    if (!q.trim()) {
      return res.json(buildSearchResult([]))
    }

    const [songs, artists] = await Promise.all([
      getJamendoTracks({ limit: 50, search: q }),
      getJamendoArtists(q),
    ])
    res.json(buildSearchResult(songs, artists))
  } catch (error) {
    sendInternalError(res, 'SEARCH_ERROR', 'Lỗi khi tìm kiếm')
  }
}