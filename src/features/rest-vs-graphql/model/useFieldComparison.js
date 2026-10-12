import { useCallback, useState } from "react";
import { request, joinUrl, graphqlRequest, byteSize, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";
import { buildProductsQuery } from "./queries.js";

// Panoul 1 — OVER-FETCHING. Aceeași pagină de produse, cerută o dată prin
// REST (primești tot ce a decis serverul) și o dată prin GraphQL (primești
// doar câmpurile bifate). Comparăm octeții reali din corpul răspunsului.
export function useFieldComparison() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async (fields, size) => {
    setState({ kind: "loading" });
    const rest = await request(joinUrl(baseUrl, PRODUCTS_PATH) + "?size=" + size, { method: "GET" });
    if (rest.status === 0) {
      setState({ kind: "down" });
      return;
    }
    const query = buildProductsQuery(fields, size);
    const gql = await graphqlRequest(baseUrl, query);

    let restSample = null;
    try {
      restSample = JSON.parse(rest.text).content[0] || null;
    } catch {
      // nu e JSON — rămâne null
    }
    const gqlSample = gql.data ? gql.data.products.content[0] || null : null;

    setState({
      kind: "done",
      rest: { ok: rest.ok, status: rest.status, ms: rest.ms, bytes: byteSize(rest.text), sample: restSample },
      graphql: {
        ok: gql.ok, status: gql.status, ms: gql.ms, bytes: byteSize(gql.text), sample: gqlSample,
        error: gql.errors.length ? gql.errors[0].message : null,
      },
    });
  }, [baseUrl]);

  return { state, run };
}
