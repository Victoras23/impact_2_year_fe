import { useState } from "react";
import { Card, Badge, Field, TextInput } from "../../../shared/ui/index.js";
import { useApiBase, joinUrl, request } from "../../../shared/api/index.js";
import { PRACTICE_PATH, PRACTICE_EXPECTATIONS } from "../../../shared/config/index.js";
import { PRACTICE_METHODS, matchesExpectation, usePractice } from "../../../entities/api-practice/index.js";
import "./Lesson1Console.css";

const DEFAULT_BODY = {
  POST:   '{ "name": "Tricou", "price": 19.99 }',
  PUT:    '{ "id": 1, "name": "Tricou nou" }',
  PATCH:  '{ "price": 24.50 }',
  DELETE: '{ "id": 1 }',
};

export function Lesson1Console() {
  const { baseUrl, setBaseUrl } = useApiBase();
  const { log, record, reset } = usePractice();
  const [path, setPath] = useState(PRACTICE_PATH);
  const [bodies, setBodies] = useState(DEFAULT_BODY);
  const [busy, setBusy] = useState(false);

  const url = joinUrl(baseUrl, path);
  const done = PRACTICE_METHODS.filter((m) => log[m] && log[m].ok).length;

  async function send(method) {
    const res = await request(url, { method, body: method === "GET" ? undefined : bodies[method] });
    record(method, {
      ok: res.ok && matchesExpectation(method, res.text),
      status: res.status, text: res.text, ms: res.ms, error: res.error,
    });
  }
  async function runAll() {
    setBusy(true);
    for (const m of PRACTICE_METHODS) { await send(m); }
    setBusy(false);
  }

  return (
    <Card className="l1">
      <div className="l1__head">
        <div>
          <h2>Consola API · Lecția 1</h2>
          <p>Tema: implementați cele 5 rute în backend până când toate cardurile devin verzi.</p>
        </div>
        <div className="l1__progress">
          <div className="l1__bar"><div className="l1__fill" style={{ width: (done / 5 * 100) + "%" }} /></div>
          <span>{done} / 5</span>
        </div>
      </div>

      <div className="l1__config">
        <Field label="Adresa backend-ului">
          <TextInput value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </Field>
        <Field label="Calea (path)">
          <TextInput value={path} onChange={(e) => setPath(e.target.value)} />
        </Field>
        <div className="l1__url"><span>URL apelat</span><code>{url}</code></div>
        <div className="l1__run">
          <button disabled={busy} onClick={runAll}>{busy ? "Se trimit…" : "Trimite toate cererile"}</button>
          <button className="l1__reset" onClick={reset}>Resetează</button>
        </div>
      </div>

      <div className="l1__cards">
        {PRACTICE_METHODS.map((m) => (
          <MethodRow key={m} method={m} body={bodies[m]} result={log[m]}
            onBody={(v) => setBodies((b) => ({ ...b, [m]: v }))} onSend={() => send(m)} />
        ))}
      </div>
    </Card>
  );
}

function MethodRow({ method, body, result, onBody, onSend }) {
  const exp = PRACTICE_EXPECTATIONS[method];
  const cls = !result ? "idle" : result.error ? "err" : result.ok ? "ok" : "bad";
  return (
    <article className={"l1-row l1-row--" + cls}>
      <div className="l1-row__head">
        <span className={"l1-row__verb l1-row__verb--" + method}>{method}</span>
        <code>{exp.label}</code>
        <span className="l1-row__flag">{cls === "ok" ? "✓" : (cls === "bad" || cls === "err") ? "✗" : ""}</span>
      </div>
      {method !== "GET"
        ? <textarea rows="2" spellCheck="false" value={body} onChange={(e) => onBody(e.target.value)} />
        : null}
      <div className="l1-row__foot">
        <button onClick={onSend}>Trimite {method}</button>
        {result ? (
          result.error
            ? <span className="l1-row__msg bad">Eroare: {result.error}</span>
            : <span className={"l1-row__msg " + (result.ok ? "ok" : "bad")}>
                <b>{result.status}</b> · {result.ms} ms · <code>{result.text || "(gol)"}</code>
              </span>
        ) : <span className="l1-row__msg muted">încă nu a fost trimisă</span>}
      </div>
    </article>
  );
}
