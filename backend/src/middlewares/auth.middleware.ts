import 'dotenv/config'
import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
    role: 'USER' | 'ADMIN'
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const devUserId = req.headers['x-user-id'] as string

    // 1. Nếu gửi Token từ Supabase Auth
    if (authHeader?.startsWith('Bearer ')) {
      if (!supabase) {
        return sendInternalError(res, 'SUPABASE_NOT_CONFIGURED', 'Backend chưa cấu hình Supabase')
      }
      const token = authHeader.slice('Bearer '.length).trim()
      if (!token) return sendError(res, 401, 'INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn')
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return sendError(res, 401, 'INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn')
      }

      let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || null,
          },
        })
      }

      req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role }
      return next()
    }

    // 2. Hỗ trợ test nhanh khi Dev bằng Header x-user-id
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH === 'true' && devUserId) {
      const dbUser = await prisma.user.findUnique({ where: { id: devUserId } })
      if (dbUser) {
        req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role }
        return next()
      }
    }

    return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu token xác thực (Header: Authorization: Bearer <token>)')
  } catch (err) {
    return sendInternalError(res, 'AUTHENTICATION_ERROR', 'Lỗi xác thực người dùng')
  }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return sendError(res, 403, 'ADMIN_REQUIRED', 'Chỉ quản trị viên mới được thực hiện thao tác này')
  }
  next()
}