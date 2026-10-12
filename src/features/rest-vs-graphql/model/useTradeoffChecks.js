import { useCallback, useState } from "react";
import { request, joinUrl, graphqlRequest, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";
import { DEPTH_BOMB_QUERY } from "./queries.js";

// Panoul 4 — TRADE-OFF-URILE, live. Aceeași situație, trimisă la ambele
// API-uri; arătăm ce răspunde fiecare. Nimic nu e simulat: dacă cineva strică
// GraphQlConfig sau @PreAuthorize pe backend, rândul respectiv se face roșu.
export function useTradeoffChecks() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async () => {
    setState({ kind: "loading" });
    const productsUrl = joinUrl(baseUrl, PRODUCTS_PATH);

    // 1. Ștergere fără token.
    const restDelete = await request(productsUrl + "/1", { method: "DELETE" });
    if (restDelete.status === 0) {
      setState({ kind: "down" });
      return;
    }
    const gqlDelete = await graphqlRequest(baseUrl, "mutation { deleteProduct(id: 1) }");

    // 2. Un câmp de sortare care nu există.
    const restSort = await request(productsUrl + "?sort=password,asc", { method: "GET" });
    const gqlSort = await graphqlRequest(baseUrl, "{ products(sortBy: PASSWORD) { totalElements } }");

    // 3. Un produs care nu există.
    const restMissing = await request(productsUrl + "/999999", { method: "GET" });
    const gqlMissing = await graphqlRequest(baseUrl, "{ product(id: 999999) { name } }");

    // 4. Query-ul „bombă” — doar GraphQL are problema asta: în REST clientul
    //    nu poate cere o formă de răspuns pe care serverul n-a prevăzut-o.
    const gqlBomb = await graphqlRequest(baseUrl, DEPTH_BOMB_QUERY);

    const describe = (g) => "HTTP " + g.status + (g.classification ? " · " + g.classification : g.errors.length ? "" : " · fără erori");

    setState({
      kind: "done",
      rows: [
        {
          id: "auth",
          title: "Ștergere fără token",
          rest: "HTTP " + restDelete.status,
          graphql: describe(gqlDelete),
          pass: restDelete.status === 401 && gqlDelete.status === 200 && gqlDelete.classification === "UNAUTHORIZED",
          lesson: "În GraphQL statusul HTTP rămâne 200 — eroarea e în corp. Un client care verifică doar res.ok ar crede că a mers.",
        },
        {
          id: "sort",
          title: "Sortare după un câmp inexistent",
          rest: "HTTP " + restSort.status,
          graphql: describe(gqlSort),
          pass: restSort.status === 400 && gqlSort.classification === "ValidationError",
          lesson: "REST: lista albă scrisă de mână în ProductService. GraphQL: enum-ul din schemă respinge valoarea înainte de orice cod Java.",
        },
        {
          id: "missing",
          title: "Produs inexistent (id 999999)",
          rest: "HTTP " + restMissing.status,
          graphql: describe(gqlMissing) + (gqlMissing.data && gqlMissing.data.product === null ? " · product: null" : ""),
          pass: restMissing.status === 404 && gqlMissing.ok && gqlMissing.data && gqlMissing.data.product === null,
          lesson: "REST: 404. GraphQL: un câmp nullable care e pur și simplu null — „nu există” nu e o eroare.",
        },
        {
          id: "depth",
          title: "Query imbricat de 9 niveluri",
          rest: "imposibil în REST",
          graphql: describe(gqlBomb),
          pass: gqlBomb.classification === "ExecutionAborted",
          lesson: "Clientul decide forma răspunsului — deci și un atacator. Fără limita de adâncime (GraphQlConfig), un singur POST poate cere milioane de obiecte.",
        },
      ],
    });
  }, [baseUrl]);

  return { state, run };
}
