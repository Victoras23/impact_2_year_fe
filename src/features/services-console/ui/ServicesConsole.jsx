import { Badge, Button, Card } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { useEurekaServices, useRedeployWatch, useRouteTrace, WATCH_SECONDS } from "../model/useServicesConsole.js";
import { eurekaUrl } from "../model/servicesApi.js";
import "./ServicesConsole.css";

// Lecția 21 — consola „Servicii”. Trei panouri, cu cereri reale prin gateway — același
// tipar ca consolele din Lecțiile 16–19.
export function ServicesConsole() {
  return (
    <Card className="svc">
      <div className="svc__head"><h3>Consolă servicii</h3></div>
      <EurekaPanel />
      <TracePanel />
      <RedeployPanel />
    </Card>
  );
}

const SERVICE_CLASS = { gateway: "is-gw", monolith: "is-mono", "orders-service": "is-orders" };

function shortId(instanceId) {
  const id = String(instanceId || "?");
  const part = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return part.length > 12 ? part.slice(0, 12) : part;
}

function ago(iso, now) {
  if (!iso) return "pornește…";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `acum ${s} s`;
  if (s < 3600) return `acum ${Math.floor(s / 60)} min`;
  return `acum ${Math.floor(s / 3600)} h`;
}

function PanelHead({ step, title, children }) {
  return (
    <div className="svc__panel-head">
      <span className="svc__step">{step}</span>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function Down() {
  return (
    <p className="svc__hint svc__hint--bad">
      Gateway-ul nu răspunde. Din <code>impact_2_year_infra</code>: <code>docker compose up -d --build</code>, apoi
      așteaptă ~1 minut să se înregistreze toate serviciile în Eureka.
    </p>
  );
}

function NoGateway({ status }) {
  return (
    <p className="svc__hint svc__hint--bad">
      Adresa API ({status}) nu e gateway-ul: <code>/gateway/services</code> nu există. Din Lecția 21 frontendul vorbește
      cu gateway-ul, pe portul <b>8080</b> (monolitul e acum pe 8081, comenzile pe 8082).
    </p>
  );
}

function EurekaPanel() {
  const { baseUrl } = useApiBase();
  const { state, live, setLive } = useEurekaServices();
  return (
    <section className="svc__panel">
      <PanelHead step="1" title="Ce știe Eureka (live, la 2 s)">
        <Button size="sm" variant="ghost" onClick={() => setLive(!live)}>{live ? "Pauză" : "Pornește"}</Button>
        <a className="svc__link" href={eurekaUrl(baseUrl)} target="_blank" rel="noreferrer">Dashboard Eureka ↗</a>
      </PanelHead>
      <p className="svc__hint">
        Fiecare serviciu se înscrie în Eureka la pornire, cu versiunea lui. Gateway-ul citește lista și trimite
        cererile după <b>nume</b> (<code>lb://orders-service</code>), nu după IP. Încearcă:{" "}
        <code>MONOLITH_REPLICAS=1 ORDERS_REPLICAS=2 docker compose up -d</code> — apare a doua instanță de comenzi.
      </p>
      {state.kind === "down" && <Down />}
      {state.kind === "no-gateway" && <NoGateway status={state.status} />}
      {state.kind === "ok" && (
        <table className="svc__table">
          <thead><tr><th>Serviciu</th><th>Instanța</th><th>Adresa</th><th>Versiune</th><th>Pornit</th></tr></thead>
          <tbody>
            {state.services.flatMap((s) => (s.instances.length ? s.instances : [null]).map((i, k) => (
              <tr key={s.name + k} className={i && i.fresh ? "is-fresh" : ""}>
                <td>{k === 0 && <span className={"svc__name " + (SERVICE_CLASS[s.name] || "")}>{s.name}</span>}</td>
                {i ? <>
                  <td><code>{shortId(i.instanceId)}</code></td>
                  <td><code>{i.host}:{i.port}</code></td>
                  <td><b>{i.version}</b></td>
                  <td>{ago(i.startedAt, state.at)}{i.fresh && <Badge tone="ok">(re)pornit</Badge>}</td>
                </> : <td colSpan={4}>nicio instanță</td>}
              </tr>
            )))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function routeVerdict(r) {
  if (r.skipped) return <span className="svc__muted">autentifică-te ca să trimiți token-ul</span>;
  if (r.expect === null) {
    if (r.status === 404) return <Badge tone="ok">404 — închisă de gateway ({r.route || "fără rută"})</Badge>;
    if (r.status === 0) return <Badge tone="neutral">fără răspuns vizibil (gateway vechi, fără CORS pe 404)</Badge>;
    return <Badge tone="bad">{r.status} — ruta internă e accesibilă din browser!</Badge>;
  }
  if (r.status === 0) return <Badge tone="bad">fără răspuns</Badge>;
  return r.route === r.expect
    ? <Badge tone="ok">{r.route}</Badge>
    : <Badge tone="bad">{r.route || "fără gateway"} (aștepta {r.expect})</Badge>;
}

function TracePanel() {
  const { state, run, loggedIn } = useRouteTrace();
  return (
    <section className="svc__panel">
      <PanelHead step="2" title="Unde ajunge fiecare cerere?">
        <Button size="sm" onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Se trimite…" : "Trimite 6 cereri"}
        </Button>
      </PanelHead>
      <p className="svc__hint">
        Aceeași adresă pentru toate. Gateway-ul alege serviciul după cale și pune în răspuns{" "}
        <code>X-Gateway-Route</code>; serviciul pune <code>X-Instance-Id</code>. Rutele <code>/internal/**</code> le
        folosește doar serviciul de comenzi, din interior — din browser trebuie să dea 404.
        {!loggedIn && " Autentifică-te ca să vezi și rutele cu JWT."}
      </p>
      {state.kind === "down" && <Down />}
      {state.rows.length > 0 && (
        <table className="svc__table">
          <thead><tr><th>Cerere</th><th>Cale</th><th>Status</th><th>Rută (gateway)</th><th>Instanța</th><th>ms</th></tr></thead>
          <tbody>
            {state.rows.map((r) => (
              <tr key={r.path}>
                <td>{r.label}</td><td><code>{r.path}</code></td>
                <td>{r.skipped ? "—" : r.status}</td><td>{routeVerdict(r)}</td>
                <td>{r.instance ? <code>{shortId(r.instance)}</code> : "—"}</td><td>{r.skipped ? "—" : r.ms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RedeployPanel() {
  const { state, run, cancel, watched } = useRedeployWatch();
  const running = state.kind === "running";
  return (
    <section className="svc__panel">
      <PanelHead step="3" title={`Redeploy doar comenzile (${WATCH_SECONDS} s)`}>
        {running
          ? <Button size="sm" variant="ghost" onClick={cancel}>Oprește</Button>
          : <Button size="sm" onClick={run}>Pornește urmărirea</Button>}
      </PanelHead>
      <p className="svc__hint">
        Pornește urmărirea, apoi crește versiunea în <code>impact_2_year_orders/pom.xml</code> (ex. 1.0.1) și rulează{" "}
        <code>docker compose up -d --build orders-service</code>. Fiecare pătrățel e o cerere: verde = 200, roșu =
        eroare. Catalogul trebuie să rămână verde tot timpul.
      </p>
      {state.kind !== "idle" && watched.map((w) => {
        const rows = state.series[w.key] || [];
        const bad = rows.filter((r) => r.status < 200 || r.status >= 300);
        const instances = [...new Set(rows.filter((r) => r.instance).map((r) => shortId(r.instance)))];
        return (
          <div key={w.key} className="svc__series">
            <div className="svc__series-label">
              <b>{w.label}</b> — {rows.length} cereri, <span className={bad.length ? "svc__bad" : "svc__good"}>{bad.length} erori</span>
              {instances.length > 0 && <> · instanțe: {instances.map((i) => <code key={i}>{i}</code>)}</>}
            </div>
            <div className="svc__strip">
              {rows.map((r, i) => (
                <span key={i} className={"svc__cell " + (r.status >= 200 && r.status < 300 ? "is-ok" : "is-err")}
                      title={`${Math.round((r.at - state.started) / 1000)} s · ${r.status || "fără răspuns"} · ${r.instance || "?"}`} />
              ))}
            </div>
          </div>
        );
      })}
      {state.kind === "done" && (
        <p className="svc__verdict">
          Cu o singură instanță de comenzi, repornirea o face indisponibilă câteva secunde (măsurat la noi: 15–27 s) — dar
          catalogul, conturile și coșul nu observă nimic. Cu două instanțe și o repornire pe rând nu ar fi nicio pauză:
          asta face Kubernetes (rolling update, Lecția 24).
        </p>
      )}
    </section>
  );
}
