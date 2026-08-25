import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  jamendoLike: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  like: { findMany: vi.fn() },
  song: { findUnique: vi.fn() },
}))

vi.mock('../lib/prisma', () => ({ prisma: prismaMock }))

import { getMyLikes, toggleLike } from './like.controller'

const response = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    getHeader: vi.fn().mockReturnValue(undefined),
  }
  return res
}

describe('Jamendo likes controller', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a Jamendo like with metadata', async () => {
    prismaMock.jamendoLike.findUnique.mockResolvedValue(null)
    prismaMock.jamendoLike.create.mockResolvedValue({})
    const res = response()

    await toggleLike({
      user: { id: 'user-1' },
      body: {
        songId: 'jamendo:42', title: 'Signal', artistName: 'Artist', image: 'cover', audioUrl: 'audio', duration: 180,
      },
    } as any, res)

    expect(prismaMock.jamendoLike.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', trackId: 'jamendo:42', title: 'Signal', artistName: 'Artist' }),
    })
    expect(res.json).toHaveBeenCalledWith({ liked: true, trackId: 'jamendo:42' })
  })

  it('removes an existing Jamendo like idempotently', async () => {
    prismaMock.jamendoLike.findUnique.mockResolvedValue({ userId: 'user-1', trackId: 'jamendo:42' })
    const res = response()

    await toggleLike({ user: { id: 'user-1' }, body: { songId: 'jamendo:42', title: 'Signal', artistName: 'Artist', image: 'cover', audioUrl: 'audio' } } as any, res)

    expect(prismaMock.jamendoLike.delete).toHaveBeenCalledWith({ where: { userId_trackId: { userId: 'user-1', trackId: 'jamendo:42' } } })
    expect(res.json).toHaveBeenCalledWith({ liked: false, trackId: 'jamendo:42' })
  })

  it('combines local and Jamendo likes in the existing response shape', async () => {
    prismaMock.like.findMany.mockResolvedValue([{ id: 1, song: { id: 1, title: 'Local' } }])
    prismaMock.jamendoLike.findMany.mockResolvedValue([{ userId: 'user-1', trackId: 'jamendo:42', title: 'Signal', artistName: 'Artist', image: 'cover', audioUrl: 'audio', duration: 180, licenseUrl: null, createdAt: new Date('2026-01-01') }])
    const res = response()

    await getMyLikes({ user: { id: 'user-1' } } as any, res)

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      { id: 1, song: { id: 1, title: 'Local' } },
      expect.objectContaining({ song: expect.objectContaining({ id: 'jamendo:42', source: 'jamendo' }) }),
    ]))
  })
})
