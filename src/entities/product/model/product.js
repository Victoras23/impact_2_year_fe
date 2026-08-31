let seq = 1000;

// Creează un obiect produs cu valori implicite sigure.
export function makeProduct(input = {}) {
  return {
    id: input.id ?? ++seq,
    name: input.name ?? "Produs nou",
    category: input.category ?? "General",
    price: Number(input.price ?? 0),
    stock: Number(input.stock ?? 0),
  };
}
