import { describe, expect, it, vi, beforeEach } from 'vitest'
import { updateAdminUserRole, deleteAdminPlaylist, updateSystemSettings, runIngestion } from './admin.controller'
import { prisma } from '../lib/prisma'

vi.mock('../services/jamendo.service', () => ({
  getJamendoTracks: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' }, { id: '9' }, { id: '10' }]),
}))

describe('admin.controller audit logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('logs UPDATE_USER_ROLE with previous and new role', async () => {
    const req = {
      user: { id: 'admin-1' },
      params: { id: 'user-1' },
      body: { role: 'ADMIN' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
    } as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ role: 'USER' } as any)
    vi.spyOn(prisma.user, 'update').mockResolvedValue({ id: 'user-1', email: 'u@test.com', name: 'U', role: 'ADMIN' } as any)
    vi.spyOn(prisma.adminAuditLog, 'create').mockResolvedValue({} as any)

    await updateAdminUserRole(req, res)

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-1',
        action: 'UPDATE_USER_ROLE',
        targetType: 'User',
        targetId: 'user-1',
        changes: { previousRole: 'USER', newRole: 'ADMIN' },
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      },
    })
    expect(res.json).toHaveBeenCalledWith({ user: { id: 'user-1', email: 'u@test.com', name: 'U', role: 'ADMIN' } })
  })

  it('logs DELETE_PLAYLIST', async () => {
    const req = {
      user: { id: 'admin-1' },
      params: { id: 'playlist-1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
    } as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    vi.spyOn(prisma.playlist, 'delete').mockResolvedValue({ id: 'playlist-1', name: 'My Playlist' } as any)
    vi.spyOn(prisma.adminAuditLog, 'create').mockResolvedValue({} as any)

    await deleteAdminPlaylist(req, res)

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-1',
        action: 'DELETE_PLAYLIST',
        targetType: 'Playlist',
        targetId: 'playlist-1',
        changes: { name: 'My Playlist' },
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      },
    })
  })

  it('logs UPDATE_SETTINGS with changed keys', async () => {
    const req = {
      user: { id: 'admin-1' },
      body: { siteName: 'Auraic 2', defaultLanguage: 'en' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
    } as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    vi.spyOn(prisma.systemSetting, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma, '$transaction').mockResolvedValue([])
    vi.spyOn(prisma.systemSetting, 'upsert').mockResolvedValue({} as any)
    vi.spyOn(prisma.adminAuditLog, 'create').mockResolvedValue({} as any)

    await updateSystemSettings(req, res)

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-1',
        action: 'UPDATE_SETTINGS',
        targetType: 'SystemSetting',
        targetId: undefined,
        changes: { siteName: 'Auraic 2', defaultLanguage: 'en' },
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      },
    })
  })

  it('logs RUN_INGESTION success and failure', async () => {
    const req = {
      user: { id: 'admin-1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
    } as any
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    } as any

    vi.spyOn(prisma.ingestionJob, 'create').mockResolvedValue({ id: 'job-1', status: 'RUNNING' } as any)
    vi.spyOn(prisma.ingestionJob, 'update').mockResolvedValue({ id: 'job-1', status: 'SUCCEEDED', imported: 10 } as any)
    vi.spyOn(prisma.adminAuditLog, 'create').mockResolvedValue({} as any)
    vi.spyOn(global, 'setTimeout').mockImplementation(() => ({}) as ReturnType<typeof setTimeout>)

    await runIngestion(req, res)

    const calls = (prisma.adminAuditLog.create as any).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0].data.action).toBe('RUN_INGESTION')
    expect(calls[0][0].data.changes).toEqual({ status: 'RUNNING' })
    expect(calls[1][0].data.action).toBe('RUN_INGESTION')
    expect(calls[1][0].data.changes).toEqual({ status: 'SUCCEEDED', imported: 10 })
  })

  it('does not fail the request if audit logging fails', async () => {
    const req = {
      user: { id: 'admin-1' },
      params: { id: 'user-2' },
      body: { role: 'USER' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
    } as any
    const res = {
      json: vi.fn(),
      status: vi.fn(() => res),
      getHeader: vi.fn(),
    } as any

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ role: 'ADMIN' } as any)
    vi.spyOn(prisma.user, 'update').mockResolvedValue({ id: 'user-2', email: 'u@test.com', name: 'U', role: 'USER' } as any)
    vi.spyOn(prisma.adminAuditLog, 'create').mockRejectedValue(new Error('DB error'))

    await updateAdminUserRole(req, res)

    expect(res.json).toHaveBeenCalledWith({ user: { id: 'user-2', email: 'u@test.com', name: 'U', role: 'USER' } })
  })
})
