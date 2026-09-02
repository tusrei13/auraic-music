import { describe, expect, it, vi, beforeEach } from 'vitest'
import { exportUserData, deleteUserData } from './user-data.controller'
import { prisma } from '../lib/prisma'

describe('user-data.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports user data as JSON attachment', async () => {
    const req = {
      user: { id: 'user-1' },
    } as any
    const res = {
      setHeader: vi.fn(),
      json: vi.fn(),
    } as any

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user-1', email: 'u@test.com', name: 'U', avatar: null, createdAt: new Date(), updatedAt: new Date(), role: 'USER' } as any)
    vi.spyOn(prisma.like, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.jamendoLike, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.playlist, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.listeningHistory, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.jamendoListening, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.analyticsEvent, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.follow, 'findMany').mockResolvedValue([])

    await exportUserData(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="auraic-data-export-user-1.json"')
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        exportedAt: expect.any(String),
        user: expect.objectContaining({ id: 'user-1' }),
        summary: expect.objectContaining({
          totalLikes: 0,
          totalPlaylists: 0,
          totalHistoryEntries: 0,
          totalAnalyticsEvents: 0,
          totalFollows: 0,
        }),
      })
    )
  })

  it('returns 401 if not authenticated', async () => {
    const req = {} as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    vi.spyOn(prisma.user, 'findUnique')

    await exportUserData(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'UNAUTHENTICATED', message: 'Chưa đăng nhập' } })
  })

  it('anonymizes user data while preserving analytics for reporting', async () => {
    const req = {
      user: { id: 'user-1' },
    } as any
    const res = {
      json: vi.fn(),
    } as any

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        analyticsEvent: { updateMany: vi.fn().mockResolvedValue({}) },
        jamendoListening: { updateMany: vi.fn().mockResolvedValue({}) },
        listeningHistory: { deleteMany: vi.fn().mockResolvedValue({}) },
        like: { deleteMany: vi.fn().mockResolvedValue({}) },
        jamendoLike: { deleteMany: vi.fn().mockResolvedValue({}) },
        follow: { deleteMany: vi.fn().mockResolvedValue({}) },
        playlist: { findMany: vi.fn().mockResolvedValue([{ id: 'playlist-1' }]), deleteMany: vi.fn().mockResolvedValue({}) },
        jamendoPlaylistSong: { deleteMany: vi.fn().mockResolvedValue({}) },
        playlistSong: { deleteMany: vi.fn().mockResolvedValue({}) },
        user: { update: vi.fn().mockResolvedValue({ id: 'user-1' }) },
      }
      await callback(tx)
      return undefined
    })

    await deleteUserData(req, res)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ message: 'Đã xóa và ẩn danh dữ liệu người dùng thành công' })
  })

  it('returns 401 if not authenticated on delete', async () => {
    const req = {} as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    await deleteUserData(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'UNAUTHENTICATED', message: 'Chưa đăng nhập' } })
  })
})
