import { useState } from "react";
import { Button, Field, TextInput } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { makeProduct } from "../../../entities/product/index.js";
import { usePractice } from "../../../entities/api-practice/index.js";
import { productCrudApi } from "../api/productCrudApi.js";
import "./crud.css";

export function AddProductForm({ onCreated }) {
  const { baseUrl } = useApiBase();
  const { record } = usePractice();
  const [name, setName] = useState("Produs nou");
  const [price, setPrice] = useState("149");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const draft = makeProduct({ name, price });
    const r = await productCrudApi.create(baseUrl, { name: draft.name, price: draft.price });
    record("POST", { ok: r.passed, status: r.status, text: r.text, ms: r.ms, error: r.error });
    setNote(r);
    setBusy(false);
    if (r.passed || r.ok) onCreated && onCreated(draft);
  }

  return (
    <form className="crud-form" onSubmit={submit}>
      <Field label="Nume produs">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Preț">
        <TextInput value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <Button type="submit" disabled={busy}>{busy ? "Se trimite…" : "Adaugă produs (POST)"}</Button>
      {note ? <CrudNote result={note} /> : null}
    </form>
  );
}

export function CrudNote({ result }) {
  if (result.error) return <p className="crud-note crud-note--bad">Eroare de rețea: {result.error}</p>;
  return (
    <p className={"crud-note " + (result.passed ? "crud-note--ok" : "crud-note--bad")}>
      <b>{result.status}</b> · {result.ms} ms · <code>{result.text || "(gol)"}</code>
    </p>
  );
}
