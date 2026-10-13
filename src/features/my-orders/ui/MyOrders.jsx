import { Button } from "../../../shared/ui/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import { OrderStatusBadge } from "../../../entities/order/index.js";
import { useMyOrders, secondsBetween } from "../model/useMyOrders.js";
import "./MyOrders.css";

// Lecția 18 — „Comenzile mele”: statusul trece din PENDING în CONFIRMED / REJECTED
// fără ca tu să faci ceva — îl schimbă consumatorul RabbitMQ.
export function MyOrders() {
  const { state, reload, polling } = useMyOrders();
  if (state.kind === "anon") {
    return <p className="store__note">Autentifică-te (<code>user@impact.md</code> / <code>user123</code>) ca să-ți vezi comenzile.</p>;
  }
  if (state.kind === "error") {
    return <p className="store__note">Comenzile nu s-au putut încărca (status {state.status || "—"}). <Button size="sm" onClick={reload}>Reîncearcă</Button></p>;
  }
  if (!state.orders.length) {
    return <p className="store__note">Nicio comandă încă. Adaugă produse în coș și apasă „Plasează comanda”.</p>;
  }
  return (
    <div className="orders">
      <div className="orders__bar">
        <span>{polling ? "Se actualizează automat cât timp există comenzi în procesare…" : "Toate comenzile au fost procesate."}</span>
        <Button size="sm" variant="ghost" onClick={reload}>Reîncarcă</Button>
      </div>
      <table className="orders__table">
        <thead>
          <tr><th>#</th><th>Produse</th><th>Total</th><th>Status</th><th>Procesată de</th><th>Durata</th><th>Email</th></tr>
        </thead>
        <tbody>
          {state.orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
              <td>{formatPrice(o.total)}</td>
              <td>
                <OrderStatusBadge status={o.status} />
                {o.failureReason && <div className="orders__reason">{o.failureReason}</div>}
              </td>
              <td>{o.processedBy || "—"}</td>
              <td>{o.confirmedAt ? `${secondsBetween(o.createdAt, o.confirmedAt)} s` : "…"}</td>
              <td>{o.notifiedAt ? "✓ trimis" : "…"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
