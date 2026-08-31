// Valori de configurare pentru tot frontend-ul. Un singur loc de modificat.

export const APP_NAME = "impact E-COMMERCE";

// Backend-ul de referință.
export const DEFAULT_API_BASE = "http://localhost:8080";
export const PRACTICE_PATH = "/api/practice";       // Lecția 1
export const PRODUCTS_PATH = "/api/products";       // Lecția 2
export const CATEGORIES_PATH = "/api/categories";   // Lecția 2
export const AUTH_PATHS = {                       // Lecția 2
  login: "/api/auth/login",
  register: "/api/auth/register",
  me: "/api/auth/me",
};

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
//                       Chei posibile: "catalog", "admin", "cart", "auth".
//                       Secțiunea lecției curente (consola de practică) e mereu vizibilă.
// Pe măsură ce construiți o secțiune, adăugați cheia ei la lecțiile de la care apare.
export const LESSONS = [
  { id: 1, title: "Lecția 1 — Verbe HTTP",          available: true,  shows: [] },
  { id: 2, title: "Lecția 2 — Baze de date & JWT",  available: true,  shows: ["catalog", "auth"] },
  { id: 3, title: "Lecția 3 — Redis, Swagger, Git", available: false, shows: ["catalog", "admin", "cart", "auth"] },
];

export const STORAGE_LESSON = "impact.ecom.lesson";

export const PRACTICE_EXPECTATIONS = {
  GET:    { kind: "equals", value: "api initialised",        label: "api initialised" },
  POST:   { kind: "prefix", value: "youve posted:",          label: "youve posted: {...}" },
  PUT:    { kind: "prefix", value: "your update is :",       label: "your update is : {...}" },
  PATCH:  { kind: "prefix", value: "you have updated the :", label: "you have updated the : {...}" },
  DELETE: { kind: "prefix", value: "youve deleted :",        label: "youve deleted : {...}" },
};
