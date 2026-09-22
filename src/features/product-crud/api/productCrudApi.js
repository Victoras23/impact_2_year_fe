import { request, joinUrl } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";

// Lecția 11 — checkpoint-ul lecției: POST/PUT/DELETE reale pe /api/products,
// doar pentru ADMIN (SecurityConfig, pe backend). Nu mai există o rută PATCH —
// o „editare parțială" se face tot printr-un PUT cu toate câmpurile retrimise.
async function call(baseUrl, method, token, path, payload) {
  const res = await request(joinUrl(baseUrl, path), { method, body: payload, token });
  let data = null;
  try { data = JSON.parse(res.text); } catch (e) { /* ignore, ex. 204 No Content */ }
  let message = null;
  try { message = JSON.parse(res.text).message; } catch (e) { /* ignore */ }
  return { method, ...res, data, message };
}

export const productCrudApi = {
  create: (baseUrl, token, payload) => call(baseUrl, "POST", token, PRODUCTS_PATH, payload),
  update: (baseUrl, token, id, payload) => call(baseUrl, "PUT", token, PRODUCTS_PATH + "/" + id, payload),
  remove: (baseUrl, token, id) => call(baseUrl, "DELETE", token, PRODUCTS_PATH + "/" + id),
};
