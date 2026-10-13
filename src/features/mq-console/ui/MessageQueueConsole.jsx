import { useEffect } from "react";
import { Button, Card, Badge } from "../../../shared/ui/index.js";
import { OrderStatusBadge } from "../../../entities/order/index.js";
import {
  useQueueStats, useSyncVsAsync, useBurst, usePoison, useOutOfStock, BURST_SIZE, QUEUES,
} from "../model/useMqExperiments.js";
import "./MessageQueueConsole.css";

// Lecția 18 — consola „Message queues”. Comenzi reale, prin Nginx, către cele două
// instanțe; RabbitMQ între ele. Același tipar ca consolele din Lecțiile 16 și 17.
export function MessageQueueConsole() {
  return (
    <Card className="mq">
      <div className="mq__head"><h3>Consolă RabbitMQ</h3></div>
      <QueuesPanel />
      <SyncAsyncPanel />
      <BurstPanel />
      <PoisonPanel />
      <OutOfStockPanel />
    </Card>
  );
}

function instanceClass(instance) {
  if (!instance) return "is-unknown";
  return /2$/.test(instance) ? "is-b" : "is-a";
}

function Instance({ name }) {
  return <span className={"mq__inst " + instanceClass(name)}>{name || "?"}</span>;
}

function PanelHead({ step, title, onRun, busy, label }) {
  return (
    <div className="mq__panel-head">
      <span className="mq__step">{step}</span>
      <h4>{title}</h4>
      <Button size="sm" onClick={onRun} disabled={busy}>{busy ? "Se trimite…" : label}</Button>
    </div>
  );
}

function Common({ state }) {
  if (state.kind === "anon") return <p className="mq__hint mq__hint--bad">Autentifică-te (dreapta sus): comenzile au nevoie de un utilizator.</p>;
  if (state.kind === "down") return <p className="mq__hint mq__hint--bad">Backend-ul nu răspunde. Pornește-l cu <code>docker compose up --build</code>.</p>;
  if (state.kind === "unavailable") return <p className="mq__hint mq__hint--bad">RabbitMQ e oprit (503). Pornește-l: <code>docker compose start rabbitmq</code>.</p>;
  if (state.kind === "error") return <p className="mq__hint mq__hint--bad">Eroare {state.status}.</p>;
  return null;
}

