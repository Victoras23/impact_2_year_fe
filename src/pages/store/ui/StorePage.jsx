import { useState } from "react";
import { seedProducts } from "../../../entities/product/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { ProductGrid } from "../../../widgets/product-grid/index.js";
import { AddProductForm, ProductAdminList } from "../../../features/product-crud/index.js";
import { LessonSection } from "../../lesson/index.js";
import "./StorePage.css";

export function StorePage() {
  const { shows } = useLesson();
  const [products, setProducts] = useState(seedProducts);

  const replace = (id, patch) => setProducts((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const patch   = (id, p)     => setProducts((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const remove  = (id)        => setProducts((p) => p.filter((x) => x.id !== id));
  const create  = (draft)     => setProducts((p) => [draft, ...p]);

  return (
    <main className="store">
      <section id="lesson" className="store__section">
        <LessonSection />
      </section>

      {shows("catalog") && (
        <section id="catalog" className="store__section">
          <div className="section-head">
            <h1>Catalog</h1>
            <p>Vitrina magazinului.</p>
          </div>
          <ProductGrid products={products} />
        </section>
      )}

      {shows("admin") && (
        <section id="admin" className="store__section">
          <div className="section-head">
            <h2>Administrare produse</h2>
            <p>Fiecare acțiune trimite un verb HTTP diferit.</p>
          </div>
          <div className="store__admin">
            <div className="store__admin-form">
              <h3>Produs nou</h3>
              <AddProductForm onCreated={create} />
            </div>
            <div className="store__admin-grid">
              <ProductAdminList products={products} onReplace={replace} onPatch={patch} onRemove={remove} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
