import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { MQ_PATHS, PRODUCTS_PATH } from "../../../shared/config/index.js";
import { fetchServices, probe, trace, TRACE_REQUESTS } from "./servicesApi.js";

const POLL_MS = 2000;

// Panoul 1 — lista din Eureka, reîmprospătată la 2 s cât timp panoul e „live”.
// Ținem minte ora pornirii fiecărei instanțe: dacă se schimbă, instanța a fost repornită.
export function useEurekaServices() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const [live, setLive] = useState(true);
  const seen = useRef(null);        // instanceId → { startedAt, changedAt }; null = încă nicio încărcare

  const load = useCallback(async () => {
    const res = await fetchServices(baseUrl);
    if (res.kind !== "ok") { setState(res); return; }
    const now = Date.now();
    const first = seen.current === null;
    if (first) seen.current = {};
    const services = res.services.map((s) => ({
      ...s,
      instances: s.instances.map((i) => {
        const prev = seen.current[i.instanceId];
        // O instanță apărută acum sau cu altă oră de pornire = (re)pornită. La prima
        // încărcare nu marcăm nimic: nu știm ce era înainte.
        if (!prev || prev.startedAt !== i.startedAt) {
          seen.current[i.instanceId] = { startedAt: i.startedAt, changedAt: first ? 0 : now };
        }
        return { ...i, fresh: now - seen.current[i.instanceId].changedAt < 10000 };
      }),
    }));
    setState({ kind: "ok", services, at: now });
  }, [baseUrl]);

  useEffect(() => {
    if (!live) return undefined;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [live, load]);

  return { state, live, setLive, reload: load };
}

// Panoul 2 — câte o cerere spre fiecare tip de rută: cine a răspuns și prin ce rută.
export function useRouteTrace() {
  const { baseUrl } = useApiBase();
  const { token } = useSession();
  const [state, setState] = useState({ kind: "idle", rows: [] });
  const run = useCallback(async () => {
    const rows = [];
    setState({ kind: "loading", rows });
    for (const item of TRACE_REQUESTS) {
      if (item.auth && !token) { rows.push({ ...item, skipped: true }); continue; }
      const r = await trace(baseUrl, item, token);
      if (r.status === 0 && rows.length === 0) { setState({ kind: "down", rows: [] }); return; }
      rows.push(r);
      setState({ kind: "loading", rows: [...rows] });
    }
    setState({ kind: "done", rows });
  }, [baseUrl, token]);
  return { state, run, loggedIn: !!token };
}

export const WATCH_SECONDS = 90;
// Catalogul: o cerere pe secundă (60/min) — sub limita de 100/min din Lecția 16.
// Comenzile: două pe secundă (serviciul de comenzi nu are rate limiting).
const WATCHED = [
  { key: "catalog", label: "Catalog (monolit)", path: PRODUCTS_PATH + "?size=1", everyMs: 1000 },
  { key: "orders", label: "Comenzi (orders-service)", path: MQ_PATHS.stats, everyMs: 500 },
];

// Panoul 3 — 90 de secunde de sonde spre ambele servicii. În timpul lor rulezi
// `docker compose up -d --build orders-service` și vezi ce se oprește și ce nu.
export function useRedeployWatch() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle", series: {} });
  const stop = useRef(false);

  const run = useCallback(async () => {
    stop.current = false;
    const started = Date.now();
    const series = Object.fromEntries(WATCHED.map((w) => [w.key, []]));
    setState({ kind: "running", series, started });
    await Promise.all(WATCHED.map(async (w) => {
      while (!stop.current && Date.now() - started < WATCH_SECONDS * 1000) {
        const t = Date.now();
        series[w.key] = [...series[w.key], await probe(baseUrl, w.path)];
        setState({ kind: "running", series: { ...series }, started });
        await new Promise((r) => setTimeout(r, Math.max(0, w.everyMs - (Date.now() - t))));
      }
    }));
    setState({ kind: "done", series: { ...series }, started });
  }, [baseUrl]);

  const cancel = useCallback(() => { stop.current = true; }, []);
  return { state, run, cancel, watched: WATCHED };
}
