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
// Lecția 15 — GraphQL NU e versionat ca REST-ul (/v1): un singur URL pentru tot,
// iar schema evoluează adăugând câmpuri noi și marcând cele vechi @deprecated,
// nu publicând un /v2. GraphiQL (playground-ul) există doar pe profilul dev.
export const GRAPHQL_PATH = "/graphql";                // Lecția 15
export const GRAPHIQL_PATH = "/graphiql";              // Lecția 15
// Lecția 18 — comenzile (confirmate asincron prin RabbitMQ) și consola de cozi.
export const ORDERS_PATH = "/api/v1/orders";            // Lecția 18
export const MQ_PATHS = {                              // Lecția 18
  stats: "/api/v1/mq/stats",
  poison: "/api/v1/mq/poison",
  dlq: "/api/v1/mq/dlq",
};
// Lecția 19 — Kafka: starea topicurilor / grupului și statisticile handler-ului „analytics”.
export const KAFKA_PATHS = {                           // Lecția 19
  stats: "/api/v1/kafka/stats",
  events: "/api/v1/kafka/events",
};
// Kafka UI direct: http://localhost:8090 — trimite „X-Frame-Options: DENY”, deci nu merge în iframe.
// Pentru modal, Nginx o servește pe portul 8091 fără acel header (nginx/kafka-ui.conf în backend).
export const KAFKA_UI_DIRECT_PORT = 8090;               // Lecția 19
export const KAFKA_UI_EMBED_PORT = 8091;                // Lecția 19
export const ANALYTICS_PATHS = {                       // Lecția 19
  summary: "/api/v1/analytics/summary",
  pause: "/api/v1/analytics/pause",
  resume: "/api/v1/analytics/resume",
  replay: "/api/v1/analytics/replay",
};
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
//                       Chei posibile: "catalog", "admin", "cart", "auth", "swagger", "cache", "env", "details", "graphql",
//                       "orders" (Lecția 18 — coșul trimite comanda la backend + „Comenzile mele”),
//                       "analytics" (Lecția 19 — „Statistici vânzări”, construite din evenimentele Kafka).
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
  { id: 15, title: "Lecția 15 — GraphQL vs. API REST", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql"] },
  { id: 16, title: "Lecția 16 — Rate Limiting & API Throttling", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql"] },
  { id: 17, title: "Lecția 17 — Load Balancing & Reverse Proxy", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql"] },
  { id: 18, title: "Lecția 18 — Message Queues & RabbitMQ", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql", "cart", "orders"] },
  { id: 19, title: "Lecția 19 — Event Streaming cu Apache Kafka", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql", "cart", "orders", "analytics"] },
  { id: 20, title: "Lecția 20 — Introducere în Arhitectura Microservicii", available: true, shows: ["catalog", "auth", "swagger", "cache", "env", "admin", "details", "graphql", "cart", "orders", "analytics"] },
];

export const STORAGE_LESSON = "impact.ecom.lesson";

export const PRACTICE_EXPECTATIONS = {
  GET:    { kind: "equals", value: "api initialised",        label: "api initialised" },
  POST:   { kind: "prefix", value: "youve posted:",          label: "youve posted: {...}" },
  PUT:    { kind: "prefix", value: "your update is :",       label: "your update is : {...}" },
  PATCH:  { kind: "prefix", value: "you have updated the :", label: "you have updated the : {...}" },
  DELETE: { kind: "prefix", value: "youve deleted :",        label: "youve deleted : {...}" },
};
