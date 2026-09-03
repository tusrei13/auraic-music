import { Request, Response } from 'express'
import { supabase, AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid credentials or registration failed
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || password.length < 6) {
      return sendError(res, 400, 'INVALID_CREDENTIALS', 'Email và password không hợp lệ')
    }

    if (!supabase) return sendInternalError(res, 'SUPABASE_NOT_CONFIGURED', 'Backend chưa cấu hình Supabase')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) return sendError(res, 400, 'AUTH_REGISTER_FAILED', error.message)

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

    sendError(res, 400, 'AUTH_REGISTER_FAILED', 'Đăng ký không thành công')
  } catch (error) {
    sendInternalError(res, 'AUTH_REGISTER_ERROR', 'Lỗi server khi đăng ký')
  }
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return sendError(res, 400, 'INVALID_CREDENTIALS', 'Email và password không hợp lệ')
    }

    if (!supabase) return sendInternalError(res, 'SUPABASE_NOT_CONFIGURED', 'Backend chưa cấu hình Supabase')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return sendError(res, 400, 'AUTH_LOGIN_FAILED', error.message)

    res.json({
      message: 'Đăng nhập thành công',
      user: data.user,
      token: data.session?.access_token,
    })
  } catch (error) {
    sendInternalError(res, 'AUTH_LOGIN_ERROR', 'Lỗi server khi đăng nhập')
  }
}

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthenticated
 *       404:
 *         description: User not found
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        playlists: {
          include: {
            songs: {
              include: {
                song: { include: { artist: true, genre: true } },
              },
            },
            jamendoSongs: true,
          },
        },
        likes: { include: { song: { include: { artist: true } } } },
      },
    })

    if (!user) return sendError(res, 404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng')

    res.json(user)
  } catch (error) {
    sendInternalError(res, 'AUTH_ME_ERROR', 'Lỗi server')
  }
}

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthenticated
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const { name, avatar } = req.body
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(typeof name === 'string' ? { name: name.trim() } : {}),
        ...(typeof avatar === 'string' ? { avatar: avatar.trim() } : {}),
      },
    })
    return res.json({ message: 'Đã cập nhật thông tin cá nhân', user: updatedUser })
  } catch {
    return sendInternalError(res, 'AUTH_UPDATE_PROFILE_ERROR', 'Không thể cập nhật hồ sơ')
  }
}