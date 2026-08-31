import { request, joinUrl } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";

// GET /api/products             -> toate produsele
// GET /api/products?category=2  -> doar produsele din categoria 2
export async function fetchProducts(baseUrl, categoryId) {
  let path = PRODUCTS_PATH;
  if (categoryId != null && categoryId !== "all") {
    path += "?category=" + encodeURIComponent(categoryId);
  }
  const res = await request(joinUrl(baseUrl, path), { method: "GET" });
  if (res.error) throw new Error(res.error);
  if (!res.ok) throw new Error("Backend-ul a răspuns cu " + res.status);
  try {
    return JSON.parse(res.text);
  } catch (e) {
    throw new Error("Răspuns invalid de la backend");
  }
}
