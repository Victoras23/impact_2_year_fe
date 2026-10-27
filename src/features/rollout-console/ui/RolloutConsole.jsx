import { useApiBase } from "../../../shared/api/index.js";
import { Badge, Button, Card } from "../../../shared/ui/index.js";
import { GATEWAY_BASE, MONOLITH_BASE } from "../model/rolloutApi.js";
import { SAMPLE, useProbes, useReplicaSample, useRolloutWatch, useSystemCheck } from "../model/useRolloutConsole.js";
import "./RolloutConsole.css";

// Lecția 24 — consola „Rollout”: replici, rolling update urmărit în timp real, probele și tot sistemul
// în cluster. Ce schimbi în cluster schimbi din terminal (kubectl); consola arată efectul.
export function RolloutConsole() {
  return (
    <Card className="ro">
      <div className="ro__head"><h3>Consolă rollout</h3></div>
      <AddressBar />
      <ReplicaPanel />
      <WatchPanel />
      <ProbePanel />
      <SystemPanel />
    </Card>
  );
}

function PanelHead({ step, title, children }) {
  return (
    <div className="ro__panel-head">
      <span className="ro__step">{step}</span>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function AddressBar() {
  const { baseUrl, setBaseUrl } = useApiBase();
  const current = baseUrl.replace(/\/+$/, "");
  return (
    <div className="ro__address">
      <span>Adresa API: <code>{baseUrl}</code></span>
      <Button size="sm" variant={current === GATEWAY_BASE ? "primary" : "ghost"} onClick={() => setBaseUrl(GATEWAY_BASE)}>
        Gateway (8080)
      </Button>
      <Button size="sm" variant={current === MONOLITH_BASE ? "primary" : "ghost"} onClick={() => setBaseUrl(MONOLITH_BASE)}>
        Monolitul direct (8081)
      </Button>
      <span className="ro__hint ro__hint--inline">În Lecția 24, 8080 e gateway-ul din cluster (docker compose oprit).</span>
    </div>
  );
}

const short = (pod) => (pod || "?").replace(/^monolith-/, "");

function ReplicaPanel() {
  const { state, run } = useReplicaSample();
  const busy = state.kind === "running";
  const total = state.kind === "done" ? state.counts.reduce((a, c) => a + c.n, 0) : 0;
  return (
    <section className="ro__panel">
      <PanelHead step="1" title={`Replici: cine răspunde la ${SAMPLE} de cereri`}>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(false)}>Aceeași conexiune</Button>
        <Button size="sm" disabled={busy} onClick={() => run(true)}>Conexiune nouă (close=true)</Button>
      </PanelHead>
      {state.kind === "done" && (
        <>
          <div className="ro__bars">
            {state.counts.map((c) => (
              <div key={c.pod} className="ro__bar">
                <span className="ro__bar-label">{short(c.pod)} <em>v{c.version}</em></span>
                <span className="ro__bar-track"><span style={{ width: (100 * c.n / Math.max(1, total)) + "%" }} /></span>
                <b>{c.n}</b>
              </div>
            ))}
          </div>
          <p className="ro__verdict">
            {state.counts.length === 1
              ? <>Toate la <b>un singur pod</b>{state.close ? "" : " — browserul a folosit aceeași conexiune, iar un Service alege podul o dată pe conexiune"}.</>
              : <>Împărțite pe <b>{state.counts.length} poduri</b> — fiecare conexiune nouă e un nou „bilet” la Service (la întâmplare, nu pe rând).</>}
            {state.failed > 0 && <span className="ro__bad"> Eșuate: {state.failed} (429 = limita de 100/min din Lecția 16).</span>}
          </p>
        </>
      )}
      <p className="ro__hint">
        Scalează: <code>kubectl scale deployment/monolith -n impact --replicas=3</code> și apasă din nou. Prin gateway (8080),
        podurile văzute depind de câte conexiuni are deschise pool-ul gateway-ului spre Service — fiecare e legată de un pod.
      </p>
    </section>
  );
}

const VERSION_COLORS = ["#a1a1aa", "var(--color-accent)", "#2563eb", "#1f9d55"];

function WatchPanel() {
  const w = useRolloutWatch();
  const versions = Object.keys(w.totals.versions).sort();
  const color = (v) => VERSION_COLORS[Math.max(0, versions.indexOf(v)) % VERSION_COLORS.length];
  return (
    <section className="ro__panel">
      <PanelHead step="2" title="Rolling update, în timp real (4 cereri/s spre :8081)">
        <Button size="sm" onClick={() => w.setOn(!w.on)}>{w.on ? "Oprește" : "Pornește"}</Button>
        <Button size="sm" variant="ghost" onClick={w.reset}>Golește</Button>
      </PanelHead>
      {w.samples.length > 0 && (
        <>
          <div className="ro__strip">
            {w.samples.map((s, i) => (
              <span key={i} title={s.ok ? `${short(s.pod)} v${s.version}` : `eșuat (${s.status})`}
                    style={{ background: s.ok ? color(s.version) : "#111" }} />
            ))}
          </div>
          <div className="ro__totals">
            <span>reușite: <b>{w.totals.ok}</b></span>
            <span>eșuate: <b className={w.totals.failed ? "ro__bad" : "ro__good"}>{w.totals.failed}</b></span>
            {versions.map((v) => (
              <span key={v}><i className="ro__dot" style={{ background: color(v) }} /> v{v}: <b>{w.totals.versions[v]}</b></span>
            ))}
          </div>
          {w.events.length > 0 && (
            <ul className="ro__events">
              {w.events.map((e, i) => (
                <li key={i}>
                  <time>{new Date(e.at).toLocaleTimeString()}</time>
                  {e.type === "version"
                    ? <><Badge tone="accent">versiune nouă</Badge> v{e.from} → <b>v{e.to}</b> ({short(e.pod)})</>
                    : <><Badge tone="neutral">alt pod</Badge> {short(e.from)} → {short(e.to)}</>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <ol className="ro__steps">
        <li>Pornește urmărirea, apoi în terminal: <code>kubectl set image deployment/monolith -n impact monolith=impact-monolith:1.0.0</code></li>
        <li>Înapoi la versiunea nouă: <code>kubectl set image deployment/monolith -n impact monolith=impact-monolith:1.1.0</code></li>
        <li>Sau doar poduri noi, aceeași imagine: <code>kubectl rollout restart deployment/monolith -n impact</code></li>
      </ol>
      <p className="ro__hint">Negru = cerere eșuată. Cu probe + preStop ar trebui să rămână 0.</p>
    </section>
  );
}

function ProbePanel() {
  const p = useProbes();
  const list = Object.values(p.pods).sort((a, b) => a.pod.localeCompare(b.pod));
  const r = p.result;
  return (
    <section className="ro__panel">
      <PanelHead step="3" title="Probele: readiness vs. liveness">
        <Button size="sm" variant="ghost" disabled={!p.isAdmin} onClick={p.pause}>Scoate un pod din trafic (20 s)</Button>
        <Button size="sm" disabled={!p.isAdmin} onClick={p.kill}>Strică liveness</Button>
        <Button size="sm" variant="ghost" onClick={() => p.setLive(!p.live)}>{p.live ? "Pauză" : "Urmărește podurile"}</Button>
      </PanelHead>
      {!p.isAdmin && <p className="ro__hint ro__hint--bad">Autentifică-te ca admin: comenzile strică un pod de-adevăratelea.</p>}
      {r && (
        <p className="ro__verdict">
          {r.status === 200
            ? r.kind === "readiness"
              ? <>Podul <b>{short(r.body.podName)}</b> refuză trafic {r.body.seconds} s: în ~10 s iese din Service și nu mai apare mai jos. NU e repornit.</>
              : <>Podul <b>{short(r.body.podName)}</b> are liveness BROKEN: după ~15 s kubelet repornește containerul — același nume, „pornit” de la zero.</>
            : <span className="ro__bad">Răspuns {r.status}{r.status === 404 ? " — imaginea nu are încă Lecția 24 (1.1.0)" : ""}.</span>}
        </p>
      )}
      {list.length > 0 && (
        <table className="ro__table">
          <thead><tr><th>Pod</th><th>Versiune</th><th>Readiness</th><th>Liveness</th><th>Văzut acum</th><th>Reporniri văzute</th></tr></thead>
          <tbody>
            {list.map((x) => {
              const age = Math.round((Date.now() - x.seen) / 1000);
              return (
                <tr key={x.pod} className={age > 6 ? "is-gone" : ""}>
                  <td><b>{short(x.pod)}</b></td><td>v{x.version}</td>
                  <td><Badge tone={x.readiness === "ACCEPTING_TRAFFIC" ? "ok" : "bad"}>{x.readiness}</Badge></td>
                  <td><Badge tone={x.liveness === "CORRECT" ? "ok" : "bad"}>{x.liveness}</Badge></td>
                  <td>{age} s</td><td>{x.restarts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="ro__hint">
        Readiness = „trimite-mi cereri?”. Liveness = „sunt viu?”. Terminalul: <code>kubectl get pods -n impact -w</code> (RESTARTS)
        și <code>kubectl get endpointslices -n impact -l kubernetes.io/service-name=monolith</code>.
      </p>
    </section>
  );
}

function SystemPanel() {
  const { rows, run } = useSystemCheck();
  return (
    <section className="ro__panel">
      <PanelHead step="4" title="Tot sistemul în cluster, prin gateway (8080)">
        <Button size="sm" onClick={run}>Verifică</Button>
      </PanelHead>
      {rows && (
        <table className="ro__table">
          <thead><tr><th>Ce</th><th>Cerere</th><th>Status</th><th>Detalii</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.path}>
                <td>{x.label}</td><td><code>{x.path}</code></td>
                <td><Badge tone={x.status === 200 ? "ok" : "bad"}>{x.status || "—"}</Badge></td>
                <td>
                  {x.route && <>ruta: <b>{x.route}</b> </>}
                  {Array.isArray(x.body) && x.body[0] && x.body[0].instances &&
                    x.body.map((s) => `${s.name} → ${s.instances.map((i) => i.host + ":" + i.port).join(", ")}`).join(" · ")}
                  {x.body && x.body.circuitBreakers && <>circuit: {x.body.circuitBreakers.map((c) => c.state).join(", ") || "—"}</>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="ro__hint">
        Fără Eureka: gateway-ul vede o singură adresă pentru fiecare serviciu — numele Service-ului din Kubernetes.
        Coșul și comenzile din magazin merg din nou (orders-service, RabbitMQ și Kafka sunt în cluster).
      </p>
    </section>
  );
}
