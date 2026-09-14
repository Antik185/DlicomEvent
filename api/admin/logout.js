import { clearSessionCookie } from '../_lib/auth.js';
import { methodNotAllowed, sendJson } from '../_lib/response.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  res.setHeader('Set-Cookie', clearSessionCookie());
  sendJson(res, 200, { ok: true });
}
