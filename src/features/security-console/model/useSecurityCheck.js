import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH, API_DOCS_PATH } from "../../../shared/config/index.js";

// Lecția 10 — nu simulăm nimic aici: fiecare verificare e un fetch() real,
// împotriva backend-ului real, care citește exact ce a schimbat Lecția 10 în
// SecurityConfig/GlobalExceptionHandler (vezi SECURITY_REVIEW.md din
// impact_2_year_be). Dacă cineva strică remedierile, consola asta o arată.
const HEADER_CHECKS = [
  { key: "x-frame-options", label: "X-Frame-Options", expect: (v) => v === "DENY" },
  { key: "x-content-type-options", label: "X-Content-Type-Options", expect: (v) => v === "nosniff" },
  { key: "content-security-policy", label: "Content-Security-Policy", expect: (v) => !!v && v.includes("frame-ancestors") },
  { key: "referrer-policy", label: "Referrer-Policy", expect: (v) => v === "strict-origin-when-cross-origin" },
];

// Butonul „Documentație API" embedează chiar pagina asta într-un <iframe> —
// dacă X-Frame-Options ar apărea aici, browserul ar refuza să o afișeze.
// Deci pentru ruta Swagger, „trece" testul înseamnă LIPSA header-ului, nu
// prezența lui — opusul verificării de mai sus, intenționat.
const SWAGGER_CHECKS = [
  { key: "x-frame-options", label: "X-Frame-Options", expect: (v) => !v, describeAbsent: true },
  { key: "x-content-type-options", label: "X-Content-Type-Options", expect: (v) => v === "nosniff" },
];

export function useSecurityCheck() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async () => {
    setState({ kind: "loading" });

    const headersRes = await request(joinUrl(baseUrl, PRODUCTS_PATH), { method: "GET" });
    const headerResults = HEADER_CHECKS.map((check) => {
      const value = (headersRes.headers || {})[check.key];
      return { ...check, value: value || null, pass: !!value && check.expect(value) };
    });

    // A doua verificare, nu doar prima repetată: aceleași header-e, altă
    // rută, politică intenționat diferită — asta demonstrează combinația.
    const swaggerRes = await request(joinUrl(baseUrl, API_DOCS_PATH), { method: "GET" });
    const swaggerResults = SWAGGER_CHECKS.map((check) => {
      const value = (swaggerRes.headers || {})[check.key];
      return { ...check, value: value || null, pass: check.expect(value) };
    });

    const sqliUrl = joinUrl(baseUrl, PRODUCTS_PATH) + "?category=" + encodeURIComponent("1 OR 1=1");
    const sqliRes = await request(sqliUrl, { method: "GET" });
    let sqliMessage = null;
    try {
      sqliMessage = JSON.parse(sqliRes.text).message;
    } catch {
      // corp gol sau nu-JSON — exact defectul pe care testul îl prinde
    }
    const sqliPass = sqliRes.status === 400 && !!sqliMessage;

    if (!headersRes.ok && headersRes.status === 0) {
      setState({ kind: "down" });
      return;
    }
    setState({ kind: "done", headerResults, swaggerResults, sqliStatus: sqliRes.status, sqliMessage, sqliPass });
  }, [baseUrl]);

  return { state, run };
}
