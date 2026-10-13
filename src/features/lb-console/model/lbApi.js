import { request, joinUrl } from "../../../shared/api/index.js";

// Lecția 17 — endpoint-urile de practică ale backend-ului (pachetul loadbalancing).
export const LB_PATHS = {
  whoami: "/api/v1/lb/whoami",
  slow: "/api/v1/lb/slow",
  visits: "/api/v1/lb/visits",
};

// Fiecare răspuns spune ce instanță l-a servit (X-Instance-Id) și, prin Nginx,
// ce algoritm a ales-o (X-LB-Algorithm). request() dă header-ele cu chei lowercase.
export async function lbCall(baseUrl, path, options = {}) {
  const res = await request(joinUrl(baseUrl, path), options);
  let body = null;
  try { body = res.text ? JSON.parse(res.text) : null; } catch { /* nu e JSON */ }
  const h = res.headers || {};
  return {
    status: res.status,
    ms: res.ms,
    body,
    instance: h["x-instance-id"] || (body && body.instanceId) || null,
    algorithm: h["x-lb-algorithm"] || null,
  };
}
