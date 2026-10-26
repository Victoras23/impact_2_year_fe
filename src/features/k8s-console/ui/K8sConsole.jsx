import { useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { DEFAULT_API_BASE } from "../../../shared/config/index.js";
import { Badge, Button, Card } from "../../../shared/ui/index.js";
import { CLUSTER_API_BASE } from "../model/clusterApi.js";
import { useClusterWatch } from "../model/useK8sConsole.js";
import "./K8sConsole.css";

// Lecția 23 — consola „Kubernetes”: monolitul din clusterul kind (localhost:8081).
// Podul, nodul și configurația le spune chiar aplicația (/api/v1/cluster/info);
// ce faci în cluster faci din terminal, cu kubectl — consola doar arată efectul.
export function K8sConsole() {
  const watch = useClusterWatch();
  return (
    <Card className="k8s">
      <div className="k8s__head">
        <h3>Consolă Kubernetes</h3>
        <Button size="sm" variant="ghost" onClick={() => watch.setLive(!watch.live)}>
          {watch.live ? "Pauză" : "Pornește"}
        </Button>
      </div>
      <AddressBar />
      <PodPanel watch={watch} />
      <ConfigPanel watch={watch} />
      <DiscountPanel watch={watch} />
      <ErrorsPanel />
    </Card>
  );
}

function PanelHead({ step, title, children }) {
  return (
    <div className="k8s__panel-head">
      <span className="k8s__step">{step}</span>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function AddressBar() {
  const { baseUrl, setBaseUrl } = useApiBase();
  const onCluster = baseUrl.replace(/\/+$/, "") === CLUSTER_API_BASE;
  return (
    <div className="k8s__address">
      <span>Adresa API: <code>{baseUrl}</code></span>
      {onCluster
        ? <Button size="sm" variant="ghost" onClick={() => setBaseUrl(DEFAULT_API_BASE)}>Înapoi la gateway (8080)</Button>
        : <Button size="sm" onClick={() => setBaseUrl(CLUSTER_API_BASE)}>Folosește clusterul (8081)</Button>}
      <span className="k8s__hint k8s__hint--inline">Tot magazinul (catalogul, contul) folosește adresa aceasta.</span>
    </div>
  );
}

function since(iso) {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 120 ? s + " s" : Math.round(s / 60) + " min";
}

function PodPanel({ watch }) {
  const { state, history, events } = watch;
  const d = state.kind === "ok" ? state.data : null;
  return (
    <section className="k8s__panel">
      <PanelHead step="1" title="Cine răspunde (la 2 s)" />
      {state.kind === "down" && history.every((h) => !h.ok) && (
        <p className="k8s__hint k8s__hint--bad">
          Nu răspunde nimeni. Clusterul e pornit? <code>kubectl get pods -n impact</code> — toate trei trebuie să fie
          Running.
        </p>
      )}
      {state.kind === "error" && (
        <p className="k8s__hint k8s__hint--bad">
          {state.status === 404
            ? <>Răspuns 404: imaginea nu are încă Lecția 23. Construiește-o din nou (<code>docker build -t impact-monolith:1.0.1 ../impact_2_year_be</code>),{" "}
                <code>kind load docker-image impact-monolith:1.0.1 --name impact</code> și schimbă tag-ul în deployment.yaml.</>
            : <>Răspuns {state.status}.</>}
        </p>
      )}
      {d && !d.inKubernetes && (
        <p className="k8s__hint k8s__hint--bad">
          Răspunde <b>{d.podName}</b>, dar nu din Kubernetes (lipsește <code>KUBERNETES_SERVICE_HOST</code>). Ești pe
          monolitul din docker compose — apasă „Folosește clusterul”.
        </p>
      )}
      {d && (
        <div className="k8s__pod">
          <div><span>pod</span><b>{d.podName}</b></div>
          <div><span>namespace</span><b>{d.namespace || "—"}</b></div>
          <div><span>nod</span><b>{d.nodeName || "—"}</b></div>
          <div><span>IP pod</span><b>{d.podIp || "—"}</b></div>
          <div><span>profil</span><b>{d.profile}</b></div>
          <div><span>pornit acum</span><b>{since(d.startedAt)}</b></div>
        </div>
      )}
      {history.length > 0 && (
        <div className="k8s__strip" title="ultimele 2 minute: verde = a răspuns, roșu = nimic">
          {history.map((h, i) => {
            // Albastru = primul răspuns de la un pod nou (față de ultimul pod care a răspuns).
            const before = history.slice(0, i).reverse().find((x) => x.ok);
            const changed = h.ok && before && before.pod !== h.pod;
            return <span key={i} className={(h.ok ? "is-ok" : "is-down") + (changed ? " is-new" : "")} />;
          })}
        </div>
      )}
      {events.length > 0 && (
        <ul className="k8s__events">
          {events.map((e, i) => (
            <li key={i}>
              <time>{new Date(e.at).toLocaleTimeString()}</time>
              {e.type === "down" && <><Badge tone="bad">nu răspunde</Badge> {e.pod} a dispărut</>}
              {e.type === "up" && <><Badge tone="ok">răspunde</Badge> după {(e.gapMs / 1000).toFixed(1)} s fără răspuns</>}
              {e.type === "new" && <><Badge tone="accent">pod nou</Badge> <b>{e.pod}</b> (în locul lui {e.from})</>}
            </li>
          ))}
        </ul>
      )}
      <p className="k8s__hint">
        Șterge podul: <code>kubectl delete pod -n impact -l app=monolith</code>. Nu-l pornești tu înapoi — Deployment-ul
        vede că are 0 poduri din 1 și face altul, cu alt nume.
      </p>
    </section>
  );
}

function ConfigPanel({ watch }) {
  const d = watch.state.kind === "ok" ? watch.state.data : null;
  if (!d) return null;
  return (
    <section className="k8s__panel">
      <PanelHead step="2" title="De unde vine configurația" />
      <table className="k8s__table">
        <thead><tr><th>Variabilă de mediu</th><th>Valoare</th><th>Sursa</th></tr></thead>
        <tbody>
          {d.config.map((c) => (
            <tr key={c.key}>
              <td><code>{c.env}</code></td><td>{c.value}</td>
              <td>{c.fromEnv ? <Badge tone="ok">ConfigMap / env</Badge> : <Badge tone="neutral">application.yaml</Badge>}</td>
            </tr>
          ))}
          {d.secrets.map((s) => (
            <tr key={s.key}>
              <td><code>{s.env}</code></td>
              <td><span className="k8s__secret">•••••• amprentă {s.fingerprint || "—"}</span></td>
              <td>{s.fromEnv ? <Badge tone="accent">Secret / env</Badge> : <Badge tone="neutral">application.yaml</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="k8s__hint">
        Valorile secrete nu pleacă din pod — doar o amprentă (8 caractere din SHA-256). Dar în cluster nu sunt ascunse:{" "}
        <code>kubectl get secret monolith-secret -n impact -o yaml</code> arată base64, iar <code>base64 -d</code> le
        citește. Totul s-a citit o singură dată, la pornirea podului (acum {since(d.startedAt)}).
      </p>
    </section>
  );
}

function DiscountPanel({ watch }) {
  const { state, prices, clear } = watch;
  const [cleared, setCleared] = useState(null);
  const d = state.kind === "ok" ? state.data : null;
  if (!d) return null;
  const category = d.config.find((c) => c.key === "app.discount.category-name");
  const percentage = d.config.find((c) => c.key === "app.discount.percentage");
  // În bani întregi, ca backend-ul (BigDecimal, HALF_UP) — fără erori de virgulă mobilă.
  const expected = (p) => (Math.round(Math.round(p.price * 100) * (100 - Number(percentage.value)) / 100) / 100).toFixed(2);
  const matches = (p) => Math.abs(Number(p.finalPrice) - Number(expected(p))) < 0.005;
  const stale = prices && prices.some((p) => !p.discountPercentage && !matches(p));
  return (
    <section className="k8s__panel">
      <PanelHead step="3" title="ConfigMap → reducerea din catalog">
        <Button size="sm" variant="ghost" onClick={async () => setCleared(await clear())}>Golește cache-ul</Button>
      </PanelHead>
      <p className="k8s__verdict">
        Podul <b>{d.podName}</b> vede: <b>{percentage.value}%</b> reducere la „{category.value}”.
      </p>
      {prices && prices.length > 0 && (
        <table className="k8s__table">
          <thead><tr><th>Produs</th><th>Preț</th><th>Preț final (din API)</th><th>Cu {percentage.value}%</th></tr></thead>
          <tbody>
            {prices.map((p) => {
              const manual = !!p.discountPercentage;
              const ok = manual || matches(p);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.price}</td>
                  <td className={ok ? "k8s__good" : "k8s__bad"}>{p.finalPrice}</td>
                  <td>{manual ? <span title="reducere manuală (Lecția 11) — are prioritate">manual −{p.discountPercentage}%</span> : expected(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {stale && (
        <p className="k8s__verdict k8s__bad">
          Prețul din API e cel vechi: lista de produse e în cache-ul Redis (Lecția 3, 60 s) — și Redis n-a fost repornit
          odată cu podul. Așteaptă un minut sau golește cache-ul.
        </p>
      )}
      {cleared === false && <p className="k8s__hint k8s__hint--bad">Cache-ul nu s-a putut goli.</p>}
      <ol className="k8s__steps">
        <li>În <code>k8s/monolith/configmap.yaml</code> schimbă <code>APP_DISCOUNT_PERCENTAGE</code> (ex. <code>"30"</code>).</li>
        <li><code>kubectl apply -f k8s/monolith/configmap.yaml</code> — <b>nu se schimbă nimic</b>: podul și-a citit variabilele la pornire.</li>
        <li><code>kubectl rollout restart deployment/monolith -n impact</code> — pod nou, procent nou.</li>
      </ol>
    </section>
  );
}

const ERRORS = [
  ["CrashLoopBackOff", "Aplicația pornește și moare, iar Kubernetes așteaptă tot mai mult între încercări (10, 20, 40… s).",
    "kubectl logs -n impact deploy/monolith --previous"],
  ["ImagePullBackOff / ErrImagePull", "Imaginea nu e în cluster: ai uitat kind load, sau tag-ul e :latest.",
    "kind load docker-image impact-monolith:1.0.0 --name impact"],
  ["CreateContainerConfigError", "Lipsește un ConfigMap sau un Secret (nume greșit, sau încă neaplicat).",
    "kubectl describe pod -n impact -l app=monolith"],
  ["Pending", "Nu e loc pe niciun nod (requests prea mari) sau discul nu s-a creat.",
    "kubectl describe pod -n impact <pod>"],
];

function ErrorsPanel() {
  return (
    <section className="k8s__panel">
      <PanelHead step="4" title="Când un pod nu pornește" />
      <table className="k8s__table">
        <thead><tr><th>STATUS</th><th>Ce înseamnă</th><th>Prima comandă</th></tr></thead>
        <tbody>
          {ERRORS.map(([status, meaning, cmd]) => (
            <tr key={status}><td><b>{status}</b></td><td>{meaning}</td><td><code>{cmd}</code></td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
