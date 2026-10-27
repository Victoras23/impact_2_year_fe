import { Badge, Button, Card } from "../../../shared/ui/index.js";
import { FRONTEND_HTTP_URL } from "../../../shared/config/index.js";
import { usePushConsole } from "../model/usePushConsole.js";
import "./PushConsole.css";

// Lecția 25 — consola „Notificări push”: ce îi trebuie browserului, abonarea acestui browser,
// notificările care sosesc aici și ce a răspuns Firebase serverului.
export function PushConsole() {
  const p = usePushConsole();
  const latest = p.received[0];
  return (
    <Card className="push">
      <div className="push__head"><h3>Consolă notificări push</h3></div>
      {latest && Date.now() - latest.receivedAt < 6000 && (
        <div className="push__toast" role="status">
          <b>{latest.title}</b><span>{latest.body}</span>
        </div>
      )}
      <ChecksPanel p={p} />
      <DevicePanel p={p} />
      <InboxPanel p={p} />
      <ServerLogPanel p={p} />
    </Card>
  );
}

function PanelHead({ step, title, children }) {
  return (
    <div className="push__panel-head">
      <span className="push__step">{step}</span>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

const yes = (ok, label) => <Badge tone={ok ? "ok" : "bad"}>{label}</Badge>;

function ChecksPanel({ p }) {
  const c = p.config && p.config.body;
  const onFile = p.env.protocol === "file:";
  const rows = [
    ["Pagina e pe http(s), nu pe file://", yes(p.env.secure, p.env.protocol.replace(":", ""))],
    ["Browserul are service worker", yes(p.env.serviceWorker, p.env.serviceWorker ? "da" : "nu")],
    ["Permisiunea pentru notificări", yes(p.env.permission === "granted", p.env.permission)],
    ["Backend-ul are cheia Firebase", c ? yes(c.serverEnabled, c.serverEnabled ? "da" : "nu — DISABLED") : yes(false, String(p.config ? p.config.status : "…"))],
    ["Configurația Firebase pentru browser", c ? yes(c.webConfigured, c.webConfigured ? c.firebase.projectId : "lipsește") : "—"],
  ];
  return (
    <section className="push__panel">
      <PanelHead step="1" title="Ce îi trebuie browserului" />
      <table className="push__table">
        <tbody>{rows.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody>
      </table>
      {onFile && (
        <p className="push__hint push__hint--bad">
          Pagina e deschisă cu dublu-click (<code>file://</code>) — acolo browserul nu pornește service workeri.
          Deschide <a href={FRONTEND_HTTP_URL}>{FRONTEND_HTTP_URL}</a> (containerul <code>frontend</code> din infra).
        </p>
      )}
      {p.env.permission === "denied" && (
        <p className="push__hint push__hint--bad">
          Ai apăsat „Blochează”. Pagina nu mai poate întreba a doua oară — schimbă din lacătul de lângă adresă → Notificări → Permite.
        </p>
      )}
    </section>
  );
}

function DevicePanel({ p }) {
  const c = p.config && p.config.body;
  const ready = c && c.webConfigured && p.env.secure && p.isAuthed;
  const devices = (p.mine && p.mine.devices) || [];
  const mineHere = p.fcmToken && devices.some((d) => p.fcmToken.startsWith(d.tokenStart.replace("…", "")));
  return (
    <section className="push__panel">
      <PanelHead step="2" title="Abonează acest browser">
        {mineHere
          ? <Button size="sm" variant="ghost" disabled={p.busy} onClick={p.disable}>Oprește notificările</Button>
          : <Button size="sm" disabled={!ready || p.busy} onClick={p.enable}>Activează notificările</Button>}
      </PanelHead>
      {!p.isAuthed && <p className="push__hint push__hint--bad">Autentifică-te: token-ul browserului se leagă de contul tău.</p>}
      {p.problem && (
        <p className="push__hint push__hint--bad">
          {p.problem.step === "permission" && <>Permisiune: <b>{p.problem.permission}</b> — fără „Permite” nu există token.</>}
          {p.problem.step === "support" && <>Browserul nu suportă Firebase Messaging aici.</>}
          {p.problem.step === "token" && <>getToken a eșuat: {p.problem.error}</>}
          {p.problem.step === "server" && <>Serverul a răspuns {p.problem.status} la salvarea token-ului.</>}
        </p>
      )}
      {p.busy && <p className="push__verdict">Se abonează… (permisiune → service worker → Firebase → serverul nostru)</p>}
      {mineHere && (
        <p className="push__verdict">
          Token-ul acestui browser: <code>{p.fcmToken.slice(0, 24)}…</code> ({p.fcmToken.length} caractere)
          {p.enableMs != null && <> — abonat în <b>{(p.enableMs / 1000).toFixed(1)} s</b></>}
        </p>
      )}
      {devices.length > 0 && (
        <table className="push__table">
          <thead><tr><th>Dispozitiv</th><th>Token</th><th>Înregistrat</th><th>Văzut ultima dată</th></tr></thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.device || "?"}{mineHere && p.fcmToken.startsWith(d.tokenStart.replace("…", "")) && <> <Badge tone="accent">acesta</Badge></>}</td>
                <td><code>{d.tokenStart}</code></td>
                <td>{new Date(d.createdAt).toLocaleTimeString()}</td>
                <td>{new Date(d.lastSeenAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="push__hint">Deschide pagina și în alt browser (același cont): apar două dispozitive, iar notificarea ajunge la amândouă.</p>
    </section>
  );
}

function InboxPanel({ p }) {
  const a = p.action;
  return (
    <section className="push__panel">
      <PanelHead step="3" title="Notificări sosite în acest browser">
        <Button size="sm" variant="ghost" disabled={!p.isAuthed} onClick={p.test}>Trimite un test</Button>
        <Button size="sm" disabled={!p.isAuthed} onClick={p.order}>Plasează o comandă de test</Button>
      </PanelHead>
      {a && a.kind === "order" && (
        <p className="push__verdict">
          {a.status === 202
            ? <>Comanda <b>#{a.body.id}</b> ({a.product}) — 202 PENDING. Urmează două notificări: „am primit-o” și „confirmată”.</>
            : <span className="push__bad">Comanda: răspuns {a.status} {a.error || ""}</span>}
        </p>
      )}
      {a && a.kind === "test" && a.body && (
        <p className="push__verdict">Test: serverul a răspuns în {a.ms} ms — <b>{a.body.result}</b> ({a.body.delivered}/{a.body.devices} dispozitive).</p>
      )}
      {p.received.length > 0 ? (
        <ul className="push__inbox">
          {p.received.map((m, i) => (
            <li key={i}>
              <time>{new Date(m.receivedAt).toLocaleTimeString()}</time>
              <Badge tone={m.shownBySystem ? "neutral" : "accent"}>{m.shownBySystem ? "notificare de sistem" : "în pagină"}</Badge>
              <b>{m.title}</b> <span>{m.body}</span>
              {m.elapsedMs != null && <em> · la {(m.elapsedMs / 1000).toFixed(1)} s după comandă</em>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="push__hint">Nimic încă. Tab-ul vizibil → notificarea apare aici. Tab-ul în fundal / minimizat → o arată sistemul de operare.</p>
      )}
    </section>
  );
}

const RESULT_TONE = { SENT: "ok", PARTIAL: "accent", NO_DEVICE: "neutral", FAILED: "bad", DISABLED: "bad" };

function ServerLogPanel({ p }) {
  const messages = (p.mine && p.mine.messages) || [];
  return (
    <section className="push__panel">
      <PanelHead step="4" title="Jurnalul serverului: ce a răspuns Firebase" />
      {messages.length > 0 ? (
        <table className="push__table">
          <thead><tr><th>Ora</th><th>Comanda</th><th>Notificarea</th><th>Rezultat</th><th>Livrat</th><th>Token-uri șterse</th></tr></thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleTimeString()}</td>
                <td>{m.orderId ? "#" + m.orderId : "—"}</td>
                <td>{m.title}</td>
                <td><Badge tone={RESULT_TONE[m.result] || "neutral"}>{m.result}</Badge>{m.error && <div className="push__err">{m.error}</div>}</td>
                <td>{m.delivered}/{m.devices}</td>
                <td>{m.removedTokens || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="push__hint">Fără notificări trimise pentru contul tău.</p>
      )}
      <p className="push__hint">
        „Livrat” = Firebase a acceptat-o, nu că a văzut-o cineva. Un browser care s-a dezabonat → Firebase răspunde
        <code> UNREGISTERED</code> și serverul șterge token-ul. Un browser șters fără dezabonare rămâne „SENT” — Firebase nu
        află. Fără cheie Firebase în infra, totul apare <code>DISABLED</code>.
      </p>
    </section>
  );
}
