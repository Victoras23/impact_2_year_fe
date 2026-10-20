import { request, joinUrl } from "../../../shared/api/index.js";
import { CATEGORIES_PATH, MQ_PATHS, ORDERS_PATH, PRODUCTS_PATH } from "../../../shared/config/index.js";

// Lecția 21 — gateway-ul spune ce știe Eureka: servicii, instanțe, versiune, ora pornirii.
export const SERVICES_PATH = "/gateway/services";
export const EUREKA_PORT = 8761;

export async function fetchServices(baseUrl) {
  const res = await request(joinUrl(baseUrl, SERVICES_PATH));
  if (res.status === 0) return { kind: "down" };
  if (!res.ok) return { kind: "no-gateway", status: res.status };   // ex. 404: frontendul arată spre monolit, nu spre gateway
  try { return { kind: "ok", services: JSON.parse(res.text) }; } catch { return { kind: "no-gateway", status: res.status }; }
}

// Adresa dashboard-ului Eureka, pe aceeași mașină ca gateway-ul.
export function eurekaUrl(baseUrl) {
  try { const u = new URL(baseUrl); return `${u.protocol}//${u.hostname}:${EUREKA_PORT}`; }
  catch { return `http://localhost:${EUREKA_PORT}`; }
}

// Cererile de probă din panoul 2: unde ajunge fiecare, prin același gateway.
export const TRACE_REQUESTS = [
  { label: "Catalogul", path: PRODUCTS_PATH + "?size=1", expect: "monolith" },
  { label: "Categoriile", path: CATEGORIES_PATH, expect: "monolith" },
  { label: "Profilul meu (JWT)", path: "/api/v1/auth/me", auth: true, expect: "monolith" },
  { label: "Comenzile mele (JWT)", path: ORDERS_PATH, auth: true, expect: "orders" },
  { label: "Cozile RabbitMQ", path: MQ_PATHS.stats, expect: "orders" },
  { label: "Stocul, pe ruta internă", path: "/internal/v1/catalog/products/1/stock", expect: null },
];

export async function trace(baseUrl, item, token) {
  const res = await request(joinUrl(baseUrl, item.path), { token: item.auth ? token : undefined });
  const h = res.headers || {};
  return { ...item, status: res.status, ms: res.ms, route: h["x-gateway-route"] || null, instance: h["x-instance-id"] || null };
}

// Panoul 3 — o „sondă”: un GET simplu, ținând minte doar statusul și instanța.
export async function probe(baseUrl, path) {
  const res = await request(joinUrl(baseUrl, path));
  return { status: res.status, instance: (res.headers || {})["x-instance-id"] || null, at: Date.now() };
}
