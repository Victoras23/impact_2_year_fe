import { request, joinUrl } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";

// Lecția 11 — checkpoint-ul lecției: POST/PUT/DELETE reale pe /api/v1/products,
// doar pentru ADMIN (SecurityConfig, pe backend). Nu mai există o rută PATCH —
// o „editare parțială" se face tot printr-un PUT cu toate câmpurile retrimise.
async function call(baseUrl, method, token, path, payload, headers) {
  const res = await request(joinUrl(baseUrl, path), { method, body: payload, token, headers });
  let data = null;
  try { data = JSON.parse(res.text); } catch (e) { /* ignore, ex. 204 No Content */ }
  let message = null;
  try { message = JSON.parse(res.text).message; } catch (e) { /* ignore */ }
  return { method, ...res, data, message };
}

// Lecția 14 — practică în plus, nemenționată în curriculum: retrimiterea
// aceleiași chei Idempotency-Key (ex. dacă rețeaua eșuează și admin-ul
// apasă "Da" din nou) întoarce produsul deja creat, nu unul al doilea —
// vezi IdempotencyService pe backend.
function newIdempotencyKey() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch (e) { /* ignore, folosim fallback-ul de mai jos */ }
  return "idem-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

export const productCrudApi = {
  newIdempotencyKey,
  create: (baseUrl, token, payload, idempotencyKey) =>
    call(baseUrl, "POST", token, PRODUCTS_PATH, payload, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),
  update: (baseUrl, token, id, payload) => call(baseUrl, "PUT", token, PRODUCTS_PATH + "/" + id, payload),
  remove: (baseUrl, token, id) => call(baseUrl, "DELETE", token, PRODUCTS_PATH + "/" + id),
};
