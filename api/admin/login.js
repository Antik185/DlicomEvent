import { createSessionCookie, passwordsMatch } from '../_lib/auth.js';
import { methodNotAllowed, readJson, sendJson } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { password } = await readJson(req);
    if (!passwordsMatch(String(password || ''))) {
      return sendJson(res, 401, { error: 'Incorrect password.' });
    }
    res.setHeader('Set-Cookie', createSessionCookie());
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Admin login failed:', error);
    sendJson(res, 503, { error: 'Admin access is not configured yet.' });
  }
}
