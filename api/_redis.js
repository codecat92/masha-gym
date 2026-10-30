// Minimal Upstash Redis (REST) client. Works with Vercel Marketplace "Upstash Redis"
// (UPSTASH_REDIS_REST_*) and the older Vercel KV names (KV_REST_API_*).
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

exports.enabled = () => Boolean(URL_ && TOKEN);

exports.cmd = async function cmd(args) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
