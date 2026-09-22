import { z } from 'zod'

const artistContract = z.object({ id: z.string().min(1), name: z.string().min(1), avatar: z.string() })
const albumContract = z.object({ id: z.string().min(1), title: z.string().min(1), coverImage: z.string(), artistId: z.string().min(1) })
const genreContract = z.object({ id: z.string().min(1), name: z.string().min(1), image: z.string(), color: z.string().nullable() })
const moodContract = z.object({ id: z.string().min(1), title: z.string().min(1), color: z.string(), icon: z.string() })

const songContract = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  audioUrl: z.string().url(),
  image: z.string(),
  duration: z.union([z.number(), z.string(), z.null()]).optional(),
  hlsUrl: z.union([z.string(), z.null()]).optional(),
  lyrics: z.union([z.string(), z.array(z.object({ time: z.number(), text: z.string() })), z.null()]).optional(),
  playCount: z.number().optional(),
  artist: z.union([artistContract, z.string()]),
  genre: z.union([genreContract, z.string(), z.null()]).optional(),
  genres: z.array(z.string()).optional(),
  album: z.union([albumContract, z.null()]).optional(),
  mood: z.union([moodContract, z.null()]).optional(),
  source: z.string().optional(),
  licenseUrl: z.string().url().optional(),
})

export const searchResponseContract = z.object({
  songs: z.array(songContract),
  artists: z.array(artistContract),
  albums: z.array(albumContract),
  pagination: z.object({ nextCursor: z.string().min(1).nullable() }),
})
