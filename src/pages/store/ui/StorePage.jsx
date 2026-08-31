import { useCallback, useEffect, useState } from "react";
import { fetchProducts, seedProducts } from "../../../entities/product/index.js";
import { fetchCategories } from "../../../entities/category/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { Button } from "../../../shared/ui/index.js";
import { ProductGrid } from "../../../widgets/product-grid/index.js";
import { CategoryFilter } from "../../../features/filter-by-category/index.js";
import { AddProductForm, ProductAdminList } from "../../../features/product-crud/index.js";
import { LessonSection } from "../../lesson/index.js";
import "./StorePage.css";

// Catalogul + categoriile se încarcă din backend când secțiunea e vizibilă.
function useCatalog(enabled) {
  const { baseUrl } = useApiBase();
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState({ status: "idle", products: [], error: null });

  const loadProducts = useCallback((cat) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    fetchProducts(baseUrl, cat)
      .then((products) => setState({ status: "ready", products, error: null }))
      .catch((err) => setState({ status: "error", products: [], error: err.message }));
  }, [baseUrl]);

  useEffect(() => {
    if (!enabled) return;
    fetchCategories(baseUrl).then(setCategories).catch(() => setCategories([]));
  }, [enabled, baseUrl]);

  useEffect(() => {
    if (enabled) loadProducts(category);
  }, [enabled, category, loadProducts]);

  return { ...state, categories, category, setCategory, reload: () => loadProducts(category) };
}

export function StorePage() {
  const { shows } = useLesson();
  const catalog = useCatalog(shows("catalog"));

  // Administrarea (Lecția 3) lucrează pe o copie locală editabilă.
  const [adminProducts, setAdminProducts] = useState(seedProducts);
  const replace = (id, p) => setAdminProducts((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const patch   = (id, p) => setAdminProducts((s) => s.map((x) => x.id === id ? { ...x, ...p } : x));
  const remove  = (id)    => setAdminProducts((s) => s.filter((x) => x.id !== id));
  const create  = (d)     => setAdminProducts((s) => [d, ...s]);

  return (
    <main className="store">
      <section id="lesson" className="store__section">
        <LessonSection />
      </section>

      {shows("catalog") && (
        <section id="catalog" className="store__section">
          <div className="section-head">
            <h1>Catalog</h1>
            <p>
              Produsele și categoriile vin din baza de date.
              Filtrarea folosește <code>GET /api/products?category=…</code>.
            </p>
          </div>

          <CategoryFilter
            categories={catalog.categories}
            value={catalog.category}
            onChange={catalog.setCategory}
          />

          {catalog.status === "loading" && <p className="store__note">Se încarcă produsele…</p>}
          {catalog.status === "error" && (
            <div className="store__error">
              <p>Nu s-au putut încărca produsele: {catalog.error}</p>
              <p className="store__error-hint">Rulează backend-ul și scripturile SQL din Lecția 2, apoi:</p>
              <Button variant="ghost" size="sm" onClick={catalog.reload}>Reîncearcă</Button>
            </div>
          )}
          {catalog.status === "ready" && (
            catalog.products.length === 0
              ? <p className="store__note">Nicio potrivire în această categorie.</p>
              : <ProductGrid products={catalog.products} />
          )}
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
              <ProductAdminList products={adminProducts} onReplace={replace} onPatch={patch} onRemove={remove} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
