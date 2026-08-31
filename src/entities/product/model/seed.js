import { makeProduct } from "./product.js";

// Catalog de start. În lecțiile următoare va veni din backend (GET /api/products).
export const seedProducts = [
  makeProduct({ id: 1, name: "Tricou Impact",        category: "Îmbrăcăminte", price: 199,  stock: 40 }),
  makeProduct({ id: 2, name: "Hanorac cu glugă",     category: "Îmbrăcăminte", price: 499,  stock: 18 }),
  makeProduct({ id: 3, name: "Cană de cafea",        category: "Accesorii",    price: 129,  stock: 75 }),
  makeProduct({ id: 4, name: "Rucsac pentru laptop", category: "Accesorii",    price: 899,  stock: 12 }),
  makeProduct({ id: 5, name: "Set autocolante",      category: "Accesorii",    price: 49,   stock: 200 }),
  makeProduct({ id: 6, name: "Șapcă snapback",       category: "Îmbrăcăminte", price: 179,  stock: 33 }),
];
