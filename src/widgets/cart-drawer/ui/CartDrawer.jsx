import { useState } from "react";
import { Drawer, Button } from "../../../shared/ui/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import { useCart } from "../../../entities/cart/index.js";
import "./CartDrawer.css";

export function CartDrawer({ open, onClose }) {
  const { items, setQty, remove, clear, total, count } = useCart();
  const [placed, setPlaced] = useState(false);

  const footer = (
    <div className="cart-foot">
      <div className="cart-foot__row"><span>Total</span><b>{formatPrice(total)}</b></div>
      {placed
        ? <p className="cart-foot__ok">Comandă înregistrată local. (În Lecția 2 o vom trimite la backend.)</p>
        : <Button className="cart-foot__cta" disabled={!count}
                  onClick={() => { setPlaced(true); clear(); }}>Finalizează comanda</Button>}
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} title={`Coș (${count})`} footer={footer}>
      {items.length === 0
        ? <p className="cart-empty">Coșul este gol.</p>
        : (
          <ul className="cart-list">
            {items.map((i) => (
              <li key={i.id} className="cart-item">
                <div className="cart-item__info">
                  <span className="cart-item__name">{i.name}</span>
                  <span className="cart-item__price">{formatPrice(i.price)}</span>
                </div>
                <div className="cart-item__qty">
                  <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                </div>
                <button className="cart-item__rm" onClick={() => remove(i.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
    </Drawer>
  );
}
