import { request, joinUrl } from "../../../shared/api/index.js";
import { CATEGORIES_PATH } from "../../../shared/config/index.js";

// GET /api/categories -> lista de categorii din baza de date.
export async function fetchCategories(baseUrl) {
  const res = await request(joinUrl(baseUrl, CATEGORIES_PATH), { method: "GET" });
  if (res.error) throw new Error(res.error);
  if (!res.ok) throw new Error("Backend-ul a răspuns cu " + res.status);
  try {
    return JSON.parse(res.text);
  } catch (e) {
    throw new Error("Răspuns invalid de la backend");
  }
}
