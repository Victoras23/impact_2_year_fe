import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { CATEGORIES_PATH } from "../../../shared/config/index.js";
import { readRateLimit } from "./rateLimitHeaders.js";

export const BURST_SIZE = 120;

// Panoul 2 — throttling: o rafală de 120 de cereri GET, una după alta, cât de
// repede poate browserul. Limita generală e 100/minut, reumplută TREPTAT —
// deci primele ~100 trec, restul primesc 429, iar după o secundă merge din nou.
export function useApiBurst() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async () => {
    setState({ kind: "loading", done: 0 });
    const url = joinUrl(baseUrl, CATEGORIES_PATH);
    const started = performance.now();
    const results = [];
    for (let i = 0; i < BURST_SIZE; i++) {
      const res = await request(url);
      if (res.status === 0) { setState({ kind: "down" }); return; }
      results.push(readRateLimit(res));
      if (i % 10 === 9) setState({ kind: "loading", done: i + 1 });
    }
    const totalMs = Math.round(performance.now() - started);
    const firstBlocked = results.findIndex((r) => r.status === 429);
    const retryAfter = firstBlocked >= 0 ? results[firstBlocked].retryAfter || 1 : null;

    // Recuperarea: așteptăm exact cât cere Retry-After, apoi încă o cerere.
    let recovery = null;
    if (retryAfter) {
      setState({ kind: "waiting", results, totalMs, firstBlocked, retryAfter });
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      recovery = readRateLimit(await request(url));
    }
    setState({
      kind: "done",
      results,
      totalMs,
      firstBlocked,
      retryAfter,
      recovery,
      ok: results.filter((r) => r.status === 200).length,
      blocked: results.filter((r) => r.status === 429).length,
      limit: results[0] ? results[0].limit : null,
    });
  }, [baseUrl]);

  return { state, run };
}
