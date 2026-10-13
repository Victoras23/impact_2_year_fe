// Lecția 16 — header-ele pe care backend-ul le pune pe orice cerere limitată.
// request() din shared/api le dă deja ca obiect simplu, cu chei lowercase.
export function readRateLimit(res) {
  const h = res.headers || {};
  const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
  let message = null;
  try { message = JSON.parse(res.text).message || null; } catch { /* corp gol sau nu-JSON */ }
  return {
    status: res.status,
    limit: num(h["x-ratelimit-limit"]),
    remaining: num(h["x-ratelimit-remaining"]),
    retryAfter: num(h["retry-after"]),
    message,
    ms: res.ms,
  };
}
