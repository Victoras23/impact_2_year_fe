import { ProductCard } from "../../../entities/product/index.js";
import { AddToCartButton } from "../../../features/add-to-cart/index.js";
import "./ProductGrid.css";

export function ProductGrid({ products }) {
  if (!products.length) {
    return <p className="product-grid__empty">Catalogul este gol.</p>;
  }
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} actions={<AddToCartButton product={p} />} />
      ))}
    </div>
  );
}
