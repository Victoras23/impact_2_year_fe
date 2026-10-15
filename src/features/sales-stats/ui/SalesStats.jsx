import { useCallback, useEffect, useState } from "react";
import { Button, Badge } from "../../../shared/ui/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { fetchSalesSummary } from "../../../entities/analytics/index.js";
import { ORDERS_CHANGED } from "../../../entities/order/index.js";
import "./SalesStats.css";

// Lecția 19 — „Statistici vânzări”: tot ce vezi aici a fost construit de handler-ul
// „analytics” DOAR din evenimentele Kafka — nu din tabelele orders / products.
export function SalesStats() {
  const { baseUrl } = useApiBase();
  const { token, session } = useSession();
  const isAdmin = !!session && session.role === "ADMIN";
  const [state, setState] = useState({ kind: "idle" });

  const load = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetchSalesSummary(baseUrl, token);
    setState(res.ok ? { kind: "done", data: res.data, ms: res.ms } : { kind: "error", status: res.status });
  }, [baseUrl, token, isAdmin]);

  useEffect(() => { load(); }, [load]);
  // după o comandă nouă, handler-ul are nevoie de o clipă — reîncărcăm după 3 s
  useEffect(() => {
    const onChange = () => setTimeout(load, 3000);
    window.addEventListener(ORDERS_CHANGED, onChange);
    return () => window.removeEventListener(ORDERS_CHANGED, onChange);
  }, [load]);

  if (!isAdmin) {
    return <p className="store__note">Autentifică-te ca admin (<code>admin@impact.md</code> / <code>admin123</code>) ca să vezi statisticile.</p>;
  }
  if (state.kind === "error") {
    return <p className="store__note">Statisticile nu s-au putut încărca (status {state.status || "—"}). <Button size="sm" onClick={load}>Reîncearcă</Button></p>;
  }
  if (state.kind !== "done") return <p className="store__note">Se încarcă…</p>;
  const d = state.data;
  return (
    <div className="stats">
      <div className="stats__bar">
        {d.paused ? <Badge tone="bad">handler oprit — evenimentele se adună în Kafka</Badge> : <Badge tone="ok">handler activ</Badge>}
        <Button size="sm" variant="ghost" onClick={load}>Reîncarcă</Button>
      </div>
      <div className="stats__cards">
        <div className="stats__card"><span>Comenzi plasate</span><b>{d.ordersPlaced}</b></div>
        <div className="stats__card"><span>Confirmate</span><b>{d.ordersConfirmed}</b></div>
        <div className="stats__card"><span>Respinse</span><b>{d.ordersRejected}</b></div>
        <div className="stats__card"><span>Vânzări</span><b>{formatPrice(d.revenue)}</b></div>
      </div>
      <div className="stats__grid">
        <div>
          <h4>Top produse</h4>
          {d.topProducts.length === 0 ? <p className="store__note">Nicio vânzare încă.</p> : (
            <table className="stats__table">
              <thead><tr><th>Produs</th><th>Bucăți</th><th>Vânzări</th></tr></thead>
              <tbody>{d.topProducts.map((p) => (
                <tr key={p.productId}><td>{p.name}</td><td>{p.unitsSold}</td><td>{formatPrice(p.revenue)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div>
          <h4>Alerte de stoc (≤ 5)</h4>
          {d.stockAlerts.length === 0 ? <p className="store__note">Nicio alertă.</p> : (
            <ul className="stats__alerts">{d.stockAlerts.map((a, i) => (
              <li key={i}><b>{a.name}</b> — mai sunt {a.stock}</li>
            ))}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
