import { randomUUID } from 'crypto'
import type { Customer } from '../models/Customer.js'
import { PostgresCustomerRepository } from './PostgresCustomerRepository.js'

export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>
  findById(id: string): Promise<Customer | null>
  create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  ping(): Promise<boolean>
}

class InMemoryCustomerRepository implements CustomerRepository {
  private customers = new Map<string, Customer>()

  async ping(): Promise<boolean> {
    return true
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return [...this.customers.values()].find((c) => c.email === email.toLowerCase()) ?? null
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) ?? null
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const full: Customer = { ...customer, id: randomUUID(), createdAt: new Date().toISOString() }
    this.customers.set(full.id, full)
    return full
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
