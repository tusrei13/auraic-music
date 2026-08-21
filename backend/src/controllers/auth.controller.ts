import { Request, Response } from 'express'
import { supabase, AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) return res.status(400).json({ error: error.message })

    if (data.user) {
      const user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: name || email.split('@')[0],
        },
      })
      return res.status(201).json({ message: 'Đăng ký thành công', user, session: data.session })
    }

    res.status(400).json({ error: 'Đăng ký không thành công' })
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng ký' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return res.status(400).json({ error: error.message })

    res.json({
      message: 'Đăng nhập thành công',
      user: data.user,
      token: data.session?.access_token,
    })
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' })
  }
}

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' })

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        playlists: true,
        likes: { include: { song: { include: { artist: true } } } },
      },
    })

    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' })

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' })
  }
}