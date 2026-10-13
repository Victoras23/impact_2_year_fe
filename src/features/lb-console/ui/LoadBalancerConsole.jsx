import { Button, Card, Badge } from "../../../shared/ui/index.js";
import { useDistribution, useLeastConnExperiment, useVisits, useRealIp, DISTRIBUTION_SIZE } from "../model/useLbExperiments.js";
import "./LoadBalancerConsole.css";

// Lecția 17 — consola „Load balancer”. Patru panouri, toate cu cereri reale prin
// Nginx către cele două instanțe — același tipar ca consolele din Lecțiile 10, 11, 16.
export function LoadBalancerConsole() {
  return (
    <Card className="lb">
      <div className="lb__head"><h3>Consolă load balancer</h3></div>
      <DistributionPanel />
      <LeastConnPanel />
      <VisitsPanel />
      <RealIpPanel />
    </Card>
  );
}

function instanceClass(instance) {
  if (!instance) return "is-unknown";
  return /2$/.test(instance) ? "is-b" : "is-a";
}

function Instance({ name }) {
  return <span className={"lb__inst " + instanceClass(name)}>{name || "?"}</span>;
}

function PanelHead({ step, title, onRun, busy, label }) {
  return (
    <div className="lb__panel-head">
      <span className="lb__step">{step}</span>
      <h4>{title}</h4>
      <Button size="sm" onClick={onRun} disabled={busy}>{busy ? "Se trimite…" : label}</Button>
    </div>
  );
}

function Down() {
  return <p className="lb__hint lb__hint--bad">Backend-ul nu răspunde. Pornește-l cu <code>docker compose up --build</code> și încearcă din nou.</p>;
}

function AlgorithmBadge({ algorithm }) {
  return algorithm
    ? <Badge tone="ok">Nginx: {algorithm}</Badge>
    : <Badge tone="bad">fără Nginx — o singură instanță</Badge>;
}

function DistributionPanel() {
  const { state, run } = useDistribution();
  const rows = state.rows || [];
  return (
    <section className="lb__panel">
      <PanelHead step="1" title="Cine răspunde? (și failover)" onRun={run} busy={state.kind === "loading"}
                 label={`Trimite ${DISTRIBUTION_SIZE} de cereri`} />
      <p className="lb__hint">
        {DISTRIBUTION_SIZE} de cereri <code>GET /api/v1/lb/whoami</code>, una după alta. Fiecare răspuns spune
        instanța care l-a servit (<code>X-Instance-Id</code>). Apoi oprește o instanță
        (<code>docker compose stop backend-2</code>) și rulează din nou: cererile trebuie să meargă toate pe cealaltă,
        fără erori.
      </p>
      {state.kind === "down" && <Down />}
      {rows.length > 0 && (
        <div className="lb__strip">
          {rows.map((r, i) => (
            <span key={i} className={"lb__cell " + (r.status >= 200 && r.status < 300 ? instanceClass(r.instance) : "is-error")}
                  title={`#${i + 1}: ${r.instance || "?"} · ${r.status} · ${r.ms} ms`} />
          ))}
        </div>
      )}
      {state.kind === "done" && (
        <ul className="lb__stats">
          <li><AlgorithmBadge algorithm={state.algorithm} /></li>
          {Object.entries(state.counts).map(([name, n]) => (
            <li key={name}><Instance name={name} /> a răspuns la {n} {n === 1 ? "cerere" : "cereri"}</li>
          ))}
          <li>Erori: <b>{state.errors}</b> · cea mai lentă cerere: <b>{state.slowest} ms</b>
            {state.slowest > 1000 ? " — Nginx a așteptat o instanță oprită, apoi a trecut la cealaltă" : ""}</li>
        </ul>
      )}
    </section>
  );
}

