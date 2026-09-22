import { useState } from "react";
import { Button } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { productCrudApi } from "../api/productCrudApi.js";
import { CrudNote } from "./CrudNote.jsx";
import "./crud.css";

// Acțiuni pe un produs existent: „Editează" deschide modalul de formular
// (ProductFormModal, gestionat mai sus în ProductAdminList/StorePage — un
// singur modal partajat, nu unul per rând). „Șterge" cere confirmare inline
// înainte să trimită DELETE — o ștergere e ireversibilă, deci nu pleacă direct
// din primul click.
export function ProductAdminActions({ product, token, onEdit, onChanged }) {
  const { baseUrl } = useApiBase();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function confirmDelete() {
    setBusy(true);
    const r = await productCrudApi.remove(baseUrl, token, product.id);
    setBusy(false);
    setNote(r);
    setConfirmingDelete(false);
    if (r.ok) onChanged && onChanged();
  }

  if (confirmingDelete) {
    return (
      <div className="crud-actions">
        <span className="crud-confirm__inline">Sigur vrei să ștergi <b>{product.name}</b>?</span>
        <Button size="sm" onClick={confirmDelete} disabled={busy}>{busy ? "Se șterge…" : "Da"}</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>Anulează</Button>
        {note ? <CrudNote result={note} /> : null}
      </div>
    );
  }

  return (
    <div className="crud-actions">
      <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>Editează</Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>Șterge</Button>
      {note ? <CrudNote result={note} /> : null}
    </div>
  );
}
