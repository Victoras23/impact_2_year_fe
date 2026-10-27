import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { breakLiveness, checkSystem, fetchActuatorInfo, fetchPod, pauseReadiness } from "./rolloutApi.js";

// Panoul 1 — 24 de cereri, una după alta: cu aceeași conexiune sau cu una nouă la fiecare.
export const SAMPLE = 24;
export function useReplicaSample() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async (close) => {
    setState({ kind: "running", close });
    const counts = {};
    let failed = 0;
    for (let i = 0; i < SAMPLE; i++) {
      const r = await fetchPod(baseUrl, close);
      if (!r.ok) { failed++; if (r.status === 429) break; continue; }
      const key = r.pod;
      counts[key] = counts[key] || { pod: r.pod, version: r.version, n: 0 };
      counts[key].n++;
    }
    setState({ kind: "done", close, counts: Object.values(counts).sort((a, b) => b.n - a.n), failed });
  }, [baseUrl]);
  return { state, run };
}

// Panoul 2 — urmărire continuă (4 cereri/s) cât timp faci rollout-ul din terminal.
const WATCH_MS = 250;
const KEEP = 160;
export function useRolloutWatch() {
  const [on, setOn] = useState(false);
  const [samples, setSamples] = useState([]);
  const [totals, setTotals] = useState({ ok: 0, failed: 0, versions: {} });
  const [events, setEvents] = useState([]);
  const last = useRef({ pod: null, version: null });
  const busy = useRef(false);
  const reset = useCallback(() => {
    setSamples([]); setTotals({ ok: 0, failed: 0, versions: {} }); setEvents([]);
    last.current = { pod: null, version: null };
  }, []);
  const tick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const r = await fetchActuatorInfo();
    busy.current = false;
    const at = Date.now();
    setSamples((s) => [...s, { ...r, at }].slice(-KEEP));
    setTotals((t) => r.ok
      ? { ...t, ok: t.ok + 1, versions: { ...t.versions, [r.version]: (t.versions[r.version] || 0) + 1 } }
      : { ...t, failed: t.failed + 1 });
    if (r.ok) {
      const prev = last.current;
      const add = (e) => setEvents((list) => [{ ...e, at }, ...list].slice(0, 6));
      if (prev.version && prev.version !== r.version) add({ type: "version", from: prev.version, to: r.version, pod: r.pod });
      else if (prev.pod && prev.pod !== r.pod) add({ type: "pod", from: prev.pod, to: r.pod, version: r.version });
      last.current = { pod: r.pod, version: r.version };
    }
  }, []);
  useEffect(() => {
    if (!on) return undefined;
    const id = setInterval(tick, WATCH_MS);
    return () => clearInterval(id);
  }, [on, tick]);
  return { on, setOn, samples, totals, events, reset };
}

// Panoul 3 — probele: comanda ajunge la UN pod (prin Service); urmărim podurile la 3 s.
export function useProbes() {
  const { baseUrl } = useApiBase();
  const { token, session } = useSession();
  const [pods, setPods] = useState({});
  const [result, setResult] = useState(null);
  const [live, setLive] = useState(false);
  const sample = useCallback(async () => {
    // câteva cereri cu conexiune nouă, ca să vedem mai multe poduri, nu doar pe cel „lipit” de conexiune
    for (let i = 0; i < 3; i++) {
      const r = await fetchPod(baseUrl, true);
      if (!r.ok) continue;
      setPods((p) => {
        const before = p[r.pod];
        const restarted = before && before.startedAt !== r.startedAt;
        return { ...p, [r.pod]: { ...r, seen: Date.now(), restarts: (before ? before.restarts : 0) + (restarted ? 1 : 0) } };
      });
    }
  }, [baseUrl]);
  useEffect(() => {
    if (!live) return undefined;
    sample();
    const id = setInterval(sample, 3000);
    return () => clearInterval(id);
  }, [live, sample]);
  const pause = useCallback(async () => {
    setLive(true);
    setResult({ kind: "readiness", ...(await pauseReadiness(baseUrl, token, 20)), at: Date.now() });
  }, [baseUrl, token]);
  const kill = useCallback(async () => {
    setLive(true);
    setResult({ kind: "liveness", ...(await breakLiveness(baseUrl, token)), at: Date.now() });
  }, [baseUrl, token]);
  return { pods, result, live, setLive, pause, kill, isAdmin: !!session && session.role === "ADMIN", hasToken: !!token };
}

export function useSystemCheck() {
  const [rows, setRows] = useState(null);
  const run = useCallback(async () => setRows(await checkSystem()), []);
  return { rows, run };
}
