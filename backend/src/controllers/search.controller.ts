import { Request, Response } from 'express'
import { sendInternalError } from '../lib/api-error'
import { getJamendoArtists, getJamendoTracks, JamendoArtist, JamendoSong } from '../services/jamendo.service'
import { searchResponseContract } from '../contracts/catalog.contract'

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

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 50)
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const offset = cursor ? Number(Buffer.from(cursor, 'base64url').toString('utf8')) : 0
    const safeOffset = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0
    const [songs, artists] = await Promise.all([
      getJamendoTracks({ limit, offset: safeOffset, search: q }),
      getJamendoArtists(q),
    ])
    const payload = searchResponseContract.parse({ ...buildSearchResult(songs, artists), pagination: songs.length === limit ? { nextCursor: Buffer.from(String(safeOffset + limit)).toString('base64url') } : { nextCursor: null } })
    res.json(payload)
  } catch (error) {
    sendInternalError(res, 'SEARCH_ERROR', 'Lỗi khi tìm kiếm')
  }
}
