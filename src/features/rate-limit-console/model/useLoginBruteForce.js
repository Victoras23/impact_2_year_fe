import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { AUTH_PATHS } from "../../../shared/config/index.js";
import { readRateLimit } from "./rateLimitHeaders.js";

const ATTEMPTS = 7;

// Panoul 1 — un „atacator” care ghicește parola: 7 încercări greșite, una după
// alta, pe login-ul REAL. Backend-ul trebuie să răspundă 401 de 5 ori, apoi 429.
export function useLoginBruteForce() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle", rows: [] });

  const attempt = useCallback(async (index) => {
    const res = await request(joinUrl(baseUrl, AUTH_PATHS.login), {
      method: "POST",
      body: { email: "user@impact.md", password: "parola-gresita-" + index },
    });
    return { index, ...readRateLimit(res) };
  }, [baseUrl]);

  const run = useCallback(async () => {
    setState({ kind: "loading", rows: [] });
    const rows = [];
    for (let i = 1; i <= ATTEMPTS; i++) {
      const row = await attempt(i);
      if (row.status === 0) { setState({ kind: "down", rows: [] }); return; }
      rows.push(row);
      setState({ kind: "loading", rows: [...rows] });
    }
    const blocked = rows.find((r) => r.status === 429);
    setState({
      kind: "done",
      rows,
      blockedAt: blocked ? blocked.index : null,
      retryAt: blocked && blocked.retryAfter ? Date.now() + blocked.retryAfter * 1000 : null,
    });
  }, [attempt]);

  // După ce trece Retry-After: o încercare în plus, ca să vedem că găleata s-a reumplut.
  const retry = useCallback(async () => {
    const row = await attempt(state.rows.length + 1);
    setState((s) => ({ ...s, rows: [...s.rows, row], retryAt: null, afterWait: row }));
  }, [attempt, state.rows.length]);

  return { state, run, retry };
}
