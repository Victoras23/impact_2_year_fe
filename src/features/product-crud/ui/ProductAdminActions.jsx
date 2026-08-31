import { useState } from "react";
import { Button } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { usePractice } from "../../../entities/api-practice/index.js";
import { productCrudApi } from "../api/productCrudApi.js";
import { CrudNote } from "./AddProductForm.jsx";
import "./crud.css";

// Acțiuni pe un produs existent: fiecare buton trimite un verb HTTP diferit.
export function ProductAdminActions({ product, onReplace, onPatch, onRemove }) {
  const { baseUrl } = useApiBase();
  const { record } = usePractice();
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState("");

  async function run(kind) {
    setBusy(kind);
    let r;
    if (kind === "PUT") {
      r = await productCrudApi.replace(baseUrl, { id: product.id, name: product.name + " (revizuit)", price: product.price });
      if (r.passed || r.ok) onReplace && onReplace(product.id, { name: product.name + " (revizuit)" });
    } else if (kind === "PATCH") {
      const price = Math.round((product.price * 1.1) * 100) / 100;
      r = await productCrudApi.patch(baseUrl, { id: product.id, price });
      if (r.passed || r.ok) onPatch && onPatch(product.id, { price });
    } else {
      r = await productCrudApi.remove(baseUrl, { id: product.id });
      if (r.passed || r.ok) onRemove && onRemove(product.id);
    }
    record(kind, { ok: r.passed, status: r.status, text: r.text, ms: r.ms, error: r.error });
    setNote(r);
    setBusy("");
  }

  return (
    <div className="crud-actions">
      <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => run("PUT")}>PUT</Button>
      <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => run("PATCH")}>PATCH +10%</Button>
      <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => run("DELETE")}>DELETE</Button>
      {note ? <CrudNote result={note} /> : null}
    </div>
  );
}
