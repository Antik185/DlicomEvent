import { ensureSchema, GAMES } from './_lib/db.js';
import { methodNotAllowed, sendJson } from './_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const sql = await ensureSchema();
    const [rows, totals] = await Promise.all([
      sql`
        SELECT
          game,
          COUNT(*)::int AS votes,
          COALESCE(SUM(points) FILTER (WHERE region = 'RU'), 0)::int AS ru_points,
          COALESCE(SUM(points) FILTER (WHERE region = 'NG'), 0)::int AS ng_points
        FROM tournament_votes
        GROUP BY game
      `,
      sql`SELECT COUNT(*)::int AS total_voters FROM tournament_votes`
    ]);

    const byGame = new Map(rows.map((row) => [row.game, row]));
    const games = GAMES.map((game) => {
      const row = byGame.get(game);
      return {
        game,
        votes: Number(row?.votes || 0),
        ruPoints: Number(row?.ru_points || 0),
        ngPoints: Number(row?.ng_points || 0)
      };
    });

    sendJson(res, 200, {
      games,
      totalVoters: Number(totals[0]?.total_voters || 0),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to load standings:', error);
    sendJson(res, 503, { error: 'Live standings are temporarily unavailable.' });
  }
}
