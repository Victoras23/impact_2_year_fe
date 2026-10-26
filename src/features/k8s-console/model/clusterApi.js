import { request, joinUrl } from "../../../shared/api/index.js";
import { CACHE_CLEAR_PATH, PRODUCTS_PATH } from "../../../shared/config/index.js";

// Lecția 23 — monolitul din clusterul kind: ce pod răspunde și de unde vine configurația lui.
export const CLUSTER_INFO_PATH = "/api/v1/cluster/info";
// NodePort-ul 30081, legat de localhost:8081 în k8s/kind-config.yaml (impact_2_year_infra).
export const CLUSTER_API_BASE = "http://localhost:8081";

function parse(res) {
  try { return JSON.parse(res.text); } catch { return null; }
}

export async function fetchClusterInfo(baseUrl) {
  const res = await request(joinUrl(baseUrl, CLUSTER_INFO_PATH));
  if (res.status === 0) return { kind: "down", at: Date.now() };
  if (!res.ok) return { kind: "error", status: res.status, at: Date.now() };
  return { kind: "ok", data: parse(res), at: Date.now() };
}

// Produsele din categoria cu reducere — ca să vedem prețul final după o schimbare în ConfigMap.
export async function fetchCategoryPrices(baseUrl, categoryName) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "?size=50&sort=id,asc"));
  const body = parse(res);
  if (!res.ok || !body) return null;
  return body.content.filter((p) => !categoryName || (p.category || "").toLowerCase() === categoryName.toLowerCase());
}

export async function clearCache(baseUrl) {
  const res = await request(joinUrl(baseUrl, CACHE_CLEAR_PATH), { method: "POST" });
  return res.ok;
}
