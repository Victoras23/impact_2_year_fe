# Impact E-Commerce — Frontend

Magazin online de referință pentru Anul 2. Ce se vede depinde de lecția aleasă din
meniul de sus (`src/shared/config/constants.js` → `LESSONS[n].shows`):

- **Lecția 1** — doar „Consola API" (cele 5 verbe HTTP). Fără catalog, fără login.
- **Lecția 2** — catalogul și categoriile se încarcă din baza de date; bara de filtre
  de sub titlu folosește `GET /api/products?category=…`. Butonul **Autentificare** din
  colțul din dreapta deschide fereastra de login (JWT), iar **Ieși** șterge tokenul
  din stocarea locală.

## Rulare (elevi)
**Dublu-click pe `index.html`.** Se deschide în browser — fără server, fără Node, fără
internet. Tot (inclusiv React) este împachetat în acel fișier.

1. Porniți backend-ul (`../back-end`, implicit pe `http://localhost:8080`).
2. Primul buton din bara de sus este un **selector de lecție** — alegeți lecția.
3. În secțiunea **„Consola API"** verificați adresa backend-ului. Dacă l-ați pornit pe
   alt port, schimbați-l acolo.
4. Apăsați **„Trimite toate cererile"**. Fiecare card devine verde când backend-ul
   răspunde corect.

Butoanele **PUT / PATCH / DELETE** din „Administrare produse" și **„Adaugă produs
(POST)"** trimit aceleași verbe către `/api/practice` — le puteți folosi la fel.

## Tema
Implementați în backend cele 5 rute pe `/api/practice`:

| Verb | Răspuns |
|------|---------|
| `GET`    | `api initialised` |
| `POST`   | `youve posted: {...}` |
| `PUT`    | `your update is : {...}` |
| `PATCH`  | `you have updated the : {...}` |
| `DELETE` | `youve deleted : {...}` |

Obiectiv: bara de progres la `5 / 5`.

---

## Pentru profesor — arhitectură & build

**Feature-Sliced Design.** Codul e în `src/`, pe straturi (de sus în jos, un strat
poate importa doar din straturile de sub el):

```
app/         inițializare, provideri de context, stiluri globale + tema (tokens.css)
pages/       o pagină = o rută/ecran   (catalog, lesson1)
widgets/     blocuri mari de UI, compozite   (header, footer, product-grid, cart-drawer)
features/    o acțiune a utilizatorului   (add-to-cart, product-crud, api-status)
entities/    concepte de domeniu + starea lor   (product, cart, api-practice)
shared/      cod reutilizabil, fără domeniu   (ui/, api/, lib/, config/)
```
Fiecare slice are segmente: `ui/` (componente), `model/` (stare, hooks),
`api/` (apeluri de rețea), plus un `index.js` care expune API-ul public al slice-ului.
**Importați doar din `index.js`-ul altui slice**, nu din fișierele lui interne.

### Build
```
npm install      # o singură dată
npm run build    # regenerează index.html din src/
npm run dev      # build cu watch, nemimificat
```
`build.mjs` folosește esbuild ca să împacheteze tot (React inclus) într-un singur
`index.html` care rulează la dublu-click. `index.template.html` este șablonul.

### Unde se schimbă ce
- **Culori / spațiere / font** → `src/app/styles/tokens.css`
- **Produsele de start** → `src/entities/product/model/seed.js`
- **Adresa implicită a backend-ului, ce răspuns e „corect"** → `src/shared/config/constants.js`
- **Ce se vede la fiecare lecție** → `LESSONS` din `src/shared/config/constants.js`.
  Fiecare lecție are `shows: [...]` cu funcțiile vizibile (`"catalog"`, `"admin"`,
  `"cart"`, `"auth"`). Secțiunea lecției curente e mereu vizibilă. La Lecția 1 `shows`
  e gol → doar consola de practică. Când construiți o funcție, adăugați cheia ei aici.
- **Adresa backend-ului / căile API** → `src/shared/config/constants.js`
  (`PRODUCTS_PATH`, `AUTH_PATHS`).
- **Sesiunea / tokenul** → `src/entities/session/`. **Login/logout UI** → `src/features/auth/`.
- **Încărcarea catalogului / categoriilor din API** → `src/entities/product/api/productApi.js`
  și `src/entities/category/api/categoryApi.js`, folosite de `src/pages/store/ui/StorePage.jsx`.
- **Filtrul de categorii** → `src/features/filter-by-category/`.
- **O lecție nouă în selector** → adăugați-o în `LESSONS` (`available: true` când e
  gata) și tratați-o în `src/pages/lesson/ui/LessonSection.jsx`
- **Un ecran nou** → un folder nou în `src/pages/` + apel condiționat în `pages/store`
- **Când backend-ul are rute reale** (Lecția 2+): schimbați apelurile din
  `src/entities/*/api` și `src/features/*/api`; componentele rămân la fel.

`node_modules/` și `dist/` sunt ignorate de Git; `index.html` (build-ul) se comite.
