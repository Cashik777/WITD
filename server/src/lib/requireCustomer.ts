import type { Request, Response, NextFunction } from 'express'
import { customerRepository } from '../data/customersDb.js'
import { verifySession } from './auth.js'

// Separate cookie from the admin session (witd_admin_session) — a customer
// session must never grant admin access and vice versa, even though both
// reuse the same signing helpers.
export const CUSTOMER_SESSION_COOKIE = 'witd_customer_session'

export interface CustomerRequest extends Request {
  customer?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    age: number | null
  }
}

export async function requireCustomer(req: CustomerRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[CUSTOMER_SESSION_COOKIE]
  const customerId = token ? verifySession(token) : null
  if (!customerId) return res.status(401).json({ error: 'Not authenticated.' })

  const customer = await customerRepository.findById(customerId)
  if (!customer) return res.status(401).json({ error: 'Not authenticated.' })

  req.customer = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    age: customer.age,
  }
  next()
}
