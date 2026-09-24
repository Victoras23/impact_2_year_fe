import { useCallback, useEffect, useState } from "react";
import { Modal, Button } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { fetchProduct } from "../../../entities/product/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import "./ProductDetailsModal.css";

// Lecția 13 — al doilea checkpoint: GET /api/products/{id} e acum cache-uit
// pe backend (Redis, cache separat "product" — vezi CacheConfig). Afișăm
// timpul de încărcare, exact ca la catalog (Lecția 3), ca diferența dintre
// prima cerere (bază de date) și următoarele (cache) să fie vizibilă, nu
// doar afirmată.
export function ProductDetailsModal({ open, onClose, productId }) {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ status: "idle", product: null, error: null, ms: null });

  const load = useCallback(() => {
    if (productId == null) return;
    setState((s) => ({ ...s, status: "loading", error: null }));
    const started = performance.now();
    fetchProduct(baseUrl, productId)
      .then((product) => setState({
        status: "ready", product, error: null,
        ms: Math.round(performance.now() - started),
      }))
      .catch((err) => setState({ status: "error", product: null, error: err.message, ms: null }));
  }, [baseUrl, productId]);

  useEffect(() => {
    if (open) load();
  }, [open, productId, load]);

  return (
    <Modal open={open} onClose={onClose} title="Detalii produs">
      {state.status === "loading" && <p className="product-details__note">Se încarcă…</p>}
      {state.status === "error" && <p className="product-details__note">Eroare: {state.error}</p>}
      {state.status === "ready" && state.product && (
        <div className="product-details">
          <h3>{state.product.name}</h3>
          <p className="product-details__cat">{state.product.category}</p>
          {state.product.description ? <p>{state.product.description}</p> : null}
          <p className="product-details__price">
            {formatPrice(state.product.finalPrice)}
            {state.product.finalPrice !== state.product.price
              ? <span className="product-details__old"> ({formatPrice(state.product.price)})</span>
              : null}
          </p>
          <p className="product-details__stock">{state.product.stock} buc. în stoc</p>
          <div className="product-details__cache">
            <span>Încărcat în <b>{state.ms} ms</b>.</span>
            <Button variant="ghost" size="sm" onClick={load}>Reîncarcă (din cache)</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