function QueuesPanel() {
  const { state, refresh } = useQueueStats();
  useEffect(() => { refresh(); }, [refresh]);
  return (
    <section className="mq__panel">
      <div className="mq__panel-head">
        <span className="mq__step">0</span>
        <h4>Cozile, acum</h4>
        <Button size="sm" variant="ghost" onClick={refresh}>Reîncarcă</Button>
      </div>
      <p className="mq__hint">
        <code>GET /api/v1/mq/stats</code> — câte mesaje așteaptă în fiecare coadă și câți consumatori o ascultă. Cu{" "}
        <code>docker compose</code> pornit, fiecare coadă are <b>2 consumatori</b>: backend-1 și backend-2. Interfața
        completă: <code>http://localhost:15672</code> (<code>impact</code> / <code>impact</code>).
      </p>
      <Common state={state} />
      {state.kind === "done" && (
        <table className="mq__table">
          <thead><tr><th>Coada</th><th>Mesaje în așteptare</th><th>Consumatori</th></tr></thead>
          <tbody>
            {Object.entries(state.queues).map(([name, q]) => (
              <tr key={name}><td><code>{name}</code></td><td>{q.messages}</td><td>{q.consumers}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function SyncAsyncPanel() {
  const { state, run } = useSyncVsAsync();
  return (
    <section className="mq__panel">
      <PanelHead step="1" title="Sincron vs. asincron" onRun={run} busy={state.kind === "loading"} label="Plasează 2 comenzi" />
      <p className="mq__hint">
        Aceeași comandă de două ori. <b>Sincron</b> (<code>?processing=sync</code>): clientul așteaptă toată munca lentă.{" "}
        <b>Asincron</b>: backend-ul salvează comanda, pune un mesaj în RabbitMQ și răspunde imediat cu 202.
      </p>
      <Common state={state} />
      {(state.sync || state.async) && (
        <ul className="mq__stats">
          {state.sync && (
            <li>Sincron: răspuns după <b>{state.sync.ms} ms</b> — <OrderStatusBadge status={state.sync.data && state.sync.data.status} /></li>
          )}
          {state.async && (
            <li>Asincron: răspuns după <b>{state.async.ms} ms</b> (HTTP {state.async.status}) — <OrderStatusBadge status="PENDING" /></li>
          )}
          {state.kind === "loading" && state.step === "wait" && <li>Așteptăm consumatorul…</li>}
          {state.kind === "done" && state.confirmed && (
            <li>…confirmată de <Instance name={state.confirmed.processedBy} /> după <b>~{state.confirmMs} ms</b> — clientul nu a mai așteptat.</li>
          )}
        </ul>
      )}
    </section>
  );
}

function BurstPanel() {
  const { state, run } = useBurst();
  const depth = state.depth || [];
  const max = Math.max(1, ...depth);
  return (
    <section className="mq__panel">
      <PanelHead step="2" title="Coada și competing consumers" onRun={run} busy={state.kind === "loading"} label={`${BURST_SIZE} comenzi deodată`} />
      <p className="mq__hint">
        {BURST_SIZE} comenzi trimise una după alta, cât de repede se poate. Coada <code>{QUEUES.confirmation}</code>{" "}
        se umple, iar cele două instanțe o golesc împreună — fiecare mesaj ajunge la UN singur consumator.
      </p>
      <Common state={state} />
      {depth.length > 0 && (
        <div className="mq__bars" title="mesaje în coadă, măsurate o dată pe secundă">
          {depth.map((d, i) => <span key={i} className="mq__bar" style={{ height: `${(d / max) * 100}%` }}><i>{d}</i></span>)}
        </div>
      )}
      {(state.orders || []).length > 0 && (
        <div className="mq__strip">
          {state.orders.slice().sort((a, b) => a.id - b.id).map((o) => (
            <span key={o.id} className={"mq__cell " + (o.status === "PENDING" ? "is-pending" : instanceClass(o.processedBy))}
                  title={`#${o.id}: ${o.status} ${o.processedBy || ""}`}>{o.id}</span>
          ))}
        </div>
      )}
      {state.kind === "done" && (
        <ul className="mq__stats">
          <li>{state.sent} comenzi trimise în <b>{state.postedMs} ms</b>; toate procesate după <b>{(state.totalMs / 1000).toFixed(1)} s</b>.</li>
          {Object.entries(state.counts).map(([name, n]) => (
            <li key={name}><Instance name={name} /> a confirmat {n} {n === 1 ? "comandă" : "comenzi"}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PoisonPanel() {
  const { state, run, purge } = usePoison();
  return (
    <section className="mq__panel">
      <PanelHead step="3" title="Retry și dead-letter queue" onRun={run} busy={state.kind === "loading"} label="Trimite un mesaj otrăvit" />
      <p className="mq__hint">
        Un mesaj pentru comanda <code>0</code>, care nu există. Consumatorul aruncă o excepție; Spring reîncearcă de 3 ori
        (după 1 s, apoi după 2 s), apoi mesajul e respins și RabbitMQ îl mută în <code>{QUEUES.dlq}</code> — nu se pierde și
        nu blochează coada.
      </p>
      <Common state={state} />
      {state.kind === "loading" && <p className="mq__hint">Încercările rulează…</p>}
      {state.kind === "done" && (
        <ul className="mq__stats">
          <li>Mesajul a ajuns în DLQ după <b>{(state.ms / 1000).toFixed(1)} s</b> — 3 încercări + pauzele dintre ele.</li>
          <li>Mesaje în DLQ acum: <b>{state.dlq}</b> <Button size="sm" variant="ghost" onClick={purge}>Golește DLQ</Button></li>
        </ul>
      )}
      {state.kind === "purged" && <p className="mq__hint">DLQ golită.</p>}
      {state.kind === "timeout" && <p className="mq__hint mq__hint--bad">Mesajul n-a ajuns în DLQ în 15 s — e retry-ul configurat?</p>}
    </section>
  );
}

function OutOfStockPanel() {
  const { state, run } = useOutOfStock();
  return (
    <section className="mq__panel">
      <PanelHead step="4" title="Stoc insuficient: REJECTED" onRun={run} busy={state.kind === "loading"} label="Comandă peste stoc" />
      <p className="mq__hint">
        Comandăm cu o bucată mai mult decât e în stoc. Plasarea reușește (202) — stocul îl verifică abia consumatorul,
        care respinge comanda. O eroare de business nu se reîncearcă și nu ajunge în DLQ.
      </p>
      <Common state={state} />
      {state.kind === "nocandidate" && <p className="mq__hint">Niciun produs cu stoc sub 20 — scade stocul unui produs din Administrare.</p>}
      {state.kind === "done" && state.order && (
        <ul className="mq__stats">
          <li>{state.quantity}× „{state.product.name}” (stoc {state.product.stock}) → <OrderStatusBadge status={state.order.status} /></li>
          {state.order.failureReason && <li>Motiv: {state.order.failureReason}</li>}
          <li>Stocul după: <b>{state.stockAfter}</b> {state.stockAfter === state.product.stock ? "— neatins." : ""}</li>
        </ul>
      )}
    </section>
  );
}