function LeastConnPanel() {
  const { state, run } = useLeastConnExperiment();
  return (
    <section className="lb__panel">
      <PanelHead step="2" title="Round robin vs. least_conn" onRun={run} busy={state.kind === "loading"}
                 label="Cerere lentă + 6 rapide" />
      <p className="lb__hint">
        O cerere de 3 secunde (<code>/api/v1/lb/slow</code>) ține o instanță ocupată; în timpul ei trimitem 6 cereri
        rapide. Rulează o dată cu round robin, apoi schimbă algoritmul:{" "}
        <code>NGINX_CONF=least-conn docker compose up -d --force-recreate nginx</code>.
      </p>
      {state.kind === "down" && <Down />}
      {state.kind === "done" && (
        <ul className="lb__stats">
          <li><AlgorithmBadge algorithm={state.algorithm} /></li>
          <li>Cererea lentă: <Instance name={state.slow.instance} /> ({state.slow.ms} ms)</li>
          <li>Cererile rapide: {state.fast.map((f, i) => <Instance key={i} name={f.instance} />)}</li>
          <li><b>{state.onBusy} din 6</b> au ajuns pe instanța ocupată
            {state.onBusy === 0 ? " — least_conn le-a trimis pe cea liberă." : state.onBusy >= 3 ? " — round robin nu se uită cât de ocupată e o instanță." : "."}</li>
        </ul>
      )}
    </section>
  );
}

function VisitsPanel() {
  const { state, run } = useVisits();
  const rows = state.rows || [];
  return (
    <section className="lb__panel">
      <PanelHead step="3" title="Sticky sessions vs. stateless" onRun={run} busy={state.kind === "loading"}
                 label="8 vizite (POST)" />
      <p className="lb__hint">
        Fiecare vizită crește două contoare: unul în memoria instanței (ca o sesiune ținută local) și unul în Redis
        (comun). Cu round robin, contorul local „sare”; cu <code>ip-hash</code> ajungi mereu la aceeași instanță.
      </p>
      {state.kind === "down" && <Down />}
      {rows.length > 0 && (
        <table className="lb__table">
          <thead><tr><th>#</th><th>Instanța</th><th>Contor local (memorie)</th><th>Contor comun (Redis)</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td>{i + 1}</td><td><Instance name={r.instance} /></td>
                <td>{r.body ? r.body.localVisits : "—"}</td><td>{r.body && r.body.sharedVisits != null ? r.body.sharedVisits : "—"}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {state.kind === "done" && (
        <p className="lb__verdict">
          {state.instances > 1
            ? "Două instanțe, două contoare locale diferite: o sesiune ținută în memorie s-ar „pierde” la fiecare a doua cerere. Contorul din Redis crește corect — de aceea aplicația noastră e stateless (JWT + Redis)."
            : "O singură instanță a răspuns (ip-hash sau o instanță oprită): contorul local crește la fel ca cel comun."}
        </p>
      )}
    </section>
  );
}

function RealIpPanel() {
  const { state, run } = useRealIp();
  return (
    <section className="lb__panel">
      <PanelHead step="4" title="IP-ul real al clientului" onRun={run} busy={state.kind === "loading"}
                 label="Verifică (cu și fără X-Forwarded-For fals)" />
      <p className="lb__hint">
        Aplicația vede IP-ul lui Nginx; IP-ul tău real vine în <code>X-Forwarded-For</code>, citit DOAR de la Nginx.
        A doua cerere pune singură <code>X-Forwarded-For: 1.2.3.4</code> — un atacator care vrea să ocolească limita
        din Lecția 16.
      </p>
      {state.kind === "down" && <Down />}
      {state.kind === "done" && (
        <ul className="lb__stats">
          <li>Fără header: aplicația te vede ca <code>{state.honest.body && state.honest.body.clientIp}</code></li>
          <li>Cu <code>X-Forwarded-For: 1.2.3.4</code>: tot <code>{state.spoofed.body && state.spoofed.body.clientIp}</code>
            {state.spoofed.body && state.spoofed.body.clientIp === state.honest.body.clientIp
              ? <> — valoarea falsă a rămas ignorată (<code>{state.spoofed.body.forwardedFor}</code>).</>
              : " — atenție: aplicația a crezut IP-ul falsificat!"}</li>
        </ul>
      )}
    </section>
  );
}
