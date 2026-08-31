import { useCallback, useMemo } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { PRACTICE_PATH } from "../../../shared/config/index.js";
import { matchesExpectation, usePractice } from "../../../entities/api-practice/index.js";

// Starea conexiunii = rezultatul ultimei cereri GET.
// NU se face niciun GET automat — doar când utilizatorul apasă un buton.
export function useApiStatus() {
  const { baseUrl } = useApiBase();
  const { log, record } = usePractice();

  const state = useMemo(() => {
    const g = log.GET;
    if (!g) return { kind: "idle" };
    if (g.error) return { kind: "down", detail: g.error };
    return { kind: g.ok ? "online" : "reachable", status: g.status, text: g.text };
  }, [log.GET]);

  const check = useCallback(async () => {
    const res = await request(joinUrl(baseUrl, PRACTICE_PATH), { method: "GET" });
    record("GET", {
      ok: res.ok && matchesExpectation("GET", res.text),
      status: res.status, text: res.text, ms: res.ms, error: res.error,
    });
  }, [baseUrl, record]);

  return { state, check };
}
