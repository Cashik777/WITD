import { randomUUID } from 'crypto'
import type { Customer, CustomerProfile, EmailVerification } from '../models/Customer.js'
import { PostgresCustomerRepository } from './PostgresCustomerRepository.js'

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>
  findById(id: string): Promise<Customer | null>
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'emailVerified' | 'firstName' | 'lastName' | 'age'>): Promise<Customer>
  ping(): Promise<boolean>
  setVerification(customerId: string, verification: EmailVerification): Promise<void>
  getVerification(customerId: string): Promise<EmailVerification | null>
  incrementVerificationAttempts(customerId: string): Promise<void>
  markVerified(customerId: string): Promise<void>
  updateProfile(customerId: string, profile: CustomerProfile): Promise<Customer>
}

class InMemoryCustomerRepository implements CustomerRepository {
  private customers = new Map<string, Customer>()
  private verifications = new Map<string, EmailVerification>()

  async ping(): Promise<boolean> {
    return true
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return [...this.customers.values()].find((c) => c.email === email.toLowerCase()) ?? null
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) ?? null
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'emailVerified' | 'firstName' | 'lastName' | 'age'>): Promise<Customer> {
    const full: Customer = {
      ...customer,
      id: randomUUID(),
      emailVerified: false,
      firstName: null,
      lastName: null,
      age: null,
      createdAt: new Date().toISOString(),
    }
    this.customers.set(full.id, full)
    return full
  }

  async setVerification(customerId: string, verification: EmailVerification): Promise<void> {
    this.verifications.set(customerId, verification)
  }

  async getVerification(customerId: string): Promise<EmailVerification | null> {
    return this.verifications.get(customerId) ?? null
  }

  async incrementVerificationAttempts(customerId: string): Promise<void> {
    const v = this.verifications.get(customerId)
    if (v) v.attempts += 1
  }

  async markVerified(customerId: string): Promise<void> {
    const c = this.customers.get(customerId)
    if (c) c.emailVerified = true
    this.verifications.delete(customerId)
  }

  async updateProfile(customerId: string, profile: CustomerProfile): Promise<Customer> {
    const c = this.customers.get(customerId)
    if (!c) throw new Error('Customer not found')
    const updated = { ...c, ...profile }
    this.customers.set(customerId, updated)
    return updated
  }
}

// See the comment in data/db.ts — this selection must stay synchronous.
function createCustomerRepository(): CustomerRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresCustomerRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — customer accounts are in-memory and will be lost on restart.')
  return new InMemoryCustomerRepository()
}

export const customerRepository: CustomerRepository = createCustomerRepository()
