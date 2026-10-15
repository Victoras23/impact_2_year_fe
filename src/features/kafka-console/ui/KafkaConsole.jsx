import { useEffect, useState } from "react";
import { Button, Card, Badge, Modal } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { KAFKA_UI_DIRECT_PORT, KAFKA_UI_EMBED_PORT } from "../../../shared/config/index.js";
import { formatPrice } from "../../../shared/lib/index.js";
import { useKafkaStats, useEventLog, useLagExperiment, useReplay, useCompare } from "../model/useKafkaExperiments.js";
import "./KafkaConsole.css";

// Lecția 19 — consola „Kafka”. Comenzi reale, prin Nginx, pe ambele instanțe; evenimentele
// le citim direct din jurnal (/kafka/events) și starea grupului „analytics” din /kafka/stats.
export function KafkaConsole() {
  return (
    <Card className="kc">
      <div className="kc__head"><h3>Consolă Kafka</h3><KafkaUiButton /></div>
      <StatsPanel />
      <EventLogPanel />
      <LagPanel />
      <ReplayPanel />
      <ComparePanel />
    </Card>
  );
}

// Același host ca API-ul (de obicei localhost), alt port: Kafka UI nu trece prin backend.
function kafkaUiUrl(baseUrl, port) {
  try { const u = new URL(baseUrl); return `${u.protocol}//${u.hostname}:${port}/`; }
  catch { return `http://localhost:${port}/`; }
}

