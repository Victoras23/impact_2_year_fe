import { formatPrice } from "../../../shared/lib/index.js";
import { Card, Badge } from "../../../shared/ui/index.js";
import "./ProductCard.css";

// Card de produs "prezentațional": nu conține logică, primește acțiuni prin `actions`.
export function ProductCard({ product, actions }) {
  const initials = product.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  // Lecția 5: finalPrice vine din backend (Strategy pattern — DiscountService).
  // Lipsește la produsele locale de administrare, care nu trec prin backend.
  const hasDiscount = product.finalPrice != null && Number(product.finalPrice) < Number(product.price);
  return (
    <Card className="product-card">
      <div className="product-card__media" data-letters={initials}>
        <span>{initials}</span>
        {product.stock <= 15 ? <Badge tone="bad" className="product-card__stock">stoc redus</Badge> : null}
        {hasDiscount ? <Badge tone="accent" className="product-card__discount">reducere</Badge> : null}
      </div>
      <div className="product-card__body">
        <span className="product-card__cat">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__row">
          {hasDiscount ? (
            <span className="product-card__price">
              <span className="product-card__price--old">{formatPrice(product.price)}</span>
              <span className="product-card__price--new">{formatPrice(product.finalPrice)}</span>
            </span>
          ) : (
            <span className="product-card__price">{formatPrice(product.price)}</span>
          )}
          <span className="product-card__stockn">{product.stock} buc.</span>
        </div>
        {actions ? <div className="product-card__actions">{actions}</div> : null}
      </div>
    </Card>
  );
}
