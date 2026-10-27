import { request, joinUrl } from "../../../shared/api/index.js";
import { PRODUCTS_PATH, PUSH_PATHS } from "../../../shared/config/index.js";
import { notifyOrdersChanged, placeOrder } from "../../../entities/order/index.js";

// Lecția 25 — apelurile spre orders-service (prin gateway) pentru notificările push.

function parse(res) {
  try { return JSON.parse(res.text); } catch { return null; }
}

// Publică: backend-ul spune dacă are cheia Firebase și dă configurația pentru browser.
export async function fetchPushConfig(baseUrl) {
  const res = await request(joinUrl(baseUrl, PUSH_PATHS.config));
  return { status: res.status, body: parse(res) };
}

export async function registerToken(baseUrl, token, fcmToken, device) {
  const res = await request(joinUrl(baseUrl, PUSH_PATHS.tokens), { method: "POST", token, body: { token: fcmToken, device } });
  return { status: res.status, body: parse(res) };
}

export async function unregisterToken(baseUrl, token, fcmToken) {
  const res = await request(joinUrl(baseUrl, PUSH_PATHS.tokens), { method: "DELETE", token, body: { token: fcmToken } });
  return { status: res.status, body: parse(res) };
}

export async function fetchMyPush(baseUrl, token) {
  const res = await request(joinUrl(baseUrl, PUSH_PATHS.me), { token });
  return { status: res.status, body: parse(res) };
}

export async function sendTestPush(baseUrl, token) {
  const res = await request(joinUrl(baseUrl, PUSH_PATHS.test), { method: "POST", token });
  return { status: res.status, body: parse(res), ms: res.ms };
}

// O comandă mică (1 bucată din primul produs cu stoc) — ca să vedem cele două notificări:
// „am primit comanda” (PENDING) și „e confirmată” (după ~1,5 s de verificare în orders-service).
export async function placeTestOrder(baseUrl, token) {
  const list = parse(await request(joinUrl(baseUrl, PRODUCTS_PATH + "?page=0&size=20")));
  const product = list && (list.content || []).find((p) => p.stock > 0);
  if (!product) return { status: 0, error: "Niciun produs cu stoc" };
  const res = await placeOrder(baseUrl, token, [{ id: product.id, qty: 1 }]);
  if (res.ok) notifyOrdersChanged();   // „Comenzile mele” (Lecția 18) se reîncarcă, ca la checkout
  return { status: res.status, body: res.data, product: product.name };
}
