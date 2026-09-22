import { Button, Card, Badge } from "../../../shared/ui/index.js";
import { useRefreshCheck } from "../model/useRefreshCheck.js";
import "./RefreshConsole.css";

export function RefreshConsole() {
  const { state, run, isAuthed } = useRefreshCheck();

  return (
    <Card className="refresh-console">
      <div className="refresh-console__head">
        <h3>Consolă refresh token</h3>
        <Button onClick={run} disabled={!isAuthed || state.kind === "loading"}>
          {state.kind === "loading" ? "Se testează…" : "Testează rotația"}
        </Button>
      </div>

      {!isAuthed && (
        <p className="refresh-console__hint">
          Autentifică-te (colțul din dreapta sus) ca să testezi refresh tokenul.
        </p>
      )}

      {isAuthed && state.kind === "idle" && (
        <p className="refresh-console__hint">
          Trimite refresh tokenul curent la <code>POST /api/auth/refresh</code>, primește
          o pereche nouă, apoi retrimite tokenul <b>vechi</b> — direct împotriva backend-ului,
          ca să vezi rotația chiar are loc, nu doar să citești despre ea.
        </p>
      )}

      {state.kind === "down" && (
        <p className="refresh-console__hint">Backend-ul nu răspunde. Pornește-l și încearcă din nou.</p>
      )}

      {state.kind === "done" && (
        <ul className="refresh-console__list">
          <li>
            <Badge tone={state.newTokenReceived ? "ok" : "bad"}>{state.newTokenReceived ? "✓" : "✗"}</Badge>
            <span className="refresh-console__label">Pereche nouă primită (token + refresh token)</span>
            <code className="refresh-console__value">
              {state.newTokenReceived ? "…" + state.newRefreshToken.slice(-8) : state.newTokenMessage}
            </code>
          </li>
          {state.newTokenReceived && (
            <li>
              <Badge tone={state.reuseRejected ? "ok" : "bad"}>{state.reuseRejected ? "✓" : "✗"}</Badge>
              <span className="refresh-console__label">Refresh tokenul vechi, refolosit → respins (401)</span>
              <code className="refresh-console__value">
                {state.reuseRejected ? state.reuseMessage : "a fost acceptat din nou — status " + state.reuseStatus}
              </code>
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}
