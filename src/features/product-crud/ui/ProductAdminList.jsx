import { formatPrice } from "../../../shared/lib/index.js";
import { ProductAdminActions } from "./ProductAdminActions.jsx";
import "./ProductAdminList.css";

// Listă compactă pentru administrare: un rând per produs, cu „Editează" (deschide
// modalul din StorePage) și „Șterge" (confirmare inline) — aceleași produse pe
// care le vede catalogul de mai sus.
export function ProductAdminList({ products, token, onEdit, onChanged }) {
  if (!products.length) {
    return <p className="admin-list__empty">Niciun produs. Adăugați unul cu butonul de mai sus.</p>;
  }
  return (
    <ul className="admin-list">
      {products.map((p) => (
        <li key={p.id} className="admin-list__row">
          <div className="admin-list__main">
            <span className="admin-list__name">{p.name}</span>
            <span className="admin-list__meta">
              #{p.id} · {p.category} · {formatPrice(p.price)} · {p.stock} buc.
              {p.discountPercentage != null ? <> · <b>-{p.discountPercentage}%</b> ({formatPrice(p.finalPrice)})</> : null}
            </span>
          </div>
          <ProductAdminActions product={p} token={token} onEdit={onEdit} onChanged={onChanged} />
        </li>
      ))}
    </ul>
  );
}
