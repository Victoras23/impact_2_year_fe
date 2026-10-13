import { useEffect, useState } from "react";
import { Button, Card, Badge } from "../../../shared/ui/index.js";
import { useLoginBruteForce } from "../model/useLoginBruteForce.js";
import { useApiBurst, BURST_SIZE } from "../model/useApiBurst.js";
import "./RateLimitConsole.css";

// Lecția 16 — consola „Rate limiting”. Două panouri, ambele cu cereri reale către
// backend — același tipar ca SecurityConsole (Lecția 10) și RefreshConsole (Lecția 11).
export function RateLimitConsole() {
  return (
    <Card className="rl">
      <div className="rl__head">
        <h3>Consolă rate limiting</h3>
      </div>
      <LoginPanel />
      <BurstPanel />
    </Card>
  );
}

// Secundele rămase până la `timestamp`. Intervalul doar forțează o redesenare —
// timpul e citit mereu proaspăt, ca prima afișare să nu pornească de la o oră veche.
function useSecondsUntil(timestamp) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!timestamp) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(timer);
  }, [timestamp]);
  return timestamp ? Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)) : 0;
}

function StatusBadge({ status }) {
  const tone = status === 429 ? "accent" : status >= 200 && status < 300 ? "ok" : status === 401 ? "neutral" : "bad";
  return <Badge tone={tone}>{status}</Badge>;
}

function LoginPanel() {
  const { state, run, retry } = useLoginBruteForce();
  const secondsLeft = useSecondsUntil(state.retryAt);
  const busy = state.kind === "loading";

  return (
    <section className="rl__panel">
      <div className="rl__panel-head">
        <span className="rl__step">1</span>
        <h4>Brute force pe login</h4>
        <Button size="sm" onClick={run} disabled={busy}>
          {busy ? "Se trimite…" : "Trimite 7 parole greșite"}
        </Button>
      </div>
      <p className="rl__hint">
        Un „atacator” ghicește parola lui <code>user@impact.md</code>: 7 încercări la rând pe{" "}
        <code>POST /api/v1/auth/login</code>. Limita e de <b>5 pe minut, per IP</b> — deci și tu vei
        aștepta un minut înainte să te poți autentifica de pe acest calculator.
      </p>

      {state.kind === "down" && <p className="rl__hint rl__hint--bad">Backend-ul nu răspunde. Pornește-l și încearcă din nou.</p>}

      {state.rows.length > 0 && (
        <table className="rl__table">
          <thead>
            <tr><th>#</th><th>Status</th><th>X-RateLimit-Remaining</th><th>Retry-After</th><th>Mesaj</th></tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={row.index} className={row.status === 429 ? "is-blocked" : ""}>
                <td>{row.index}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>{row.remaining ?? "—"}</td>
                <td>{row.retryAfter ? row.retryAfter + " s" : "—"}</td>
                <td className="rl__msg">{row.message || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {state.kind === "done" && (
        <p className="rl__verdict">
          {state.blockedAt
            ? <>✓ Atacatorul a fost oprit la încercarea <b>{state.blockedAt}</b> — backend-ul n-a mai verificat parola deloc.</>
            : <>✗ Nicio încercare n-a primit 429 — rate limiting-ul nu e activ pe login.</>}
        </p>
      )}

      {state.kind === "done" && state.blockedAt && !state.afterWait && (
        <div className="rl__retry">
          <Button size="sm" variant="ghost" onClick={retry} disabled={secondsLeft > 0}>
            {secondsLeft > 0 ? "Găleata se reumple în " + secondsLeft + " s" : "Mai încearcă o dată"}
          </Button>
        </div>
      )}
      {state.afterWait && (
        <p className="rl__verdict">
          După așteptare: <StatusBadge status={state.afterWait.status} />{" "}
          {state.afterWait.status === 401
            ? <>— găleata s-a reumplut, parola e verificată din nou (mai sunt {state.afterWait.remaining}).</>
            : <>— încă blocat ({state.afterWait.message}).</>}
        </p>
      )}
    </section>
  );
}

function BurstPanel() {
  const { state, run } = useApiBurst();
  const busy = state.kind === "loading" || state.kind === "waiting";
  const results = state.results || [];

  return (
    <section className="rl__panel">
      <div className="rl__panel-head">
        <span className="rl__step">2</span>
        <h4>Rafală pe API (throttling)</h4>
        <Button size="sm" onClick={run} disabled={busy}>
          {state.kind === "loading" ? `Se trimit… ${state.done}/${BURST_SIZE}`
            : state.kind === "waiting" ? `Aștept Retry-After (${state.retryAfter} s)…`
            : `Trimite ${BURST_SIZE} de cereri GET`}
        </Button>
      </div>
      <p className="rl__hint">
        {BURST_SIZE} de cereri <code>GET /api/v1/categories</code>, cât de repede poate browserul.
        Limita generală e <b>100 pe minut</b>, dar se reumple <b>treptat</b> — nu aștepți un minut,
        ci doar până apare următorul jeton.
      </p>

      {state.kind === "down" && <p className="rl__hint rl__hint--bad">Backend-ul nu răspunde. Pornește-l și încearcă din nou.</p>}

      {results.length > 0 && (
        <div className="rl__strip" aria-label="statusul fiecărei cereri">
          {results.map((r, i) => (
            <span key={i} className={"rl__cell " + (r.status === 429 ? "is-blocked" : "is-ok")} title={`#${i + 1}: ${r.status}`} />
          ))}
        </div>
      )}

      {state.kind === "done" && (
        <ul className="rl__stats">
          <li><Badge tone="ok">{state.ok}</Badge> cereri au trecut (limita: {state.limit ?? "?"})</li>
          <li><Badge tone="accent">{state.blocked}</Badge> au primit 429{state.firstBlocked >= 0 ? `, prima la cererea #${state.firstBlocked + 1}` : ""}</li>
          <li>Toată rafala: {state.totalMs} ms</li>
          {state.recovery && (
            <li>
              După {state.retryAfter} s (Retry-After): <StatusBadge status={state.recovery.status} />{" "}
              {state.recovery.status === 200 ? "— merge din nou, fără să aștepți un minut întreg." : ""}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
