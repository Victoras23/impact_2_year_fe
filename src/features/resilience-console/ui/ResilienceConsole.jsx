import { useEffect, useState } from "react";
import { Badge, Button, Card } from "../../../shared/ui/index.js";
import { BURST, useBurst, useDlqReplay, useOutboxOrder, useResilienceStats, useSagaDemo } from "../model/useResilienceConsole.js";
import "./ResilienceConsole.css";

// Lecția 22 — consola „Reziliență”: circuit breaker + retry, Saga (stocul care revine),
// outbox (mesaje care nu se mai pierd) și reluarea DLQ. Totul real, prin gateway.
export function ResilienceConsole() {
  const stats = useResilienceStats();
  return (
    <Card className="res">
      <div className="res__head">
        <h3>Consolă reziliență</h3>
        <Button size="sm" variant="ghost" onClick={() => stats.setLive(!stats.live)}>
          {stats.live ? "Pauză" : "Pornește"}
        </Button>
      </div>
      <BreakerPanel stats={stats} />
      <BurstPanel />
      <SagaPanel />
      <OutboxPanel stats={stats} />
      <DlqPanel queues={stats.queues} />
    </Card>
  );
}

function PanelHead({ step, title, children }) {
  return (
    <div className="res__panel-head">
      <span className="res__step">{step}</span>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

const STATE_TONE = { CLOSED: "ok", OPEN: "bad", HALF_OPEN: "accent" };
const STATE_TEXT = { CLOSED: "CLOSED — cererile trec", OPEN: "OPEN — cererile sunt oprite", HALF_OPEN: "HALF_OPEN — probă" };

function BreakerPanel({ stats }) {
  const { state } = stats;
  const data = state.kind === "ok" ? state.data : null;
  const cb = data && data.circuitBreakers.find((b) => b.name === "monolith");
  const retry = data && data.retries.find((r) => r.name === "monolith");
  return (
    <section className="res__panel">
      <PanelHead step="1" title="Circuitul spre monolit (live, la 1 s)" />
      {state.kind === "down" && <p className="res__hint res__hint--bad">Gateway-ul nu răspunde. Pornește sistemul din impact_2_year_infra.</p>}
      {state.kind === "error" && (
        <p className="res__hint res__hint--bad">
          {state.status === 404
            ? <>Răspuns 404: gateway-ul sau serviciul de comenzi nu are încă Lecția 22 — <code>docker compose up -d --build orders-service gateway</code>.</>
            : <>Răspuns {state.status}: lipsesc tabelele Lecției 22? Rulează din impact_2_year_infra{" "}
                <code>docker/migrations/lesson-22-outbox.sql</code> (orders-db) și{" "}
                <code>lesson-22-stock-reservations.sql</code> (postgres).</>}
        </p>
      )}
      {data && !cb && <p className="res__hint">Circuitul apare după primul apel spre monolit — plasează o comandă.</p>}
      {cb && (
        <div className="res__breaker">
          <Badge tone={STATE_TONE[cb.state] || "neutral"}>{STATE_TEXT[cb.state] || cb.state}</Badge>
          <span>eșecuri: <b>{cb.failureRate < 0 ? "—" : cb.failureRate.toFixed(0) + "%"}</b> din {cb.bufferedCalls} apeluri</span>
          <span>refuzate rapid: <b>{cb.notPermittedCalls}</b></span>
          {retry && <span>reușite după retry: <b>{retry.successfulWithRetry}</b> · eșuate după retry: <b>{retry.failedWithRetry}</b></span>}
        </div>
      )}
      <p className="res__hint">
        Oprește monolitul (<code>docker compose stop monolith</code>) și trimite rafala de mai jos. Circuitul se deschide
        după ~5 eșecuri; după 10 s lasă două cereri de probă (HALF_OPEN). Pornește-l din nou cu{" "}
        <code>docker compose start monolith</code>.
      </p>
    </section>
  );
}

function BurstPanel() {
  const { cells, busy, run } = useBurst();
  const [productId, setProductId] = useState(1);
  const done = cells.filter((c) => !c.skipped);
  const slow = done.filter((c) => c.ms >= 300);
  const fast = done.filter((c) => c.open);
  return (
    <section className="res__panel">
      <PanelHead step="2" title={`Rafală: ${BURST} comenzi, una după alta`}>
        <label className="res__inline">produs #
          <input type="number" min="1" value={productId} onChange={(e) => setProductId(Number(e.target.value) || 1)} />
        </label>
        <Button size="sm" onClick={() => run(productId)} disabled={busy}>{busy ? "Trimite…" : "Trimite"}</Button>
      </PanelHead>
      {cells.length > 0 && cells[0].skipped && <p className="res__hint res__hint--bad">Autentifică-te: comenzile cer un cont.</p>}
      {done.length > 0 && (
        <>
          <div className="res__bars">
            {done.map((c, i) => (
              <div key={i} className={"res__bar " + (c.status < 300 ? "is-ok" : c.open ? "is-open" : "is-err")}
                   title={`${c.status} · ${c.ms} ms`}>
                <span style={{ height: Math.min(100, 6 + c.ms / 15) + "%" }} />
                <em>{c.ms}</em>
              </div>
            ))}
          </div>
          <p className="res__verdict">
            {fast.length > 0
              ? <>Lente (retry + timeouts): <b>{slow.length}</b>. Refuzate imediat de circuit: <b>{fast.length}</b> — 503 cu Retry-After: {fast[0].retryAfter || "10"} s.</>
              : <>Toate au trecut prin monolit ({done.filter((c) => c.status < 300).length} OK). Oprește monolitul și încearcă din nou.</>}
          </p>
        </>
      )}
    </section>
  );
}

function SagaPanel() {
  const { products, loadProducts, state, run } = useSagaDemo();
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  useEffect(() => {
    if (products && products.length > 1 && !a) { setA(products[0]); setB(products[1]); }
  }, [products, a]);
  return (
    <section className="res__panel">
      <PanelHead step="3" title="Saga: stocul care revine">
        {!products && <Button size="sm" variant="ghost" onClick={loadProducts}>Încarcă produsele</Button>}
        {a && b && <Button size="sm" onClick={() => run(a, b)} disabled={state.kind === "running"}>Comandă respinsă</Button>}
      </PanelHead>
      <p className="res__hint">
        O comandă cu două linii: 1 × <b>{a ? a.name : "primul produs"}</b> și mai mult decât e în stoc din{" "}
        <b>{b ? b.name : "al doilea"}</b>. Prima linie se rezervă în catalog, a doua nu → REJECTED. Lecția 21: stocul primei
        linii rămânea scăzut. Acum compensarea (outbox → coada <code>order.stock-release</code>) îl pune înapoi.
      </p>
      {products && products.length > 1 && (
        <div className="res__pick">
          <ProductSelect label="linia 1" products={products} value={a} onChange={setA} />
          <ProductSelect label="linia 2 (prea multe)" products={products} value={b} onChange={setB} />
        </div>
      )}
      {state.kind === "login" && <p className="res__hint res__hint--bad">Autentifică-te: comenzile cer un cont.</p>}
      {state.kind === "error" && <p className="res__hint res__hint--bad">Comanda: {state.status} {state.message || ""}</p>}
      {state.points.length > 0 && (
        <table className="res__table">
          <thead><tr><th>Moment</th><th>Stoc „{a && a.name}”</th><th>După</th></tr></thead>
          <tbody>
            {state.points.map((p, i) => (
              <tr key={i}><td>{p.label}</td><td><b>{p.stock}</b></td><td>{p.t} ms</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {state.kind === "done" && <p className="res__verdict res__good">Stocul a revenit — consistență eventuală, nu în aceeași tranzacție.</p>}
      {state.kind === "waiting" && <p className="res__verdict res__bad">Stocul n-a revenit în 10 s: monolitul sau RabbitMQ e oprit? Mesajul așteaptă în outbox / DLQ.</p>}
    </section>
  );
}

function ProductSelect({ label, products, value, onChange }) {
  return (
    <label className="res__inline">{label}
      <select value={value ? value.id : ""} onChange={(e) => onChange(products.find((p) => p.id === Number(e.target.value)))}>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stoc {p.stock})</option>)}
      </select>
    </label>
  );
}

function OutboxPanel({ stats }) {
  const data = stats.state.kind === "ok" ? stats.state.data : null;
  const { state, run } = useOutboxOrder();
  const [productId, setProductId] = useState(1);
  return (
    <section className="res__panel">
      <PanelHead step="4" title="Outbox: mesajul nu se mai pierde">
        <label className="res__inline">produs #
          <input type="number" min="1" value={productId} onChange={(e) => setProductId(Number(e.target.value) || 1)} />
        </label>
        <Button size="sm" onClick={() => run(productId)} disabled={state.kind === "pending"}>Comandă asincronă</Button>
      </PanelHead>
      <p className="res__hint">
        Oprește RabbitMQ (<code>docker compose stop rabbitmq</code>) și plasează o comandă: rămâne PENDING, iar mesajul ei
        așteaptă în outbox. Pornește RabbitMQ (<code>docker compose start rabbitmq</code>) — releul îl trimite singur.
      </p>
      {data && (
        <p className="res__verdict">În așteptare în outbox: <b className={data.outbox.pending > 0 ? "res__bad" : "res__good"}>{data.outbox.pending}</b></p>
      )}
      {state.kind === "pending" && <p className="res__verdict">Comanda #{state.id}: <Badge tone="neutral">PENDING</Badge> de {Math.round((Date.now() - state.since) / 1000)} s</p>}
      {state.kind === "done" && <p className="res__verdict">Comanda #{state.id}: <Badge tone={state.status === "CONFIRMED" ? "ok" : "bad"}>{state.status}</Badge></p>}
      {state.kind === "login" && <p className="res__hint res__hint--bad">Autentifică-te: comenzile cer un cont.</p>}
      {data && data.outbox.latest.length > 0 && (
        <table className="res__table">
          <thead><tr><th>#</th><th>Tip</th><th>Comanda</th><th>Trimis</th><th>Încercări</th></tr></thead>
          <tbody>
            {data.outbox.latest.map((m) => (
              <tr key={m.id} className={m.sentAt ? "" : "is-waiting"}>
                <td>{m.id}</td><td><code>{m.type}</code></td><td>{m.orderId}</td>
                <td>{m.sentAt ? new Date(m.sentAt).toLocaleTimeString() : <span className="res__bad" title={m.lastError || ""}>așteaptă</span>}</td>
                <td>{m.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function DlqPanel({ queues }) {
  const { state, run, isAdmin } = useDlqReplay();
  const dlq = (name) => (queues && queues[name] ? queues[name].messages : "—");
  return (
    <section className="res__panel">
      <PanelHead step="5" title="Dead-letter queue: reluare după avarie">
        <Button size="sm" variant="ghost" onClick={run} disabled={!isAdmin}>Reia mesajele</Button>
      </PanelHead>
      <p className="res__hint">
        Mesajele care au eșuat de 3 ori (monolitul a stat oprit mai mult) ajung în DLQ. După ce monolitul revine, le trimiți
        înapoi în coada lor — sigur, fiindcă rezervarea și compensarea sunt idempotente. {isAdmin ? "" : "Doar pentru ADMIN."}
      </p>
      <p className="res__verdict">
        <code>order.confirmation.dlq</code>: <b>{dlq("order.confirmation.dlq")}</b> · <code>order.stock-release.dlq</code>:{" "}
        <b>{dlq("order.stock-release.dlq")}</b>
        {state && state.body && <> — reluate: {state.body.confirmations} confirmări, {state.body.stockReleases} compensări</>}
        {state && !state.body && <> — răspuns {state.status}</>}
      </p>
    </section>
  );
}
