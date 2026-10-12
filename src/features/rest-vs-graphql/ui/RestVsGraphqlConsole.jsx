import { useState } from "react";
import { Button, Card, Badge, Modal } from "../../../shared/ui/index.js";
import { joinUrl, useApiBase } from "../../../shared/api/index.js";
import { GRAPHIQL_PATH } from "../../../shared/config/index.js";
import { PRODUCT_FIELDS, DEFAULT_FIELDS, buildProductsQuery, CATEGORY_SCREEN_QUERY } from "../model/queries.js";
import { formatBytes, countLabel } from "../model/stats.js";
import { useFieldComparison } from "../model/useFieldComparison.js";
import { useCategoryScreen } from "../model/useCategoryScreen.js";
import { useBenchmark } from "../model/useBenchmark.js";
import { useTradeoffChecks } from "../model/useTradeoffChecks.js";
import "./RestVsGraphqlConsole.css";

const SIZES = [5, 20, 50];
const ITERATIONS = [10, 25, 50];

// Lecția 15 — consola „REST vs GraphQL”. Patru panouri, fiecare cu un buton
// care face cereri reale către backend — același tipar ca SecurityConsole
// (Lecția 10) și RefreshConsole (Lecția 11).
export function RestVsGraphqlConsole() {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [size, setSize] = useState(20);

  const toggleField = (key) =>
    setFields((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  return (
    <Card className="rvg">
      <div className="rvg__head">
        <h3>Consolă REST vs GraphQL</h3>
        <GraphiqlButton />
      </div>

      <OverFetchingPanel fields={fields} toggleField={toggleField} size={size} setSize={setSize} />
      <UnderFetchingPanel />
      <BenchmarkPanel fields={fields} size={size} />
      <TradeoffPanel />
    </Card>
  );
}

function GraphiqlButton() {
  const [open, setOpen] = useState(false);
  const { baseUrl } = useApiBase();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Deschide GraphiQL</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="GraphiQL — playground-ul GraphQL (doar profilul dev)" size="lg">
        {open ? <iframe className="rvg__graphiql" src={joinUrl(baseUrl, GRAPHIQL_PATH)} title="GraphiQL" /> : null}
      </Modal>
    </>
  );
}

function Chips({ options, value, onChange, format }) {
  return (
    <div className="rvg__chips">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={"rvg__chip" + (value === option ? " is-active" : "")}
          onClick={() => onChange(option)}
        >
          {format ? format(option) : option}
        </button>
      ))}
    </div>
  );
}

function PanelHead({ step, title, children }) {
  return (
    <div className="rvg__panel-head">
      <span className="rvg__step">{step}</span>
      <div>
        <div className="rvg__panel-title">{title}</div>
        <p className="rvg__hint">{children}</p>
      </div>
    </div>
  );
}

function StatusLine({ state }) {
  if (state.kind === "down") return <p className="rvg__hint">Backend-ul nu răspunde. Pornește-l și încearcă din nou.</p>;
  if (state.kind === "error") return <p className="rvg__hint rvg__hint--bad">{state.message}</p>;
  return null;
}

// --- 1. Over-fetching ---------------------------------------------------------

