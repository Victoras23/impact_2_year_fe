import { useCallback, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { lbCall, LB_PATHS } from "./lbApi.js";

export const DISTRIBUTION_SIZE = 20;

// Panoul 1 — 20 de cereri una după alta: cine răspunde, cât durează, câte eșuează.
// Rulat după `docker compose stop backend-2`, același panou arată failover-ul.
export function useDistribution() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    setState({ kind: "loading", rows: [] });
    const rows = [];
    for (let i = 0; i < DISTRIBUTION_SIZE; i++) {
      const r = await lbCall(baseUrl, LB_PATHS.whoami);
      if (r.status === 0 && i === 0) { setState({ kind: "down" }); return; }
      rows.push(r);
      setState({ kind: "loading", rows: [...rows] });
    }
    const counts = {};
    rows.forEach((r) => { const k = r.instance || "?"; counts[k] = (counts[k] || 0) + 1; });
    setState({
      kind: "done", rows, counts,
      algorithm: (rows.find((r) => r.algorithm) || {}).algorithm || null,
      errors: rows.filter((r) => r.status < 200 || r.status >= 300).length,
      slowest: Math.max(...rows.map((r) => r.ms)),
    });
  }, [baseUrl]);
  return { state, run };
}

// Panoul 2 — o cerere lentă (3 s) ține o instanță ocupată; în timpul ei trimitem 6
// cereri rapide. Round robin le împarte oricum pe rând; least_conn le trimite pe
// instanța liberă.
export function useLeastConnExperiment() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    setState({ kind: "loading" });
    const slowPromise = lbCall(baseUrl, LB_PATHS.slow + "?ms=3000");
    await new Promise((r) => setTimeout(r, 400));
    const fast = [];
    for (let i = 0; i < 6; i++) fast.push(await lbCall(baseUrl, LB_PATHS.whoami));
    const slow = await slowPromise;
    if (slow.status === 0) { setState({ kind: "down" }); return; }
    setState({
      kind: "done", slow, fast,
      algorithm: slow.algorithm || (fast[0] && fast[0].algorithm) || null,
      onBusy: fast.filter((f) => f.instance === slow.instance).length,
    });
  }, [baseUrl]);
  return { state, run };
}

// Panoul 3 — un contor ținut în memoria instanței vs. unul în Redis (comun).
export function useVisits() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    setState({ kind: "loading", rows: [] });
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const r = await lbCall(baseUrl, LB_PATHS.visits, { method: "POST" });
      if (r.status === 0) { setState({ kind: "down" }); return; }
      rows.push(r);
      setState({ kind: "loading", rows: [...rows] });
    }
    const instances = new Set(rows.map((r) => r.instance));
    setState({ kind: "done", rows, instances: instances.size });
  }, [baseUrl]);
  return { state, run };
}

// Panoul 4 — ce IP de client vede aplicația, cu și fără un X-Forwarded-For falsificat.
export function useRealIp() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    setState({ kind: "loading" });
    const honest = await lbCall(baseUrl, LB_PATHS.whoami);
    if (honest.status === 0) { setState({ kind: "down" }); return; }
    const spoofed = await lbCall(baseUrl, LB_PATHS.whoami, { headers: { "X-Forwarded-For": "1.2.3.4" } });
    setState({ kind: "done", honest, spoofed });
  }, [baseUrl]);
  return { state, run };
}
