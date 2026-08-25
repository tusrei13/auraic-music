import { z } from 'zod'

const artistContract = z.object({ id: z.string().min(1), name: z.string().min(1), avatar: z.string() })
const albumContract = z.object({ id: z.string().min(1), title: z.string().min(1), coverImage: z.string(), artistId: z.string().min(1) })

export const jamendoTrackContract = z.object({
  id: z.string().regex(/^jamendo:.+$/), title: z.string().min(1), audioUrl: z.string().url(), image: z.string(),
  duration: z.number().int().nonnegative(), artist: artistContract, album: albumContract.nullable(), source: z.literal('jamendo'),
  licenseUrl: z.string().url().optional(), genres: z.array(z.string()),
})

export const catalogResponseContract = z.array(jamendoTrackContract)
export const searchResponseContract = z.object({
  songs: catalogResponseContract,
  artists: z.array(artistContract),
  albums: z.array(albumContract),
  pagination: z.object({ nextCursor: z.string().min(1).nullable() }),
})
