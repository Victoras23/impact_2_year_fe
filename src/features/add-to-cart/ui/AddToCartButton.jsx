import { Button } from "../../../shared/ui/index.js";
import { useCart } from "../../../entities/cart/index.js";

export function AddToCartButton({ product }) {
  const { add } = useCart();
  return (
    <Button variant="dark" size="sm" onClick={() => add(product)}>
      Adaugă în coș
    </Button>
  );
}
