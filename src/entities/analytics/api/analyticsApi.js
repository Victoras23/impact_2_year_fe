import { request, joinUrl } from "../../../shared/api/index.js";
import { KAFKA_PATHS, ANALYTICS_PATHS } from "../../../shared/config/index.js";

// Lecția 19 — Kafka + handler-ul „analytics”. Întorc { ok, status, ms, data }, nu aruncă excepții.
async function call(baseUrl, path, options) {
  const res = await request(joinUrl(baseUrl, path), options);
  let data = null;
  try { data = res.text ? JSON.parse(res.text) : null; } catch { /* nu e JSON */ }
  return { ok: res.ok, status: res.status, ms: res.ms, data };
}

export const fetchKafkaStats = (baseUrl) => call(baseUrl, KAFKA_PATHS.stats);
export const fetchKafkaEvents = (baseUrl, token, limit = 20) => call(baseUrl, `${KAFKA_PATHS.events}?limit=${limit}`, { token });
export const fetchSalesSummary = (baseUrl, token) => call(baseUrl, ANALYTICS_PATHS.summary, { token });
export const pauseAnalytics = (baseUrl, token) => call(baseUrl, ANALYTICS_PATHS.pause, { method: "POST", token });
export const resumeAnalytics = (baseUrl, token) => call(baseUrl, ANALYTICS_PATHS.resume, { method: "POST", token });
export const replayAnalytics = (baseUrl, token) => call(baseUrl, ANALYTICS_PATHS.replay, { method: "POST", token });

// Suma lag-ului din toate partițiile unui răspuns /kafka/stats.
export function totalLag(stats) {
  if (!stats || !stats.topics) return null;
  return stats.topics.reduce((sum, t) => sum + t.totalLag, 0);
}
