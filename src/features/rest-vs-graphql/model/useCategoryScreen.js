import { useCallback, useState } from "react";
import { request, joinUrl, graphqlRequest, byteSize, useApiBase } from "../../../shared/api/index.js";
import { CATEGORIES_PATH, PRODUCTS_PATH } from "../../../shared/config/index.js";
import { CATEGORY_SCREEN_QUERY } from "./queries.js";

const now = () => ((performance && performance.now) ? performance.now() : Date.now());

// Panoul 2 — UNDER-FETCHING. Un ecran „toate categoriile, fiecare cu produsele
// ei”. REST nu are un endpoint pentru asta, deci clientul face o cascadă:
// 1 cerere pentru categorii, apoi câte 1 pentru produsele fiecărei categorii
// (în paralel — cel mai bine ce se poate face fără un endpoint nou). GraphQL:
// un singur POST, iar backend-ul încarcă produsele tuturor categoriilor dintr-un
// singur query SQL (@BatchMapping).
export function useCategoryScreen() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async () => {
    setState({ kind: "loading" });

    const restStarted = now();
    const catsRes = await request(joinUrl(baseUrl, CATEGORIES_PATH), { method: "GET" });
    if (catsRes.status === 0) {
      setState({ kind: "down" });
      return;
    }
    let categories = [];
    try {
      categories = JSON.parse(catsRes.text);
    } catch {
      categories = [];
    }
    const perCategory = await Promise.all(categories.map((c) =>
      request(joinUrl(baseUrl, PRODUCTS_PATH) + "?category=" + c.id + "&size=50", { method: "GET" })));
    const restMs = Math.round(now() - restStarted);
    const restBytes = byteSize(catsRes.text) + perCategory.reduce((sum, r) => sum + byteSize(r.text), 0);
    const restProducts = perCategory.reduce((sum, r) => {
      try {
        return sum + JSON.parse(r.text).content.length;
      } catch {
        return sum;
      }
    }, 0);

    const gql = await graphqlRequest(baseUrl, CATEGORY_SCREEN_QUERY);
    const gqlCategories = gql.data ? gql.data.categories : [];

    setState({
      kind: "done",
      rest: {
        requests: 1 + perCategory.length, ms: restMs, bytes: restBytes,
        categories: categories.length, products: restProducts,
        ok: catsRes.ok && perCategory.every((r) => r.ok),
      },
      graphql: {
        requests: 1, ms: gql.ms, bytes: byteSize(gql.text),
        categories: gqlCategories.length,
        products: gqlCategories.reduce((sum, c) => sum + c.products.length, 0),
        ok: gql.ok,
      },
      preview: gqlCategories.map((c) => ({ name: c.name, count: c.products.length })),
    });
  }, [baseUrl]);

  return { state, run };
}
