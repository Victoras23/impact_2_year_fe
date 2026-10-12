import { request, joinUrl } from "./httpClient.js";
import { GRAPHQL_PATH } from "../config/index.js";

// Lecția 15 — clientul GraphQL. Nu e o bibliotecă (Apollo, urql...) —
// intenționat: un query GraphQL e doar un POST cu JSON {query, variables}.
// Tot ce vedeți în Apollo e cache și confort peste exact acest apel.
//
// Diferența importantă față de REST: `ok` aici NU înseamnă doar status 2xx.
// Un răspuns GraphQL vine aproape mereu cu HTTP 200, iar eroarea reală stă
// în corp, în `errors[]` — deci verificăm ambele.
export async function graphqlRequest(baseUrl, query, { variables, token } = {}) {
  const res = await request(joinUrl(baseUrl, GRAPHQL_PATH), {
    method: "POST",
    body: { query, variables: variables || {} },
    token,
  });
  let payload = null;
  try {
    payload = res.text ? JSON.parse(res.text) : null;
  } catch {
    // corp gol sau nu-JSON (ex. backend oprit) — rămâne null
  }
  const errors = (payload && payload.errors) || [];
  return {
    ...res,
    data: (payload && payload.data) || null,
    errors,
    ok: res.ok && errors.length === 0,
    // Prima clasificare de eroare (UNAUTHORIZED, FORBIDDEN, ValidationError...) —
    // echivalentul GraphQL al codului de status din REST.
    classification: errors.length ? (errors[0].extensions && errors[0].extensions.classification) || null : null,
  };
}

// Mărimea reală a corpului răspunsului, în octeți (UTF-8, înainte de gzip) —
// ce măsurăm când comparăm „cât trimite serverul” la REST vs GraphQL.
export function byteSize(text) {
  try {
    return new TextEncoder().encode(text || "").length;
  } catch {
    return (text || "").length;
  }
}
