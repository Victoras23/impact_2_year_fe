import { formatPrice } from "../../../shared/lib/index.js";
import { ProductAdminActions } from "./ProductAdminActions.jsx";
import "./ProductAdminList.css";

// Listă compactă pentru administrare: un rând per produs, cu acțiunile HTTP.
export function ProductAdminList({ products, onReplace, onPatch, onRemove }) {
  if (!products.length) {
    return <p className="admin-list__empty">Niciun produs. Adăugați unul cu formularul din stânga.</p>;
  }
  return (
    <ul className="admin-list">
      {products.map((p) => (
        <li key={p.id} className="admin-list__row">
          <div className="admin-list__main">
            <span className="admin-list__name">{p.name}</span>
            <span className="admin-list__meta">#{p.id} · {p.category} · {formatPrice(p.price)} · {p.stock} buc.</span>
          </div>
          <ProductAdminActions product={p} onReplace={onReplace} onPatch={onPatch} onRemove={onRemove} />
        </li>
      ))}
    </ul>
  );
}
