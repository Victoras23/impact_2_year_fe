import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { clearCache, fetchCategoryPrices, fetchClusterInfo } from "./clusterApi.js";

// La 2 s: 30 de cereri pe minut pentru info + 15 pentru prețuri. Rate limiting-ul din Lecția 16
// dă 100 pe minut — și, prin NodePort, toate cererile vin de la ACELAȘI IP (al nodului).
const TICK_MS = 2000;
const HISTORY = 60;

// Panoul 1 + 2 + 3 — interogăm podul la fiecare 2 s și ținem minte ce s-a schimbat.
export function useClusterWatch() {
  const { baseUrl } = useApiBase();
  const [live, setLive] = useState(true);
  const [state, setState] = useState({ kind: "idle" });
  const [history, setHistory] = useState([]);   // ultimele 60 de răspunsuri: { ok, pod }
  const [events, setEvents] = useState([]);     // „pod nou”, „nu răspunde”, „răspunde din nou”
  const [prices, setPrices] = useState(null);
  const last = useRef({ pod: null, downSince: null });
  const tick = useRef(0);

  useEffect(() => {
    setHistory([]); setEvents([]); setPrices(null);
    last.current = { pod: null, downSince: null };
  }, [baseUrl]);

  const load = useCallback(async () => {
    const r = await fetchClusterInfo(baseUrl);
    setState(r);
    const ok = r.kind === "ok" && r.data;
    const pod = ok ? r.data.podName : null;
    setHistory((h) => [...h, { ok: !!ok, pod, at: r.at }].slice(-HISTORY));
    const prev = last.current;
    const add = (e) => setEvents((list) => [{ ...e, at: r.at }, ...list].slice(0, 8));
    if (!ok && prev.downSince === null && prev.pod !== null) {
      prev.downSince = r.at;
      add({ type: "down", pod: prev.pod });
    }
    if (ok) {
      if (prev.downSince !== null) {
        add({ type: "up", pod, gapMs: r.at - prev.downSince });
        prev.downSince = null;
      }
      if (prev.pod !== null && prev.pod !== pod) add({ type: "new", pod, from: prev.pod });
      prev.pod = pod;
      tick.current += 1;
      if (tick.current % 2 === 1) {
        const discount = r.data.config.find((c) => c.key === "app.discount.category-name");
        setPrices(await fetchCategoryPrices(baseUrl, discount ? discount.value : null));
      }
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!live) return undefined;
    load();
    const id = setInterval(load, TICK_MS);
    return () => clearInterval(id);
  }, [live, load]);

  const clear = useCallback(async () => {
    const ok = await clearCache(baseUrl);
    if (ok) {
      const discount = state.kind === "ok" ? state.data.config.find((c) => c.key === "app.discount.category-name") : null;
      setPrices(await fetchCategoryPrices(baseUrl, discount ? discount.value : null));
    }
    return ok;
  }, [baseUrl, state]);

  return { state, history, events, prices, live, setLive, clear };
}
