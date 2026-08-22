import Typesense, { Client } from 'typesense'
import type { FieldType } from 'typesense/lib/Typesense/Collection'
import { prisma } from '../lib/prisma'

const getClient = () => {
  const host = process.env.TYPESENSE_HOST
  const apiKey = process.env.TYPESENSE_API_KEY
  if (!host || !apiKey) return null

  return new Typesense.Client({
    nodes: [{
      host,
      port: Number(process.env.TYPESENSE_PORT || 443),
      protocol: process.env.TYPESENSE_PROTOCOL || 'https',
    }],
    apiKey,
    connectionTimeoutSeconds: 3,
  })
}

const schemas: Record<string, { name: string; fields: Array<{ name: string; type: FieldType; optional?: boolean }> }> = {
  songs: {
    name: 'songs',
    fields: [
      { name: 'title', type: 'string' },
      { name: 'artistName', type: 'string' },
      { name: 'genreName', type: 'string', optional: true },
    ],
  },
  artists: {
    name: 'artists',
    fields: [{ name: 'name', type: 'string' }],
  },
  playlists: {
    name: 'playlists',
    fields: [{ name: 'name', type: 'string' }],
  },
}

const ensureCollection = async (client: Client, schema: (typeof schemas)[string]) => {
  try {
    await client.collections(schema.name).retrieve()
  } catch {
    await client.collections().create(schema)
  }
}

export const isSearchIndexConfigured = () => getClient() !== null

export const syncSearchIndex = async () => {
  const client = getClient()
  if (!client) throw new Error('Typesense is not configured')

  await Promise.all(Object.values(schemas).map((schema) => ensureCollection(client, schema)))
  const [songs, artists, playlists] = await Promise.all([
    prisma.song.findMany({ include: { artist: true, genre: true } }),
    prisma.artist.findMany(),
    prisma.playlist.findMany(),
  ])

  await Promise.all([
    client.collections('songs').documents().import(songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      artistName: song.artist.name,
      genreName: song.genre?.name || '',
    })), { action: 'upsert' }),
    client.collections('artists').documents().import(artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
    })), { action: 'upsert' }),
    client.collections('playlists').documents().import(playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
    })), { action: 'upsert' }),
  ])
}

export const searchIndex = async (query: string) => {
  const client = getClient()
  if (!client) return null

  const [songs, artists, playlists] = await Promise.all([
    client.collections('songs').documents().search({
      q: query,
      query_by: 'title,artistName,genreName',
      typo_tokens_threshold: 1,
      per_page: 50,
    }),
    client.collections('artists').documents().search({ q: query, query_by: 'name', per_page: 25 }),
    client.collections('playlists').documents().search({ q: query, query_by: 'name', per_page: 25 }),
  ])

  const getDocumentIds = (result: { hits?: Array<{ document: object }> }) =>
    result.hits?.map((hit) => String((hit.document as { id: string }).id)) || []

  const songIds = getDocumentIds(songs).map(Number)
  const artistIds = getDocumentIds(artists)
  const playlistIds = getDocumentIds(playlists)
  const [songRecords, artistRecords, playlistRecords] = await Promise.all([
    prisma.song.findMany({ where: { id: { in: songIds } }, include: { artist: true, genre: true, album: true, mood: true } }),
    prisma.artist.findMany({ where: { id: { in: artistIds } } }),
    prisma.playlist.findMany({ where: { id: { in: playlistIds } } }),
  ])
  const byId = <T extends { id: number | string }>(records: T[]) => new Map(records.map((record) => [String(record.id), record]))
  const songsById = byId(songRecords)
  const artistsById = byId(artistRecords)
  const playlistsById = byId(playlistRecords)

  return {
    songs: songIds.map((id) => songsById.get(String(id))).filter(Boolean),
    artists: artistIds.map((id) => artistsById.get(id)).filter(Boolean),
    playlists: playlistIds.map((id) => playlistsById.get(id)).filter(Boolean),
  }
}
