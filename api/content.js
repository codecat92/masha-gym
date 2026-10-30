// GET    -> published content (404 if nothing saved yet, the site then uses data/content.json)
// POST   -> save content (header x-admin-password) or {"check":true} to verify the password
// DELETE -> reset to the default data/content.json
const crypto = require('crypto');
const { enabled, cmd } = require('./_redis');
const KEY = 'masha:content';

function authed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = String(req.headers['x-admin-password'] || '');
  if (!pw) return 'noenv';
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(pw).digest();
  return crypto.timingSafeEqual(a, b) ? 'ok' : 'bad';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (!enabled()) return res.status(404).json({ error: 'storage-disabled' });
      const raw = await cmd(['GET', KEY]);
      if (!raw) return res.status(404).json({ error: 'empty' });
      return res.status(200).json(JSON.parse(raw));
    }
    const a = authed(req);
    if (a === 'noenv') return res.status(500).json({ error: 'ADMIN_PASSWORD is not set in Vercel environment variables' });
    if (a !== 'ok') return res.status(401).json({ error: 'wrong password' });

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body && body.check) return res.status(200).json({ ok: true, storage: enabled() });
      if (!enabled()) return res.status(503).json({ error: 'No database connected. Add Upstash Redis in Vercel Storage.' });
      if (!body || !Array.isArray(body.exercises) || !body.program || !Array.isArray(body.program.sessions)) {
        return res.status(400).json({ error: 'invalid content' });
      }
      const text = JSON.stringify(body);
      if (text.length > 900000) return res.status(413).json({ error: 'too large' });
      await cmd(['SET', KEY, text]);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      if (!enabled()) return res.status(503).json({ error: 'No database connected' });
      await cmd(['DEL', KEY]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
