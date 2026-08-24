import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { sendError } from '../lib/api-error'

export const validate = (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query })
  if (!result.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ', result.error.flatten())
  }
  const parsed = result.data as { body?: Record<string, unknown> }
  if (parsed.body) req.body = parsed.body
  next()
}

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    name: z.string().trim().max(100).optional(),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const createPlaylistSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    coverImage: z.string().url().optional(),
    color: z.string().max(100).optional(),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const songIdBodySchema = z.object({
  body: z.object({ songId: z.coerce.number().int().positive() }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const playlistIdParamsSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const playlistSongSchema = z.object({
  body: z.object({
    songId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]),
  }),
  params: z.object({ id: z.string().uuid(), songId: z.string().trim().min(1).optional() }),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const playlistSongParamsSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.object({ id: z.string().uuid(), songId: z.string().trim().min(1) }),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const playlistReorderSchema = z.object({
  body: z.object({ trackIds: z.array(z.union([z.coerce.number().int().positive(), z.string().trim().min(1)])) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const songIdParamsSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const jamendoListeningSchema = z.object({
  body: z.object({
      trackId: z.string().trim().regex(/^jamendo:.+$/),
    title: z.string().trim().min(1).max(300),
    artistName: z.string().trim().min(1).max(200),
      image: z.string().trim().min(1).max(2000),
      audioUrl: z.string().trim().min(1).max(2000),
    duration: z.coerce.number().int().nonnegative().nullable().optional(),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const analyticsEventSchema = z.object({
  body: z.object({
    eventType: z.enum(['TRACK_STARTED', 'TRACK_COMPLETED', 'TRACK_SKIPPED']),
    trackId: z.string().trim().min(1).max(200),
    source: z.string().trim().min(1).max(50).optional(),
    title: z.string().trim().min(1).max(300),
    position: z.coerce.number().int().nonnegative().optional(),
    duration: z.coerce.number().int().nonnegative().optional(),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
})

export const adminUserRoleSchema = z.object({
  body: z.object({ role: z.enum(['USER', 'ADMIN']) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.record(z.string(), z.unknown()).optional(),
})
