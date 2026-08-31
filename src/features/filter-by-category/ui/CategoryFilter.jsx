import { cn } from "../../../shared/lib/index.js";
import "./CategoryFilter.css";

// Bară de filtre: "Toate" + câte un buton pentru fiecare categorie.
export function CategoryFilter({ categories, value, onChange }) {
  if (!categories || categories.length === 0) return null;
  return (
    <div className="category-filter" role="tablist" aria-label="Filtrează după categorie">
      <button
        className={cn("category-filter__chip", value === "all" && "is-active")}
        onClick={() => onChange("all")}
      >
        Toate
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          className={cn("category-filter__chip", String(value) === String(c.id) && "is-active")}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