function KafkaUiButton() {
  const [open, setOpen] = useState(false);
  const { baseUrl } = useApiBase();
  const direct = kafkaUiUrl(baseUrl, KAFKA_UI_DIRECT_PORT);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Deschide Kafka UI</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Kafka UI — topicuri, mesaje, consumer groups" size="lg">
        {open ? (
          <div className="kc__ui">
            <p className="kc__ui-bar">
              Prin Nginx, portul {KAFKA_UI_EMBED_PORT} (fără <code>X-Frame-Options</code>). Pagina goală? Repornește Nginx:{" "}
              <code>docker compose up -d --no-deps nginx</code> ·{" "}
              <a href={direct} target="_blank" rel="noreferrer">deschide în tab nou ({KAFKA_UI_DIRECT_PORT})</a>
            </p>
            <iframe className="kc__ui-frame" src={kafkaUiUrl(baseUrl, KAFKA_UI_EMBED_PORT)} title="Kafka UI" />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

const ownerClass = (o) => (!o ? "is-none" : /^backend-2/.test(o) ? "is-b" : "is-a");

function PanelHead({ step, title, onRun, busy, label }) {
  return (
    <div className="kc__panel-head">
      <span className="kc__step">{step}</span>
      <h4>{title}</h4>
      <Button size="sm" onClick={onRun} disabled={busy}>{busy ? "Rulează…" : label}</Button>
    </div>
  );
}

function Common({ state }) {
  if (state.kind === "anon") return <p className="kc__hint kc__hint--bad">Autentifică-te ca admin (<code>admin@impact.md</code> / <code>admin123</code>): jurnalul și statisticile sunt doar pentru ADMIN.</p>;
  if (state.kind === "down") return <p className="kc__hint kc__hint--bad">Backend-ul nu răspunde. Pornește-l cu <code>docker compose up --build</code>.</p>;
  if (state.kind === "unavailable") return <p className="kc__hint kc__hint--bad">Kafka e oprit (503). Pornește-l: <code>docker compose start kafka</code>.</p>;
  if (state.kind === "error") return (
    <p className="kc__hint kc__hint--bad">
      Eroare {state.status} de la backend. Dacă e 500: există tabelele <code>analytics_*</code>? Pe un volum Postgres mai
      vechi rulează <code>docker/migrations/lesson-19-analytics.sql</code>, apoi „Replay de la offset 0”.
    </p>
  );
  return null;
}

function StatsPanel() {
  const { state, refresh } = useKafkaStats();
  useEffect(() => { refresh(); }, [refresh]);
  return (
    <section className="kc__panel">
      <div className="kc__panel-head">
        <span className="kc__step">0</span>
        <h4>Topicuri, partiții și grupul „analytics”</h4>
        <Button size="sm" variant="ghost" onClick={refresh}>Reîncarcă</Button>
      </div>
      <p className="kc__hint">
        <code>GET /api/v1/kafka/stats</code> — pentru fiecare partiție: câte evenimente are (offset final), până unde a
        citit grupul <code>analytics</code> (offset salvat), diferența (<b>lag</b>) și ce instanță o citește. Interfața
        completă: butonul „Deschide Kafka UI” de sus.
      </p>
      <Common state={state} />
      {state.kind === "done" && (
        <>
          <p className="kc__hint">Grupul: <Badge tone="ok">{state.data.groupState}</Badge> · {state.data.members.length} membri</p>
          <table className="kc__table">
            <thead><tr><th>Partiție</th><th>Offset final</th><th>Citit de grup</th><th>Lag</th><th>Citită de</th></tr></thead>
            <tbody>
              {state.data.topics.flatMap((t) => t.partitions.map((p) => (
                <tr key={`${t.name}-${p.partition}`}>
                  <td><code>{t.name}-{p.partition}</code></td><td>{p.endOffset}</td><td>{p.committed}</td>
                  <td className={p.lag > 0 ? "kc__lag" : ""}>{p.lag}</td>
                  <td><span className={"kc__inst " + ownerClass(p.owner)}>{p.owner || "—"}</span></td>
                </tr>
              )))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function EventLogPanel() {
  const { state, run } = useEventLog();
  return (
    <section className="kc__panel">
      <PanelHead step="1" title="Jurnalul: aceeași cheie → aceeași partiție" onRun={run} busy={state.kind === "loading"} label="3 comenzi + jurnalul" />
      <p className="kc__hint">
        Plasăm 3 comenzi și citim jurnalul. Fiecare comandă produce <code>ORDER_PLACED</code> (scris de instanța care
        a primit cererea) și <code>ORDER_CONFIRMED</code> (scris de instanța care a confirmat-o) — cu aceeași cheie,
        deci în aceeași partiție, în ordine. Plus câte un <code>STOCK_CHANGED</code> în <code>shop.stock</code>.
      </p>
      <Common state={state} />
      {state.kind === "loading" && <p className="kc__hint">Plasăm comenzile și așteptăm confirmarea…</p>}
      {state.kind === "done" && (
        <>
          <table className="kc__table">
            <thead><tr><th>Topic-partiție</th><th>Offset</th><th>Cheie</th><th>Tip</th><th>Scris de</th></tr></thead>
            <tbody>{state.rows.map((r) => (
              <tr key={`${r.topic}-${r.partition}-${r.offset}`}>
                <td><code>{r.topic}-{r.partition}</code></td><td>{r.offset}</td><td>{r.key}</td><td>{r.type}</td>
                <td><span className={"kc__inst " + ownerClass(r.producedBy)}>{r.producedBy}</span></td>
              </tr>
            ))}</tbody>
          </table>
          <ul className="kc__stats">{state.perOrder.map((o) => (
            <li key={o.id}>Comanda #{o.id}: {o.types.join(" → ")} — {o.partitions.length === 1
              ? <b>o singură partiție ({o.partitions[0]})</b> : <b className="kc__bad">partiții diferite!</b>}</li>
          ))}</ul>
        </>
      )}
    </section>
  );
}

function LagPanel() {
  const { state, run } = useLagExperiment();
  return (
    <section className="kc__panel">
      <PanelHead step="2" title="Consumer lag: handler-ul oprit" onRun={run} busy={state.kind === "loading"} label="Oprește + 5 comenzi" />
      <p className="kc__hint">
        Oprim handler-ul (pe ambele instanțe), plasăm 5 comenzi, apoi îl pornim din nou. Comenzile se confirmă oricum
        (prin RabbitMQ); evenimentele lor așteaptă în Kafka — nu se pierd.
      </p>
      <Common state={state} />
      {state.kind === "loading" && <p className="kc__hint">{{ pause: "Oprim handler-ul…", orders: "Plasăm comenzile…", resume: "Pornim handler-ul…" }[state.step]}</p>}
      {state.kind === "done" && (
        <ul className="kc__stats">
          <li>Handler oprit, {state.orders} comenzi confirmate: lag <b>{state.lagWhilePaused}</b> evenimente — statistici:
            {" "}{state.before.ordersPlaced} → <b>{state.during.ordersPlaced}</b> plasate (nicio schimbare)</li>
          <li>Handler pornit: lag 0 după <b>{state.catchUpMs} ms</b> — statistici: <b>{state.after.ordersPlaced}</b> plasate,
            {" "}{state.after.ordersConfirmed} confirmate</li>
        </ul>
      )}
    </section>
  );
}

function ReplayPanel() {
  const { state, run } = useReplay();
  return (
    <section className="kc__panel">
      <PanelHead step="3" title="Replay: reconstruim statisticile din jurnal" onRun={run} busy={state.kind === "loading"} label="Replay de la offset 0" />
      <p className="kc__hint">
        Ștergem toate tabelele handler-ului și derulăm grupul <code>analytics</code> la offset 0. Handler-ul citește din
        nou tot jurnalul — și trebuie să ajungă la exact aceleași numere.
      </p>
      <Common state={state} />
      {state.kind === "loading" && <p className="kc__hint">Se reconstruiește…</p>}
      {state.kind === "done" && (
        <ul className="kc__stats">
          <li>Înainte: {state.before.ordersPlaced} plasate · {state.before.ordersConfirmed} confirmate · {formatPrice(state.before.revenue)}</li>
          <li>În timpul replay-ului, statisticile au coborât până la <b>{state.lowest}</b> comenzi plasate</li>
          <li>După <b>{(state.ms / 1000).toFixed(1)} s</b>: {state.after.ordersPlaced} plasate · {state.after.ordersConfirmed} confirmate
            {" "}· {formatPrice(state.after.revenue)} — {state.same ? <b>identice</b> : <b className="kc__bad">diferite</b>}</li>
        </ul>
      )}
    </section>
  );
}

function ComparePanel() {
  const { state, run } = useCompare();
  return (
    <section className="kc__panel">
      <PanelHead step="4" title="Kafka vs. RabbitMQ: ce rămâne după consum" onRun={run} busy={state.kind === "loading"} label="Compară" />
      <p className="kc__hint">
        Ambele au fost deja consumate. RabbitMQ șterge mesajul după ce consumatorul îl confirmă; Kafka păstrează
        evenimentul în jurnal — oricine îl poate citi din nou, de la orice offset.
      </p>
      <Common state={state} />
      {state.kind === "done" && (
        <ul className="kc__stats">
          <li>RabbitMQ <code>order.confirmation</code>: <b>{state.rabbit}</b> mesaje în coadă</li>
          <li>Kafka: <b>{state.inLog}</b> evenimente în jurnal, lag <b>{state.lag}</b> — deci toate citite, dar încă acolo
            (ultimele {state.readable} citite chiar acum, fără grup)</li>
        </ul>
      )}
    </section>
  );
}
