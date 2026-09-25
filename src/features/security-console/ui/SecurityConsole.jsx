import { Button, Card, Badge } from "../../../shared/ui/index.js";
import { useSecurityCheck } from "../model/useSecurityCheck.js";
import "./SecurityConsole.css";

export function SecurityConsole() {
  const { state, run } = useSecurityCheck();

  return (
    <Card className="security-console">
      <div className="security-console__head">
        <h3>Consolă de securitate</h3>
        <Button onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Se verifică…" : "Rulează verificarea"}
        </Button>
      </div>

      {state.kind === "idle" && (
        <p className="security-console__hint">
          Verifică live headerele de securitate și comportamentul la un parametru „otrăvit"
          (<code>?category=1 OR 1=1</code>) — direct împotriva backend-ului, nu simulat.
        </p>
      )}

      {state.kind === "down" && (
        <p className="security-console__hint">Backend-ul nu răspunde. Pornește-l și încearcă din nou.</p>
      )}

      {state.kind === "done" && (
        <div className="security-console__results">
          <div>
            <div className="security-console__section-title">Headere pe GET /api/v1/products</div>
            <ul className="security-console__list">
              {state.headerResults.map((h) => (
                <li key={h.key}>
                  <Badge tone={h.pass ? "ok" : "bad"}>{h.pass ? "✓" : "✗"}</Badge>
                  <span className="security-console__label">{h.label}</span>
                  <code className="security-console__value">{h.value || "(lipsește)"}</code>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="security-console__section-title">
              Headere pe GET /v3/api-docs (embedat în iframe de „Documentație API")
            </div>
            <ul className="security-console__list">
              {state.swaggerResults.map((h) => (
                <li key={h.key}>
                  <Badge tone={h.pass ? "ok" : "bad"}>{h.pass ? "✓" : "✗"}</Badge>
                  <span className="security-console__label">{h.label}</span>
                  <code className="security-console__value">
                    {h.describeAbsent ? (h.value || "lipsește — corect, altfel iframe-ul de mai sus n-ar merge") : (h.value || "(lipsește)")}
                  </code>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="security-console__section-title">
              GET /api/v1/products?category=1 OR 1=1
            </div>
            <ul className="security-console__list">
              <li>
                <Badge tone={state.sqliPass ? "ok" : "bad"}>{state.sqliPass ? "✓" : "✗"}</Badge>
                <span className="security-console__label">Status {state.sqliStatus}</span>
                <code className="security-console__value">
                  {state.sqliMessage || "(corp gol — exact defectul dinainte de remediere)"}
                </code>
              </li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
