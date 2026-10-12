import { useCallback, useState } from "react";
import { request, joinUrl, graphqlRequest, byteSize, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";
import { buildProductsQuery } from "./queries.js";
import { summarize } from "./stats.js";

// Panoul 3 — CHECKPOINT-UL LECȚIEI: query-ul GraphQL al catalogului comparat
// (benchmark) cu echivalentul lui REST.
//
// Ca să fie o comparație cinstită:
//   1. o cerere de „încălzire” pentru fiecare, care nu se numără — prima
//      cerere umple cache-ul Redis (Lecția 3); nu vrem să comparăm „DB vs cache”;
//   2. cererile ALTERNEAZĂ (REST, GraphQL, REST, GraphQL...) — dacă laptopul
//      încetinește la mijloc, ambele tabere suferă la fel;
//   3. ambele trec prin ACELAȘI ProductService, cu același cache — singura
//      diferență rămasă e protocolul.
export function useBenchmark() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async (fields, size, iterations) => {
    const restUrl = joinUrl(baseUrl, PRODUCTS_PATH) + "?size=" + size;
    const query = buildProductsQuery(fields, size);

    setState({ kind: "running", done: 0, total: iterations });
    const warmRest = await request(restUrl, { method: "GET" });
    if (warmRest.status === 0) {
      setState({ kind: "down" });
      return;
    }
    const warmGql = await graphqlRequest(baseUrl, query);
    if (!warmGql.ok) {
      setState({ kind: "error", message: warmGql.errors.length ? warmGql.errors[0].message : "GraphQL a răspuns cu " + warmGql.status });
      return;
    }

    const restTimes = [];
    const gqlTimes = [];
    for (let i = 0; i < iterations; i++) {
      const r = await request(restUrl, { method: "GET" });
      restTimes.push(r.ms);
      const g = await graphqlRequest(baseUrl, query);
      gqlTimes.push(g.ms);
      setState({ kind: "running", done: i + 1, total: iterations });
    }

    setState({
      kind: "done",
      iterations,
      rest: { ...summarize(restTimes), bytes: byteSize(warmRest.text) },
      graphql: { ...summarize(gqlTimes), bytes: byteSize(warmGql.text) },
    });
  }, [baseUrl]);

  return { state, run };
}
