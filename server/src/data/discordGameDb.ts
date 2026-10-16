import { getPool } from '../lib/pgPool.js'

export interface DiscordScore {
  discordUserId: string
  username: string
  score: number
  lastPlayedAt: string | null
}

export interface DiscordGameRepository {
  get(discordUserId: string): Promise<DiscordScore | null>
  addScore(discordUserId: string, username: string, points: number, playedAt: string): Promise<DiscordScore>
  top(limit: number): Promise<DiscordScore[]>
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS discord_scores (
    discord_user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ
  );
`

function rowToScore(row: Record<string, unknown>): DiscordScore {
  return {
    discordUserId: row.discord_user_id as string,
    username: row.username as string,
    score: Number(row.score),
    lastPlayedAt: row.last_played_at ? (row.last_played_at as Date).toISOString() : null,
  }
}

class PostgresDiscordGameRepository implements DiscordGameRepository {
  private pool = getPool()
  private ready = this.pool.query(CREATE_TABLE_SQL).then(() => undefined)

  async get(discordUserId: string): Promise<DiscordScore | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM discord_scores WHERE discord_user_id = $1', [discordUserId])
    return rows[0] ? rowToScore(rows[0]) : null
  }

  async addScore(discordUserId: string, username: string, points: number, playedAt: string): Promise<DiscordScore> {
    await this.ready
    const { rows } = await this.pool.query(
      `INSERT INTO discord_scores (discord_user_id, username, score, last_played_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (discord_user_id)
       DO UPDATE SET username = $2, score = discord_scores.score + $3, last_played_at = $4
       RETURNING *`,
      [discordUserId, username, points, playedAt]
    )
    return rowToScore(rows[0])
  }

  async top(limit: number): Promise<DiscordScore[]> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM discord_scores ORDER BY score DESC LIMIT $1', [limit])
    return rows.map(rowToScore)
  }
}

class InMemoryDiscordGameRepository implements DiscordGameRepository {
  private scores = new Map<string, DiscordScore>()

  async get(discordUserId: string): Promise<DiscordScore | null> {
    return this.scores.get(discordUserId) ?? null
  }

  async addScore(discordUserId: string, username: string, points: number, playedAt: string): Promise<DiscordScore> {
    const existing = this.scores.get(discordUserId)
    const updated: DiscordScore = {
      discordUserId,
      username,
      score: (existing?.score ?? 0) + points,
      lastPlayedAt: playedAt,
    }
    this.scores.set(discordUserId, updated)
    return updated
  }

  async top(limit: number): Promise<DiscordScore[]> {
    return [...this.scores.values()].sort((a, b) => b.score - a.score).slice(0, limit)
  }
}

function createDiscordGameRepository(): DiscordGameRepository {
  if (process.env.DATABASE_URL) return new PostgresDiscordGameRepository()
  return new InMemoryDiscordGameRepository()
}

export const discordGameRepository: DiscordGameRepository = createDiscordGameRepository()
