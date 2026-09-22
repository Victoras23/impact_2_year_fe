import { useEffect, useState } from "react";
import { Modal, Button, Field, TextInput, TextArea } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { productCrudApi } from "../api/productCrudApi.js";
import { CrudNote } from "./CrudNote.jsx";
import "./crud.css";

// Un singur modal pentru „Produs nou" ȘI „Editează" — `product` fiind null
// deosebește cele două moduri. Trimiterea formularului nu apelează direct
// API-ul: întâi cere confirmare explicită ("Sigur? Da / Anulează"), exact ca
// pentru DELETE — o creare/editare e tot o acțiune care schimbă date reale.
export function ProductFormModal({ open, onClose, token, categories, product, onSaved }) {
  const { baseUrl } = useApiBase();
  const isEdit = !!product;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setPrice(String(product.price));
      setStock(String(product.stock));
      // GET /api/products întoarce numele categoriei, nu id-ul — îl regăsim după nume.
      const match = categories.find((c) => c.name === product.category);
      setCategoryId(match ? match.id : (categories[0] ? categories[0].id : ""));
      setDiscountPercentage(product.discountPercentage != null ? String(product.discountPercentage) : "");
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId(categories[0] ? categories[0].id : "");
      setDiscountPercentage("");
    }
    setStep("form");
    setResult(null);
    setBusy(false);
  }, [open, product, categories]);

  function submitForm(e) {
    e.preventDefault();
    setStep("confirm");
  }

  async function confirmSave() {
    setBusy(true);
    const payload = {
      name, description,
      price: Number(price), stock: Number(stock),
      categoryId: categoryId === "" ? null : Number(categoryId),
      discountPercentage: discountPercentage === "" ? null : Number(discountPercentage),
    };
    const r = isEdit
      ? await productCrudApi.update(baseUrl, token, product.id, payload)
      : await productCrudApi.create(baseUrl, token, payload);
    setBusy(false);
    setResult(r);
    if (r.ok) {
      onSaved && onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editează produs" : "Produs nou"}>
      {step === "form" && (
        <form className="crud-form" onSubmit={submitForm}>
          <Field label="Nume produs">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Descriere">
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Preț">
            <TextInput value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} required />
          </Field>
          <Field label="Stoc">
            <TextInput value={stock} inputMode="numeric" onChange={(e) => setStock(e.target.value)} required />
          </Field>
          <Field label="Categorie">
            <select className="ui-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Discount (%)" hint="Gol = fără reducere manuală. Are prioritate față de reducerea pe categorie.">
            <TextInput
              value={discountPercentage} inputMode="decimal" placeholder="ex. 15"
              onChange={(e) => setDiscountPercentage(e.target.value)}
            />
          </Field>
          <Button type="submit">{isEdit ? "Salvează modificările" : "Adaugă produsul"}</Button>
        </form>
      )}

      {step === "confirm" && (
        <div className="crud-confirm">
          <p>
            {isEdit
              ? <>Sigur vrei să salvezi modificările pentru <b>{name}</b>?</>
              : <>Sigur vrei să adaugi produsul <b>{name}</b>?</>}
            {discountPercentage !== "" ? <> Reducere: <b>{discountPercentage}%</b>.</> : null}
          </p>
          <div className="crud-confirm__actions">
            <Button onClick={confirmSave} disabled={busy}>{busy ? "Se trimite…" : "Da"}</Button>
            <Button variant="ghost" onClick={() => setStep("form")} disabled={busy}>Anulează</Button>
          </div>
          {result ? <CrudNote result={result} /> : null}
        </div>
      )}
    </Modal>
  );
}
