import { neon } from '@neondatabase/serverless';

export const GAMES = ['efootball', 'cs16', 'kirka', 'chess', 'geoguessr', 'poxel'];
export const REGIONS = ['RU', 'NG'];
export const ROLE_POINTS = Object.freeze({ regular: 1, dliever: 2, dcoded: 3, dco: 5 });

let schemaPromise;

export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS tournament_votes (
          id BIGSERIAL PRIMARY KEY,
          nickname TEXT NOT NULL,
          nickname_key TEXT NOT NULL UNIQUE,
          region TEXT NOT NULL CHECK (region IN ('RU', 'NG')),
          role TEXT NOT NULL CHECK (role IN ('regular', 'dliever', 'dcoded', 'dco')),
          game TEXT NOT NULL CHECK (game IN ('efootball', 'cs16', 'kirka', 'chess', 'geoguessr', 'poxel')),
          points SMALLINT NOT NULL CHECK (points IN (1, 2, 3, 5)),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS tournament_votes_game_idx ON tournament_votes (game)`;
      return sql;
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

export function normalizeNickname(value) {
  const nickname = String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (nickname.length < 1 || nickname.length > 64 || /[\u0000-\u001f\u007f]/.test(nickname)) {
    throw new Error('Nickname must contain 1–64 visible characters.');
  }
  return { nickname, nicknameKey: nickname.toLocaleLowerCase('en-US') };
}