function OverFetchingPanel({ fields, toggleField, size, setSize }) {
  const { state, run } = useFieldComparison();
  const ratio = state.kind === "done" && state.graphql.bytes > 0
    ? (state.rest.bytes / state.graphql.bytes).toFixed(1) : null;

  return (
    <section className="rvg__panel">
      <PanelHead step="1" title="Over-fetching — cine decide ce câmpuri primești?">
        REST trimite mereu tot produsul. În GraphQL bifezi câmpurile — query-ul din dreapta se scrie singur.
      </PanelHead>

      <div className="rvg__split">
        <div>
          <div className="rvg__label">Câmpuri cerute</div>
          <div className="rvg__fields">
            {PRODUCT_FIELDS.map((f) => (
              <label key={f.key} className="rvg__field">
                <input type="checkbox" checked={fields.includes(f.key)} onChange={() => toggleField(f.key)} />
                <code>{f.label}</code>
              </label>
            ))}
          </div>
          <div className="rvg__label">Produse pe pagină</div>
          <Chips options={SIZES} value={size} onChange={setSize} />
        </div>
        <pre className="rvg__code">{buildProductsQuery(fields, size)}</pre>
      </div>

      <div className="rvg__actions">
        <Button onClick={() => run(fields, size)} disabled={state.kind === "loading" || fields.length === 0}>
          {state.kind === "loading" ? "Se compară…" : "Compară REST vs GraphQL"}
        </Button>
        {ratio && <span className="rvg__verdict">REST a trimis de <b>{ratio}×</b> mai mulți octeți pentru aceleași {countLabel(size, "produs", "produse")}.</span>}
      </div>
      <StatusLine state={state} />

      {state.kind === "done" && (
        <div className="rvg__compare">
          <ResultColumn
            title={"REST · GET /api/v1/products?size=" + size}
            rows={[["Cereri", 1], ["Octeți primiți", formatBytes(state.rest.bytes)], ["Timp", state.rest.ms + " ms"]]}
            sample={state.rest.sample}
          />
          <ResultColumn
            title="GraphQL · POST /graphql"
            rows={[["Cereri", 1], ["Octeți primiți", formatBytes(state.graphql.bytes)], ["Timp", state.graphql.ms + " ms"]]}
            sample={state.graphql.sample}
            error={state.graphql.error}
          />
        </div>
      )}
    </section>
  );
}

