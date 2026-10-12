// Lecția 15 — câmpurile pe care elevul le poate bifa în consolă. Fiecare
// corespunde unui câmp din `type Product` (schema.graphqls pe backend).
export const PRODUCT_FIELDS = [
  { key: "id", label: "id" },
  { key: "name", label: "name" },
  { key: "price", label: "price" },
  { key: "finalPrice", label: "finalPrice" },
  { key: "stock", label: "stock" },
  { key: "description", label: "description" },
  { key: "discountPercentage", label: "discountPercentage" },
  { key: "category", label: "category { name }", selection: "category { name }" },
];

export const DEFAULT_FIELDS = ["name", "finalPrice"];

// Construiește textul query-ului exact cum l-ar scrie un om — consola îl
// afișează, deci trebuie să fie lizibil, nu doar valid.
export function buildProductsQuery(fieldKeys, size) {
  const selection = PRODUCT_FIELDS
    .filter((f) => fieldKeys.includes(f.key))
    .map((f) => f.selection || f.key)
    .join("\n      ");
  return `{
  products(size: ${size}) {
    content {
      ${selection || "id"}
    }
  }
}`;
}

// Ecranul „Categorii cu produse”: totul dintr-un singur query.
export const CATEGORY_SCREEN_QUERY = `{
  categories {
    id
    name
    products { name finalPrice }
  }
}`;

// Un query rău-intenționat: ciclul Product.category -> Category.products,
// repetat. Adâncime 9 — backend-ul acceptă maxim 6 (GraphQlConfig).
export const DEPTH_BOMB_QUERY = `{
  categories { products { category { products { category {
    products { category { products { name } } }
  } } } } }
}`;
