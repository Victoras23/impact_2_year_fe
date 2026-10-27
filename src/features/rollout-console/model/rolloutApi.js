import { request, joinUrl } from "../../../shared/api/index.js";
import { CATEGORIES_PATH } from "../../../shared/config/index.js";

// Lecția 24 — clusterul kind: gateway-ul pe 8080, monolitul direct pe 8081 (k8s/kind-config.yaml).
export const GATEWAY_BASE = "http://localhost:8080";
export const MONOLITH_BASE = "http://localhost:8081";
const INFO = "/api/v1/cluster/info";

function parse(res) {
  try { return JSON.parse(res.text); } catch { return null; }
}

// close=true → monolitul răspunde cu „Connection: close”: browserul deschide o conexiune nouă
// pentru cererea următoare, iar Service-ul alege din nou podul.
export async function fetchPod(baseUrl, close) {
  const res = await request(joinUrl(baseUrl, INFO + (close ? "?close=true" : "")));
  if (!res.ok) return { ok: false, status: res.status };
  const d = parse(res);
  return { ok: true, pod: d.podName, version: d.version, readiness: d.readiness, liveness: d.liveness, startedAt: d.startedAt };
}

// /actuator/info nu trece prin rate limiting (Lecția 16) — de aceea îl folosim pentru urmărirea la 4 cereri/s.
export async function fetchActuatorInfo() {
  const res = await request(joinUrl(MONOLITH_BASE, "/actuator/info"));
  if (!res.ok) return { ok: false, status: res.status, ms: res.ms };
  const d = parse(res) || {};
  return { ok: true, pod: (res.headers || {})["x-instance-id"] || "?", version: d.version, ms: res.ms };
}

export async function pauseReadiness(baseUrl, token, seconds) {
  const res = await request(joinUrl(baseUrl, `/api/v1/cluster/readiness/pause?seconds=${seconds}`), { method: "POST", token });
  return { status: res.status, body: parse(res) };
}

export async function breakLiveness(baseUrl, token) {
  const res = await request(joinUrl(baseUrl, "/api/v1/cluster/liveness/break"), { method: "POST", token });
  return { status: res.status, body: parse(res) };
}

// Panoul 4 — tot magazinul prin gateway: catalogul (monolit), comenzile (orders-service), cine e în spate.
export async function checkSystem() {
  const one = async (label, path) => {
    const res = await request(joinUrl(GATEWAY_BASE, path));
    return { label, path, status: res.status, route: (res.headers || {})["x-gateway-route"] || "", body: parse(res) };
  };
  return Promise.all([
    one("catalog (monolit)", CATEGORIES_PATH),
    one("comenzi (orders-service)", "/api/v1/resilience/stats"),
    one("cine e în spatele gateway-ului", "/gateway/services"),
  ]);
}
