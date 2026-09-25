// Valori de configurare pentru tot frontend-ul. Un singur loc de modificat.

export const APP_NAME = "impact E-COMMERCE";

// Backend-ul de referință.
export const DEFAULT_API_BASE = "http://localhost:8080";
// Lecția 14 — /api/practice rămâne NEVERSIONAT intenționat: e consola de
// practică a Lecției 1, nu o parte a contractului "real" al API-ului de
// e-commerce, deci n-are sens să poarte un /v1 care implică o promisiune
// de compatibilitate pe termen lung. Tot restul a trecut la /api/v1/... —
// checkpoint-ul lecției.
export const PRACTICE_PATH = "/api/practice";          // Lecția 1
export const PRODUCTS_PATH = "/api/v1/products";       // Lecția 2 (versionat în Lecția 14)
export const CATEGORIES_PATH = "/api/v1/categories";   // Lecția 2 (versionat în Lecția 14)
export const SWAGGER_PATH = "/swagger-ui.html";        // Lecția 3
export const API_DOCS_PATH = "/v3/api-docs";           // Lecția 3 (embedat în iframe din Lecția 10)
export const CACHE_CLEAR_PATH = "/api/v1/cache/clear"; // Lecția 3 (versionat în Lecția 14)
export const CONFIG_INFO_PATH = "/api/v1/config/info"; // Lecția 6 (versionat în Lecția 14)
export const AUTH_PATHS = {                          // Lecția 2
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  me: "/api/v1/auth/me",
  refresh: "/api/v1/auth/refresh",                    // Lecția 11
  logout: "/api/v1/auth/logout",                      // Lecția 11
};

// Lecția 14 — mărimea implicită de pagină cerută de front-end (trebuie să se
// potrivească cu ce backend-ul acceptă ca implicit, dar rămâne explicită aici
// ca să nu depindem tacit de valoarea lui din ProductController).
export const DEFAULT_PAGE_SIZE = 5;

// Chei de stocare locală (localStorage poate lipsi pe file:// — vezi shared/lib).
export const STORAGE = {
  apiBase: "impact.ecom.apiBase",
  cart: "impact.ecom.cart",
  session: "impact.ecom.session",
};

// Lecția curentă și ce răspuns trebuie să întoarcă backend-ul pentru fiecare verb.
export const LESSON = 1;

// Lecțiile din meniul de sus.
//   available: false  = apare în listă, dar nu se poate alege încă.
//   shows: []         = ce secțiuni / funcții ale magazinului sunt vizibile la acea lecție.
//                       Chei posibile: "catalog", "admin", "cart", "auth", "swagger", "cache", "env", "details".
//                       Secțiunea lecției curente (consola de practică) e mereu vizibilă.
// Pe măsură ce construiți o secțiune, adăugați cheia ei la lecțiile de la care apare.
export const LESSONS = [
  { id: 1, title: "Lecția 1 — Verbe HTTP",          available: true,  shows: [] },
  { id: 2, title: "Lecția 2 — Baze de date & JWT",  available: true,  shows: ["catalog", "auth"] },
  { id: 3, title: "Lecția 3 — Redis, Swagger, Git", available: true,  shows: ["catalog", "auth", "swagger", "cache"] },
  { id: 4, title: "Lecția 4 — Clean Code & SOLID",  available: true,  shows: ["catalog", "auth", "swagger", "cache"] },
  { id: 5, title: "Lecția 5 — Design Patterns",     available: true,  shows: ["catalog", "auth", "swagger", "cache"] },
  { id: 6, title: "Lecția 6 — 12-Factor App & Config", available: true, shows: ["catalog", "auth", "swagger", "cache", "env"] },
  { id: 7, title: "Lecția 7 — Docker & Docker Compose", available: true, shows: ["catalog", "auth", "swagger", "cache", "env"] },
  { id: 8, title: "Lecția 8 — Unit Testing (JUnit & Mockito)", available: true, shows: ["catalog", "auth", "swagger", "cache", "env"] },
  { id: 9, title: "Lecția 9 — Integration & API Testing", available: true, shows: ["catalog", "auth", "swagger", "cache", "env"] },
  { id: 10, title: "Lecția 10 — Securitate & OWASP Top 10", available: true, shows: ["catalog", "auth", "swagger", "cache", "env"] },
  { id: 11, title: "Lecția 11 — Autentificare & Autorizare Avansată", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin"] },
  { id: 12, title: "Lecția 12 — SQL Avansat & Optimizarea Query-urilor", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin"] },
  { id: 13, title: "Lecția 13 — Scalarea Bazei de Date & Problema N+1", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details"] },
  { id: 14, title: "Lecția 14 — Bune Practici pentru API-uri REST", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details"] },
];

export const STORAGE_LESSON = "impact.ecom.lesson";

export const PRACTICE_EXPECTATIONS = {
  GET:    { kind: "equals", value: "api initialised",        label: "api initialised" },
  POST:   { kind: "prefix", value: "youve posted:",          label: "youve posted: {...}" },
  PUT:    { kind: "prefix", value: "your update is :",       label: "your update is : {...}" },
  PATCH:  { kind: "prefix", value: "you have updated the :", label: "you have updated the : {...}" },
  DELETE: { kind: "prefix", value: "youve deleted :",        label: "youve deleted : {...}" },
};
