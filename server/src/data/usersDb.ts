import { randomUUID } from 'crypto'
import type { User } from '../models/User.js'
import { PostgresUserRepository } from './PostgresUserRepository.js'

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>
  count(): Promise<number>
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>()

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email.toLowerCase()) ?? null
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const full: User = { ...user, id: randomUUID(), createdAt: new Date().toISOString() }
    this.users.set(full.id, full)
    return full
  }

  async count(): Promise<number> {
    return this.users.size
  }
}

// See the comment in data/db.ts — this selection must stay synchronous.
function createUserRepository(): UserRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresUserRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — admin users are in-memory and will be lost on restart.')
  return new InMemoryUserRepository()
}

export const userRepository: UserRepository = createUserRepository()
