import pg from 'pg'

const { Pool } = pg

// One shared pool for every Postgres-backed repository (orders, products,
// users) instead of one pool per repository — three separate pools (each
// defaulting to up to 10 connections) was enough to exhaust Neon's free-tier
// connection limit, which doesn't reject a stuck connection attempt, it just
// hangs forever. That silent hang is what crashed the server on boot (Node
// exit code 13: "unfinished top-level await") since the repository factory
// functions never resolved. connectionTimeoutMillis turns any future
// connection problem into a real, loggable error instead of a silent hang.
let sharedPool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    })
  }
  return sharedPool
}
