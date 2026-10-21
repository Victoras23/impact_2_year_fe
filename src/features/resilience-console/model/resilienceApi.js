import { request, joinUrl } from "../../../shared/api/index.js";
import { MQ_PATHS, ORDERS_PATH, PRODUCTS_PATH } from "../../../shared/config/index.js";

// Lecția 22 — starea circuit breaker-ului, a retry-urilor și a outbox-ului (serviciul de comenzi).
export const RESILIENCE_PATH = "/api/v1/resilience/stats";
export const DLQ_REPLAY_PATH = "/api/v1/mq/dlq/replay";

function parse(res) {
  try { return JSON.parse(res.text); } catch { return null; }
}

export async function fetchResilience(baseUrl) {
  const res = await request(joinUrl(baseUrl, RESILIENCE_PATH));
  if (res.status === 0) return { kind: "down" };
  if (!res.ok) return { kind: "error", status: res.status };
  return { kind: "ok", data: parse(res), at: Date.now() };
}

export async function fetchQueues(baseUrl) {
  const res = await request(joinUrl(baseUrl, MQ_PATHS.stats));
  const body = parse(res);
  return res.ok && body ? body.queues : null;
}

// O comandă cu una sau mai multe linii. processing: "async" (prin RabbitMQ) sau "sync".
export async function placeOrder(baseUrl, token, items, processing = "async") {
  const res = await request(joinUrl(baseUrl, ORDERS_PATH + "?processing=" + processing),
    { method: "POST", token, body: { items } });
  return { status: res.status, ms: res.ms, body: parse(res), retryAfter: (res.headers || {})["retry-after"] || null };
}

export async function fetchOrder(baseUrl, token, id) {
  const res = await request(joinUrl(baseUrl, ORDERS_PATH + "/" + id), { token });
  return res.ok ? parse(res) : null;
}

export async function fetchProducts(baseUrl) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "?size=50&sort=id,asc"));
  const body = parse(res);
  return res.ok && body ? body.content : null;
}

export async function fetchStock(baseUrl, id) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "/" + id));
  const body = parse(res);
  return res.ok && body ? body.stock : null;
}

export async function replayDlq(baseUrl, token) {
  const res = await request(joinUrl(baseUrl, DLQ_REPLAY_PATH), { method: "POST", token });
  return { status: res.status, body: parse(res) };
}
