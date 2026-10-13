import { useState } from "react";
import { Drawer, Button } from "../../../shared/ui/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { useCart } from "../../../entities/cart/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { useSession } from "../../../entities/session/index.js";
import { placeOrder, notifyOrdersChanged } from "../../../entities/order/index.js";
import "./CartDrawer.css";

export function CartDrawer({ open, onClose }) {
  const { items, setQty, remove, clear, total, count } = useCart();
  const { shows } = useLesson();
  const { token, isAuthed } = useSession();
  const { baseUrl } = useApiBase();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const realOrders = shows("orders");

  // Lecția 18 — comanda pleacă la backend. Răspunsul vine imediat (202 + PENDING):
  // confirmarea o face consumatorul RabbitMQ, în fundal — urmărește-o în „Comenzile mele”.
  async function checkout() {
    if (!realOrders) { setResult({ kind: "local" }); clear(); return; }
    setBusy(true);
    const res = await placeOrder(baseUrl, token, items);
    setBusy(false);
    if (res.status === 202) {
      setResult({ kind: "ok", order: res.data, ms: res.ms });
      clear();
      notifyOrdersChanged();
    } else {
      setResult({ kind: "error", status: res.status, message: (res.data && res.data.message) || "backend-ul nu răspunde" });
    }
  }

  const footer = (
    <div className="cart-foot">
      <div className="cart-foot__row"><span>Total</span><b>{formatPrice(total)}</b></div>
      {result && result.kind === "local" && <p className="cart-foot__ok">Comandă înregistrată local.</p>}
      {result && result.kind === "ok" && (
        <p className="cart-foot__ok">
          Comanda #{result.order.id} a fost primită în {result.ms} ms — status <b>{result.order.status}</b>.
          Confirmarea vine din RabbitMQ: urmărește-o în „Comenzile mele”.
        </p>
      )}
      {result && result.kind === "error" && (
        <p className="cart-foot__err">Eroare {result.status || ""}: {result.message}</p>
      )}
      {realOrders && !isAuthed
        ? <p className="cart-foot__hint">Autentifică-te (dreapta sus) ca să plasezi comanda.</p>
        : <Button className="cart-foot__cta" disabled={!count || busy} onClick={checkout}>
            {busy ? "Se trimite…" : realOrders ? "Plasează comanda" : "Finalizează comanda"}
          </Button>}
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
