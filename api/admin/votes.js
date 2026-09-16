import { isAdmin } from '../_lib/auth.js';
import { ensureSchema, GAMES, normalizeNickname, REGIONS, ROLE_POINTS } from '../_lib/db.js';
import { methodNotAllowed, readJson, sendJson } from '../_lib/response.js';

function unauthorized(res) {
  return sendJson(res, 401, { error: 'Authentication required.' });
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return unauthorized(res);
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  }

  try {
    const sql = await ensureSchema();

    if (req.method === 'GET') {
      const votes = await sql`
        SELECT id, nickname, region, role, game, points, created_at
        FROM tournament_votes
        ORDER BY created_at DESC, id DESC
      `;
      return sendJson(res, 200, { votes });
    }

    const body = await readJson(req);

    if (req.method === 'DELETE') {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id < 1) return sendJson(res, 400, { error: 'Invalid vote id.' });
      const deleted = await sql`DELETE FROM tournament_votes WHERE id = ${id} RETURNING id`;
      if (!deleted.length) return sendJson(res, 404, { error: 'Vote not found.' });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'PATCH') {
      const id = Number(body.id);
      const region = String(body.region || '').toUpperCase();
      if (!Number.isSafeInteger(id) || id < 1) return sendJson(res, 400, { error: 'Invalid vote id.' });
      if (!REGIONS.includes(region)) return sendJson(res, 400, { error: 'Choose RU or Nigeria.' });
      const updated = await sql`
        UPDATE tournament_votes
        SET region = ${region}
        WHERE id = ${id}
        RETURNING id, nickname, region, role, game, points, created_at
      `;
      if (!updated.length) return sendJson(res, 404, { error: 'Vote not found.' });
      return sendJson(res, 200, { vote: updated[0] });
    }

    const { nickname, nicknameKey } = normalizeNickname(body.nickname);
    const region = String(body.region || '').toUpperCase();
    const role = String(body.role || '').toLowerCase();
    const game = String(body.game || '').toLowerCase();

    if (!REGIONS.includes(region)) return sendJson(res, 400, { error: 'Choose RU or Nigeria.' });
    if (!(role in ROLE_POINTS)) return sendJson(res, 400, { error: 'Choose a valid role.' });
    if (!GAMES.includes(game)) return sendJson(res, 400, { error: 'Choose a valid game.' });

    const points = ROLE_POINTS[role];
    const inserted = await sql`
      INSERT INTO tournament_votes (nickname, nickname_key, region, role, game, points)
      VALUES (${nickname}, ${nicknameKey}, ${region}, ${role}, ${game}, ${points})
      RETURNING id, nickname, region, role, game, points, created_at
    `;
    return sendJson(res, 201, { vote: inserted[0] });
  } catch (error) {
    if (error?.code === '23505') {
      return sendJson(res, 409, { error: 'This nickname has already voted.' });
    }
    if (error instanceof SyntaxError) return sendJson(res, 400, { error: 'Invalid JSON body.' });
    if (error?.message?.startsWith('Nickname')) return sendJson(res, 400, { error: error.message });
    console.error('Admin vote request failed:', error);
    return sendJson(res, 503, { error: 'The database is temporarily unavailable.' });
  }
}
