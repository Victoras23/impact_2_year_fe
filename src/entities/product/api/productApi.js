import { request, joinUrl } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";

// GET /api/products                          -> toate produsele
// GET /api/products?category=2                -> doar produsele din categoria 2
// GET /api/products?search=laptop              -> căutare după nume (Lecția 12)
// GET /api/products?category=2&search=laptop   -> ambele, combinate
export async function fetchProducts(baseUrl, categoryId, search) {
  const params = new URLSearchParams();
  if (categoryId != null && categoryId !== "all") params.set("category", categoryId);
  if (search != null && search.trim() !== "") params.set("search", search.trim());
  const query = params.toString();
  const path = PRODUCTS_PATH + (query ? "?" + query : "");
  const res = await request(joinUrl(baseUrl, path), { method: "GET" });
  if (res.error) throw new Error(res.error);
  if (!res.ok) throw new Error("Backend-ul a răspuns cu " + res.status);
  try {
    return JSON.parse(res.text);
  } catch (e) {
    throw new Error("Răspuns invalid de la backend");
  }
}
