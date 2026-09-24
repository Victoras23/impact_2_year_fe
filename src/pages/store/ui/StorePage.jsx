import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../../../entities/product/index.js";
import { fetchCategories } from "../../../entities/category/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { useSession } from "../../../entities/session/index.js";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { CACHE_CLEAR_PATH } from "../../../shared/config/index.js";
import { useDebouncedValue } from "../../../shared/lib/index.js";
import { Button } from "../../../shared/ui/index.js";
import { ProductGrid } from "../../../widgets/product-grid/index.js";
import { CategoryFilter } from "../../../features/filter-by-category/index.js";
import { SearchBox } from "../../../features/search-products/index.js";
import { ProductDetailsModal } from "../../../features/product-details/index.js";
import { ProductFormModal, ProductAdminList } from "../../../features/product-crud/index.js";
import { LessonSection } from "../../lesson/index.js";
import "./StorePage.css";

// Catalogul + categoriile se încarcă din backend. Reținem și cât a durat cererea
// (Lecția 3: prima cerere lovește baza de date, următoarele vin din cache Redis).
function useCatalog(enabled) {
  const { baseUrl } = useApiBase();
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400); // Lecția 12 — nu o cerere la fiecare literă
  const [state, setState] = useState({ status: "idle", products: [], error: null, ms: null });

  const loadProducts = useCallback((cat, term) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    const started = performance.now();
    fetchProducts(baseUrl, cat, term)
      .then((products) => setState({
        status: "ready", products, error: null,
        ms: Math.round(performance.now() - started),
      }))
      .catch((err) => setState({ status: "error", products: [], error: err.message, ms: null }));
  }, [baseUrl]);

  useEffect(() => {
    if (!enabled) return;
    fetchCategories(baseUrl).then(setCategories).catch(() => setCategories([]));
  }, [enabled, baseUrl]);

  useEffect(() => {
    if (enabled) loadProducts(category, search);
  }, [enabled, category, search, loadProducts]);

  const clearCache = useCallback(async () => {
    await request(joinUrl(baseUrl, CACHE_CLEAR_PATH), { method: "POST" });
    loadProducts(category, search);
  }, [baseUrl, category, search, loadProducts]);

  return {
    ...state, categories, category, setCategory,
    searchInput, setSearchInput,
    reload: () => loadProducts(category, search), clearCache,
  };
}

export function StorePage() {
  const { shows } = useLesson();
  const { session } = useSession();
  const catalog = useCatalog(shows("catalog") || shows("admin"));
  const isAdmin = !!session && session.role === "ADMIN";
  // null = închis, "create" = produs nou, un produs = editarea lui — un singur
  // modal partajat de tot ecranul de administrare, nu unul per rând.
  const [productModal, setProductModal] = useState(null);
  // Lecția 13 — id-ul produsului al cărui detaliu e deschis (null = închis).
  const [detailsProductId, setDetailsProductId] = useState(null);

  return (
    <main className="store">
      <section id="lesson" className="store__section">
        <LessonSection />
      </section>

      {shows("catalog") && (
        <section id="catalog" className="store__section">
          <div className="section-head">
            <h1>Catalog</h1>
            <p>Produsele și categoriile vin din baza de date.</p>
          </div>

          <SearchBox value={catalog.searchInput} onChange={catalog.setSearchInput} />

          <CategoryFilter
            categories={catalog.categories}
            value={catalog.category}
            onChange={catalog.setCategory}
          />

          {shows("cache") && catalog.status === "ready" && (
            <div className="store__cache">
              <span>Produsele: încărcate în <b>{catalog.ms} ms</b>.</span>
              <Button variant="ghost" size="sm" onClick={catalog.reload}>Cere din nou (din cache)</Button>
              <Button variant="ghost" size="sm" onClick={catalog.clearCache}>Golește cache-ul (apoi din baza de date)</Button>
            </div>
          )}

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
              ? <p className="store__note">Nicio potrivire{catalog.searchInput ? <> pentru „{catalog.searchInput}”</> : " în această categorie"}.</p>
              : <ProductGrid products={catalog.products} onOpenDetails={shows("details") ? setDetailsProductId : undefined} />
          )}
        </section>
      )}

      {shows("admin") && (
        <section id="admin" className="store__section">
          <div className="section-head">
            <h2>Administrare produse</h2>
            <p>
              POST / PUT / DELETE reale pe <code>/api/products</code> — doar pentru contul{" "}
              <b>ADMIN</b> (backend-ul respinge orice altceva, indiferent ce arată interfața).
            </p>
          </div>
          {!isAdmin ? (
            <p className="store__note">
              Autentifică-te ca admin (<code>admin@impact.md</code> / <code>admin123</code>)
              din colțul din dreapta sus ca să gestionezi produsele.
            </p>
          ) : (
            <div className="store__admin">
              <Button onClick={() => setProductModal("create")}>Adaugă produs</Button>
              <ProductAdminList
                products={catalog.products}
                token={session.token}
                onEdit={(p) => setProductModal(p)}
                onChanged={catalog.reload}
              />
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <ProductFormModal
          open={!!productModal}
          onClose={() => setProductModal(null)}
          token={session.token}
          categories={catalog.categories}
          product={productModal === "create" ? null : productModal}
          onSaved={catalog.reload}
        />
      )}

      <ProductDetailsModal
        open={detailsProductId != null}
        onClose={() => setDetailsProductId(null)}
        productId={detailsProductId}
      />
    </main>
  );
}
