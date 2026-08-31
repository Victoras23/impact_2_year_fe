import { formatPrice } from "../../../shared/lib/index.js";
import { Card, Badge } from "../../../shared/ui/index.js";
import "./ProductCard.css";

// Card de produs "prezentațional": nu conține logică, primește acțiuni prin `actions`.
export function ProductCard({ product, actions }) {
  const initials = product.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <Card className="product-card">
      <div className="product-card__media" data-letters={initials}>
        <span>{initials}</span>
        {product.stock <= 15 ? <Badge tone="bad" className="product-card__stock">stoc redus</Badge> : null}
      </div>
      <div className="product-card__body">
        <span className="product-card__cat">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <span className="product-card__stockn">{product.stock} buc.</span>
        </div>
        {actions ? <div className="product-card__actions">{actions}</div> : null}
      </div>
    </Card>
  );
}
