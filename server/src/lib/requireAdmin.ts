import type { Request, Response, NextFunction } from 'express'
import { userRepository } from '../data/usersDb.js'
import { verifySession } from './auth.js'

export const SESSION_COOKIE = 'witd_admin_session'

export interface AdminRequest extends Request {
  adminUser?: { id: string; email: string }
}

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  const userId = token ? verifySession(token) : null
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' })

  const user = await userRepository.findById(userId)
  if (!user) return res.status(401).json({ error: 'Not authenticated.' })

  req.adminUser = { id: user.id, email: user.email }
  next()
}
