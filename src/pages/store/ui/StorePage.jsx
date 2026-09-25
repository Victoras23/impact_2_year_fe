import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../../../entities/product/index.js";
import { fetchCategories } from "../../../entities/category/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { useSession } from "../../../entities/session/index.js";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { CACHE_CLEAR_PATH, DEFAULT_PAGE_SIZE } from "../../../shared/config/index.js";
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
// Lecția 14 — GET /api/v1/products întoarce acum un plic de paginare, nu un
// tablou brut; `page`/`totalPages` vin din backend (vezi PageResponse).
function useCatalog(enabled) {
  const { baseUrl } = useApiBase();
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400); // Lecția 12 — nu o cerere la fiecare literă
  const [page, setPage] = useState(0);
  // Lecția 14 — size/sort trec direct către GET /api/v1/products (page/size/sort).
  // sort === "" înseamnă "implicit" (id,asc pe backend) — nu trimitem parametrul deloc.
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState("");
  const [state, setState] = useState({
    status: "idle", products: [], error: null, ms: null, totalPages: 0, totalElements: 0,
  });

  const loadProducts = useCallback((cat, term, pageToLoad, sizeToLoad, sortToLoad) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    const started = performance.now();
    fetchProducts(baseUrl, cat, term, { page: pageToLoad, size: sizeToLoad, sort: sortToLoad || undefined })
      .then((pageResponse) => setState({
        status: "ready", products: pageResponse.content, error: null,
        totalPages: pageResponse.totalPages, totalElements: pageResponse.totalElements,
        ms: Math.round(performance.now() - started),
      }))
      .catch((err) => setState((s) => ({ ...s, status: "error", products: [], error: err.message, ms: null })));
  }, [baseUrl]);

  useEffect(() => {
    if (!enabled) return;
    fetchCategories(baseUrl).then(setCategories).catch(() => setCategories([]));
  }, [enabled, baseUrl]);

  // Un filtru nou (categorie, căutare, mărime de pagină sau sortare) repornește
  // mereu de la prima pagină — pagina 3 a unei configurări vechi n-are sens.
  useEffect(() => { setPage(0); }, [category, search, size, sort]);

  useEffect(() => {
    if (enabled) loadProducts(category, search, page, size, sort);
  }, [enabled, category, search, page, size, sort, loadProducts]);

  const clearCache = useCallback(async () => {
    await request(joinUrl(baseUrl, CACHE_CLEAR_PATH), { method: "POST" });
    loadProducts(category, search, page, size, sort);
  }, [baseUrl, category, search, page, size, sort, loadProducts]);

  return {
    ...state, categories, category, setCategory,
    searchInput, setSearchInput,
    page, setPage, size, setSize, sort, setSort,
    reload: () => loadProducts(category, search, page, size, sort), clearCache,
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

          {/* Lecția 14 — mărime de pagină (?size=) și sortare (?sort=), trimise
              direct către GET /api/v1/products. sort e limitat la id/name/price
              pe backend — orice altă valoare ar primi 400, deci opțiunile de
              aici sunt exact lista albă acceptată, nu o listă arbitrară. */}
          <div className="store__list-controls">
            <div className="store__size-select" role="group" aria-label="Produse pe pagină">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={"store__size-chip" + (catalog.size === n ? " is-active" : "")}
                  onClick={() => catalog.setSize(n)}
                >
                  {n}/pagină
                </button>
              ))}
            </div>

            <label className="store__sort-select">
              Sortează după{" "}
              <select
                className="ui-input"
                value={catalog.sort}
                onChange={(e) => catalog.setSort(e.target.value)}
              >
                <option value="">Implicit</option>
                <option value="name,asc">Nume (A-Z)</option>
                <option value="name,desc">Nume (Z-A)</option>
                <option value="price,asc">Preț (crescător)</option>
                <option value="price,desc">Preț (descrescător)</option>
              </select>
            </label>
          </div>

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

          {/* Lecția 14 — checkpoint: catalogul e paginat pe backend (GET
              /api/v1/products?page=...&size=...), nu doar filtrat. Controalele
              apar de îndată ce există mai mult de o pagină, indiferent de lecția
              selectată — la fel cum SearchBox nu a fost legat de o singură lecție. */}
          {catalog.status === "ready" && catalog.totalPages > 1 && (
            <div className="store__pagination">
              <Button
                variant="ghost" size="sm"
                disabled={catalog.page <= 0}
                onClick={() => catalog.setPage((p) => Math.max(0, p - 1))}
              >
                ← Pagina anterioară
              </Button>
              <span className="store__pagination-status">
                Pagina {catalog.page + 1} din {catalog.totalPages} ({catalog.totalElements} produse)
              </span>
              <Button
                variant="ghost" size="sm"
                disabled={catalog.page >= catalog.totalPages - 1}
                onClick={() => catalog.setPage((p) => Math.min(catalog.totalPages - 1, p + 1))}
              >
                Pagina următoare →
              </Button>
            </div>
          )}
        </section>
      )}

      {shows("admin") && (
        <section id="admin" className="store__section">
          <div className="section-head">
            <h2>Administrare produse</h2>
            <p>
              POST / PUT / DELETE reale pe <code>/api/v1/products</code> — doar pentru contul{" "}
              <b>ADMIN</b> (backend-ul respinge orice altceva, indiferent ce arată interfața).
              Lista de mai jos arată doar pagina curentă a catalogului — folosește paginarea
              din secțiunea Catalog ca să ajungi la restul produselor.
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
