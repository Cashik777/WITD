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
    // Neon (serverless Postgres) can close an idle connection from its side
    // at any moment, slightly outside pg's own idleTimeoutMillis — that
    // surfaces as an 'error' event on the pool from a client that's just
    // sitting idle, not in the middle of a query. node-pg's own docs call
    // this out explicitly: an EventEmitter's 'error' event with no listener
    // throws all the way to the top and kills the whole process. This is
    // what actually crashed the server (confirmed via Render's logs — the
    // stack trace bottoms out in pg/lib/connection.js's socket handler, not
    // in any of our own request code), nothing to do with image uploads.
    sharedPool.on('error', (err) => {
      console.error('Unexpected Postgres pool error (idle client) — not fatal:', err)
    })
  }
  return sharedPool
}
