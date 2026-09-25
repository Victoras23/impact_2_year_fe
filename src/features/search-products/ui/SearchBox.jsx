import { TextInput } from "../../../shared/ui/index.js";
import "./SearchBox.css";

// Lecția 12 — checkpoint-ul lecției: căutare (GET /api/v1/products?search=...),
// backată de un index GIN pe trigrame (idx_products_name_trgm). Valoarea
// afișată e cea tastată; căutarea reală pleacă abia după o scurtă pauză
// (vezi useDebouncedValue în StorePage) — nu la fiecare literă.
export function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Caută produse după nume…"
        aria-label="Caută produse după nume"
      />
      {value ? (
        <button type="button" className="search-box__clear" onClick={() => onChange("")} aria-label="Golește căutarea">
          ×
        </button>
      ) : null}
    </div>
  );
}
