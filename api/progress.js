// Masha's progress (done workouts, weigh-ins). Stored as one JSON blob so you can see it in the admin.
// There is no login on purpose: the site is for one person. Keep the URL private.
const { enabled, cmd } = require('./_redis');
const KEY = 'masha:progress';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!enabled()) return res.status(404).json({ error: 'storage-disabled' });
  try {
    if (req.method === 'GET') {
      const raw = await cmd(['GET', KEY]);
      if (!raw) return res.status(404).json({ error: 'empty' });
      return res.status(200).json(JSON.parse(raw));
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!b || typeof b !== 'object' || typeof b.sessions !== 'object') return res.status(400).json({ error: 'invalid' });
      const clean = {
        sessions: b.sessions,
        weighIns: Array.isArray(b.weighIns) ? b.weighIns.slice(0, 500) : [],
        startWeight: typeof b.startWeight === 'number' ? b.startWeight : null,
        updated: Number(b.updated) || Date.now(),
      };
      const text = JSON.stringify(clean);
      if (text.length > 200000) return res.status(413).json({ error: 'too large' });
      await cmd(['SET', KEY, text]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
