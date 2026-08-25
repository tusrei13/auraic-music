import { Request, Response } from 'express'
import { sendError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'
import { catalogResponseContract } from '../contracts/catalog.contract'

export const decodeCatalogCursor = (value: unknown) => {
  if (typeof value !== 'string' || !value) return 0
  try {
    const offset = Number(Buffer.from(value, 'base64url').toString('utf8'))
    return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0
  } catch { return 0 }
}

export const encodeCatalogCursor = (offset: number) => Buffer.from(String(offset)).toString('base64url')

export const getJamendoCatalog = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 48, 1), 100)
    const offset = req.query.cursor ? decodeCatalogCursor(req.query.cursor) : Math.max(Number(req.query.offset) || 0, 0)
    const options = {
      limit,
      offset,
      tags: typeof req.query.tags === 'string' ? req.query.tags : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      artistId: typeof req.query.artistId === 'string' ? req.query.artistId : undefined,
      artistName: typeof req.query.artistName === 'string' ? req.query.artistName : undefined,
      albumId: typeof req.query.albumId === 'string' ? req.query.albumId : undefined,
      order: typeof req.query.order === 'string' ? req.query.order : undefined,
    }
    let rawTracks
    try {
      rawTracks = await getJamendoTracks(options)
    } catch (error) {
      if (!options.tags) throw error
      rawTracks = await getJamendoTracks({ ...options, tags: undefined, search: options.tags })
    }
    const tracks = catalogResponseContract.parse(rawTracks)
    if (tracks.length === limit) res.setHeader('x-next-cursor', encodeCatalogCursor(offset + limit))
    res.setHeader('x-page-limit', String(limit))
    res.json(tracks)
  } catch (error) {
    console.error(JSON.stringify({
      event: 'jamendo_catalog_error',
      requestId: res.getHeader('x-request-id'),
      reason: error instanceof Error ? error.message : 'unknown_error',
    }))
    const message = error instanceof Error && error.message === 'Jamendo is not configured'
      ? 'Jamendo chưa được cấu hình'
      : 'Không thể tải catalog Jamendo'
    sendError(res, 503, 'JAMENDO_CATALOG_ERROR', message)
  }
}
