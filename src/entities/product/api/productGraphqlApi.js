import { graphqlRequest } from "../../../shared/api/index.js";
import { DEFAULT_PAGE_SIZE } from "../../../shared/config/index.js";

// Lecția 15 — exact câmpurile de care are nevoie ProductCard + formularul de
// administrare, nimic în plus. Cu REST primim mereu TOT ce decide serverul
// (inclusiv `description`, `links`...); aici cerem doar ce afișăm.
export const CATALOG_QUERY = `query Catalog($categoryId: ID, $search: String, $page: Int, $size: Int,
                $sortBy: ProductSortField, $direction: SortDirection) {
  products(categoryId: $categoryId, search: $search, page: $page, size: $size,
           sortBy: $sortBy, direction: $direction) {
    content {
      id name price finalPrice stock discountPercentage
      category { id name }
    }
    page size totalElements totalPages
  }
}`;

// "price,desc" (formatul REST din Lecția 14) -> { sortBy: "PRICE", direction: "DESC" }
export function toGraphqlSort(sort) {
  if (!sort) return {};
  const [field, dir] = sort.split(",");
  return { sortBy: field.trim().toUpperCase(), direction: (dir || "asc").trim().toUpperCase() };
}

// GraphQL întoarce `id: ID` ca șir ("1") și categoria ca obiect. Restul
// aplicației (coș, admin, ProductCard) a fost scris pe forma REST, deci o
// readucem la ea aici, într-un singur loc — StorePage nici nu știe ce
// protocol a fost folosit.
function toRestShape(p) {
  return {
    ...p,
    id: Number(p.id),
    category: p.category ? p.category.name : null,
    categoryId: p.category ? Number(p.category.id) : null,
  };
}

// Aceeași semnătură și același plic {content, page, size, totalElements,
// totalPages} ca fetchProducts (REST) — pot fi schimbate între ele.
export async function fetchProductsGraphQL(baseUrl, categoryId, search, { page = 0, size = DEFAULT_PAGE_SIZE, sort } = {}) {
  const variables = { page, size, ...toGraphqlSort(sort) };
  if (categoryId != null && categoryId !== "all") variables.categoryId = String(categoryId);
  if (search != null && search.trim() !== "") variables.search = search.trim();
  const res = await graphqlRequest(baseUrl, CATALOG_QUERY, { variables });
  if (res.error) throw new Error(res.error);
  if (!res.ok) {
    throw new Error(res.errors.length ? res.errors[0].message : "Backend-ul a răspuns cu " + res.status);
  }
  const pageResponse = res.data.products;
  return { ...pageResponse, content: pageResponse.content.map(toRestShape) };
}
