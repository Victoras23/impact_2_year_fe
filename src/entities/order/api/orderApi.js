import { request, joinUrl } from "../../../shared/api/index.js";
import { ORDERS_PATH, MQ_PATHS } from "../../../shared/config/index.js";

// Lecția 18 — comenzile. Toate întorc { ok, status, ms, data } — nu aruncă excepții.
async function call(baseUrl, path, options) {
  const res = await request(joinUrl(baseUrl, path), options);
  let data = null;
  try { data = res.text ? JSON.parse(res.text) : null; } catch { /* nu e JSON */ }
  return { ok: res.ok, status: res.status, ms: res.ms, data, headers: res.headers || {} };
}

// processing: "async" (implicit, 202 + PENDING) sau "sync" (doar pentru comparația din lecție).
export function placeOrder(baseUrl, token, items, processing = "async") {
  const body = { items: items.map((i) => ({ productId: i.id, quantity: i.qty })) };
  const query = processing === "sync" ? "?processing=sync" : "";
  return call(baseUrl, ORDERS_PATH + query, { method: "POST", body, token });
}

export function fetchMyOrders(baseUrl, token) {
  return call(baseUrl, ORDERS_PATH, { token });
}

export function fetchQueueStats(baseUrl) {
  return call(baseUrl, MQ_PATHS.stats);
}

export function sendPoisonMessage(baseUrl, token) {
  return call(baseUrl, MQ_PATHS.poison, { method: "POST", token });
}

export function purgeDeadLetters(baseUrl, token) {
  return call(baseUrl, MQ_PATHS.dlq, { method: "DELETE", token });
}

// Checkout-ul (în coș) și lista „Comenzile mele” sunt în locuri diferite din
// pagină; un eveniment în browser le leagă fără să le facă să depindă una de alta.
export const ORDERS_CHANGED = "impact:orders-changed";
export function notifyOrdersChanged() {
  try { window.dispatchEvent(new Event(ORDERS_CHANGED)); } catch { /* fără window */ }
}
