import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE } from "../../../shared/config/index.js";
import { readJson, writeJson } from "../../../shared/lib/index.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readJson(STORAGE.cart, []));
  useEffect(() => { writeJson(STORAGE.cart, items); }, [items]);

  const api = useMemo(() => ({
    items,
    add(product, qty = 1) {
      setItems((prev) => {
        const found = prev.find((i) => i.id === product.id);
        if (found) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
        return [...prev, { id: product.id, name: product.name, price: product.price, qty }];
      });
    },
    setQty(id, qty) {
      setItems((prev) => qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => i.id === id ? { ...i, qty } : i));
    },
    remove(id) { setItems((prev) => prev.filter((i) => i.id !== id)); },
    clear() { setItems([]); },
  }), [items]);

  const derived = useMemo(() => ({
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items]);

  return <CartContext.Provider value={{ ...api, ...derived }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
