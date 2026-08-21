import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
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
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' })
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

      req.user = { id: dbUser.id, email: dbUser.email }
      return next()
    }

    // 2. Hỗ trợ test nhanh khi Dev bằng Header x-user-id
    if (devUserId) {
      const dbUser = await prisma.user.findUnique({ where: { id: devUserId } })
      if (dbUser) {
        req.user = { id: dbUser.id, email: dbUser.email }
        return next()
      }
    }

    return res.status(401).json({ error: 'Yêu cầu token xác thực (Header: Authorization: Bearer <token>)' })
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi xác thực người dùng' })
  }
}