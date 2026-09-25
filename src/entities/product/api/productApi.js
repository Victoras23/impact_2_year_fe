import { request, joinUrl } from "../../../shared/api/index.js";
import { DEFAULT_PAGE_SIZE, PRODUCTS_PATH } from "../../../shared/config/index.js";

// GET /api/v1/products/{id} -> un singur produs (Lecția 13 — acum cache-uit pe backend)
export async function fetchProduct(baseUrl, id) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "/" + id), { method: "GET" });
  if (res.error) throw new Error(res.error);
  if (!res.ok) throw new Error("Backend-ul a răspuns cu " + res.status);
  try {
    return JSON.parse(res.text);
  } catch (e) {
    throw new Error("Răspuns invalid de la backend");
  }
}

// GET /api/v1/products                                -> pagina 0, toate produsele
// GET /api/v1/products?category=2                      -> doar produsele din categoria 2
// GET /api/v1/products?search=laptop                    -> căutare după nume (Lecția 12)
// GET /api/v1/products?category=2&search=laptop         -> ambele, combinate
// GET /api/v1/products?page=1&size=5&sort=price,desc    -> paginare + sortare (Lecția 14)
//
// Lecția 14 — răspunsul nu mai e un tablou brut, ci plicul de paginare
// {content, page, size, totalElements, totalPages} — vezi PageResponse pe
// backend. Întoarcem plicul întreg, nu doar `content`, ca StorePage să poată
// arăta controalele de paginare (pagina curentă, are sens un "Următoarea"?).
export async function fetchProducts(baseUrl, categoryId, search, { page = 0, size = DEFAULT_PAGE_SIZE, sort } = {}) {
  const params = new URLSearchParams();
  if (categoryId != null && categoryId !== "all") params.set("category", categoryId);
  if (search != null && search.trim() !== "") params.set("search", search.trim());
  params.set("page", String(page));
  params.set("size", String(size));
  if (sort) params.set("sort", sort);
  const path = PRODUCTS_PATH + "?" + params.toString();
  const res = await request(joinUrl(baseUrl, path), { method: "GET" });
  if (res.error) throw new Error(res.error);
  if (!res.ok) throw new Error("Backend-ul a răspuns cu " + res.status);
  try {
    return JSON.parse(res.text);
  } catch (e) {
    throw new Error("Răspuns invalid de la backend");
  }
}