function ResultColumn({ title, rows, sample, error }) {
  return (
    <div className="rvg__column">
      <div className="rvg__column-title">{title}</div>
      <table className="rvg__table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><td>{k}</td><td><b>{v}</b></td></tr>
          ))}
        </tbody>
      </table>
      {error && <p className="rvg__hint rvg__hint--bad">{error}</p>}
      {sample && (
        <>
          <div className="rvg__label">Primul produs, exact cum a venit</div>
          <pre className="rvg__code rvg__code--small">{JSON.stringify(sample, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

// --- 2. Under-fetching --------------------------------------------------------

function UnderFetchingPanel() {
  const { state, run } = useCategoryScreen();
  return (
    <section className="rvg__panel">
      <PanelHead step="2" title="Under-fetching — un ecran, câte cereri?">
        Ecranul „toate categoriile, fiecare cu produsele ei”. REST n-are un endpoint pentru asta, deci clientul
        face o cascadă. GraphQL cere totul o dată.
      </PanelHead>

      <div className="rvg__split">
        <pre className="rvg__code">{"// REST\nGET /api/v1/categories\nGET /api/v1/products?category=1\nGET /api/v1/products?category=2\nGET /api/v1/products?category=…"}</pre>
        <pre className="rvg__code">{"# GraphQL\n" + CATEGORY_SCREEN_QUERY}</pre>
      </div>

      <div className="rvg__actions">
        <Button onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Se încarcă ecranul…" : "Încarcă ecranul în ambele feluri"}
        </Button>
        {state.kind === "done" && (
          <span className="rvg__verdict">
            REST: <b>{state.rest.requests} cereri</b> · GraphQL: <b>1 cerere</b> — aceleași {countLabel(state.graphql.categories, "categorie", "categorii")} și {countLabel(state.graphql.products, "produs", "produse")}.
          </span>
        )}
      </div>
      <StatusLine state={state} />

      {state.kind === "done" && (
        <>
          <div className="rvg__compare">
            <ResultColumn
              title="REST — cascadă de cereri"
              rows={[["Cereri HTTP", state.rest.requests], ["Octeți primiți", formatBytes(state.rest.bytes)], ["Timp total", state.rest.ms + " ms"]]}
            />
            <ResultColumn
              title="GraphQL — un singur query"
              rows={[["Cereri HTTP", state.graphql.requests], ["Octeți primiți", formatBytes(state.graphql.bytes)], ["Timp total", state.graphql.ms + " ms"]]}
            />
          </div>
          <ul className="rvg__preview">
            {state.preview.map((c) => <li key={c.name}><b>{c.name}</b> — {countLabel(c.count, "produs", "produse")}</li>)}
          </ul>
          <p className="rvg__hint">
            Pe backend, produsele tuturor categoriilor vin dintr-un <b>singur</b> query SQL
            (<code>@BatchMapping</code>) — altfel am fi mutat N+1-ul din Lecția 13 din browser în server.
          </p>
        </>
      )}
    </section>
  );
}

// --- 3. Benchmark (checkpoint-ul) ---------------------------------------------

function BenchmarkPanel({ fields, size }) {
  const { state, run } = useBenchmark();
  const [iterations, setIterations] = useState(25);
  const running = state.kind === "running";

  return (
    <section className="rvg__panel rvg__panel--checkpoint">
      <PanelHead step="3" title="Benchmark — checkpoint-ul lecției">
        {countLabel(iterations, "cerere", "cereri")} REST și tot atâtea GraphQL, alternate, după câte o cerere de încălzire (cache-ul Redis
        se umple înainte să măsurăm). Folosește câmpurile și mărimea alese la pasul 1.
      </PanelHead>

      <div className="rvg__actions">
        <Chips options={ITERATIONS} value={iterations} onChange={setIterations} format={(n) => n + " runde"} />
        <Button onClick={() => run(fields, size, iterations)} disabled={running || fields.length === 0}>
          {running ? `Rulez… ${state.done}/${state.total}` : "Pornește benchmark-ul"}
        </Button>
      </div>
      <StatusLine state={state} />

      {state.kind === "done" && (
        <>
          <div className="rvg__scroll">
          <table className="rvg__table rvg__table--bench">
            <thead>
              <tr><th></th><th>Medie</th><th>Mediană</th><th>p95</th><th>Min</th><th>Max</th><th>Octeți / răspuns</th></tr>
            </thead>
            <tbody>
              {[["REST", state.rest], ["GraphQL", state.graphql]].map(([name, s]) => (
                <tr key={name}>
                  <td><b>{name}</b></td>
                  <td>{s.avg} ms</td><td>{s.median} ms</td><td>{s.p95} ms</td><td>{s.min} ms</td><td>{s.max} ms</td>
                  <td>{formatBytes(s.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="rvg__hint">
            <b>Cum citim rezultatul, cinstit:</b> pe localhost, timpul e dominat de server, nu de rețea — iar GraphQL
            are o muncă în plus (parsează și validează query-ul la fiecare cerere). Câștigul lui real e în
            <b> octeți</b> și în <b>numărul de cereri</b> (pasul 2) — lucruri care contează mult pe un telefon cu 3G,
            nu pe laptopul de lângă server. Nicio tehnologie nu e „mai rapidă” în general.
          </p>
        </>
      )}
    </section>
  );
}

// --- 4. Trade-off-uri ---------------------------------------------------------

function TradeoffPanel() {
  const { state, run } = useTradeoffChecks();
  return (
    <section className="rvg__panel">
      <PanelHead step="4" title="Trade-off-uri — aceeași situație, două răspunsuri">
        Fiecare rând trimite aceeași „problemă” la ambele API-uri. ✓ = backend-ul se comportă exact cum explicăm la lecție.
      </PanelHead>
      <div className="rvg__actions">
        <Button onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Se verifică…" : "Rulează verificările"}
        </Button>
      </div>
      <StatusLine state={state} />

      {state.kind === "done" && (
        <ul className="rvg__checks">
          {state.rows.map((row) => (
            <li key={row.id}>
              <div className="rvg__check-head">
                <Badge tone={row.pass ? "ok" : "bad"}>{row.pass ? "✓" : "✗"}</Badge>
                <b>{row.title}</b>
              </div>
              <div className="rvg__check-grid">
                <span>REST</span><code>{row.rest}</code>
                <span>GraphQL</span><code>{row.graphql}</code>
              </div>
              <p className="rvg__hint">{row.lesson}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
