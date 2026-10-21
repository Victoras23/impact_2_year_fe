import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { fetchOrder, fetchProducts, fetchQueues, fetchResilience, fetchStock, placeOrder, replayDlq } from "./resilienceApi.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Panoul 1 + 4 — starea serviciului de comenzi, la fiecare secundă cât timp e „live”.
export function useResilienceStats() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const [queues, setQueues] = useState(null);
  const [live, setLive] = useState(true);
  const load = useCallback(async () => {
    setState(await fetchResilience(baseUrl));
    setQueues(await fetchQueues(baseUrl));
  }, [baseUrl]);
  useEffect(() => {
    if (!live) return undefined;
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, [live, load]);
  return { state, queues, live, setLive, reload: load };
}

// Panoul 2 — o rafală de comenzi. Cu monolitul oprit: primele cereri așteaptă retry-urile
// (~1 s fiecare), apoi circuitul se deschide și răspunsul vine în câteva milisecunde.
export const BURST = 12;
export function useBurst() {
  const { baseUrl } = useApiBase();
  const { token } = useSession();
  const [cells, setCells] = useState([]);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (productId) => {
    if (!token) { setCells([{ skipped: true }]); return; }
    setBusy(true);
    const out = [];
    setCells([]);
    for (let i = 0; i < BURST; i++) {
      const r = await placeOrder(baseUrl, token, [{ productId, quantity: 1 }], "async");
      const message = r.body && r.body.message ? r.body.message : "";
      out.push({ status: r.status, ms: r.ms, open: r.status === 503 && /circuit/i.test(message), retryAfter: r.retryAfter });
      setCells([...out]);
    }
    setBusy(false);
  }, [baseUrl, token]);
  return { cells, busy, run };
}

// Panoul 3 — Saga: o comandă cu două linii, a doua cu mai mult decât e în stoc. Urmărim
// stocul primei linii: scade (rezervat), apoi REVINE după compensare (consistență eventuală).
export function useSagaDemo() {
  const { baseUrl } = useApiBase();
  const { token } = useSession();
  const [products, setProducts] = useState(null);
  const [state, setState] = useState({ kind: "idle", points: [] });
  const cancelled = useRef(false);
  useEffect(() => () => { cancelled.current = true; }, []);

  const loadProducts = useCallback(async () => {
    const list = await fetchProducts(baseUrl);
    setProducts(list ? list.filter((p) => p.stock > 0) : []);
  }, [baseUrl]);

  const run = useCallback(async (first, second) => {
    if (!token) { setState({ kind: "login", points: [] }); return; }
    const before = await fetchStock(baseUrl, first.id);
    const tooMany = (await fetchStock(baseUrl, second.id)) + 1;
    const points = [{ label: "înainte", stock: before, t: 0 }];
    setState({ kind: "running", points: [...points] });
    const start = performance.now();
    const order = await placeOrder(baseUrl, token,
      [{ productId: first.id, quantity: 1 }, { productId: second.id, quantity: tooMany }], "sync");
    if (!order.body || order.status >= 400) {
      setState({ kind: "error", status: order.status, message: order.body && order.body.message, points });
      return;
    }
    points.push({ label: "comanda " + order.body.status, stock: await fetchStock(baseUrl, first.id),
      t: Math.round(performance.now() - start) });
    setState({ kind: "running", order: order.body, points: [...points] });
    // Compensarea e asincronă: outbox → RabbitMQ → monolitul pune stocul înapoi.
    for (let i = 0; i < 40 && !cancelled.current; i++) {
      await sleep(250);
      const stock = await fetchStock(baseUrl, first.id);
      if (stock === before) {
        points.push({ label: "după compensare", stock, t: Math.round(performance.now() - start) });
        setState({ kind: "done", order: order.body, points: [...points], tooMany, second });
        return;
      }
    }
    setState({ kind: "waiting", order: order.body, points: [...points], tooMany, second });
  }, [baseUrl, token]);

  return { products, loadProducts, state, run };
}

// Panoul 4 — outbox: o comandă asincronă, urmărită până când nu mai e PENDING.
export function useOutboxOrder() {
  const { baseUrl } = useApiBase();
  const { token } = useSession();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async (productId) => {
    if (!token) { setState({ kind: "login" }); return; }
    const r = await placeOrder(baseUrl, token, [{ productId, quantity: 1 }], "async");
    if (!r.body || r.status !== 202) { setState({ kind: "error", status: r.status }); return; }
    const id = r.body.id;
    setState({ kind: "pending", id, since: Date.now() });
    for (let i = 0; i < 240; i++) {               // până la 2 minute: cât îți ia să pornești RabbitMQ
      await sleep(500);
      const o = await fetchOrder(baseUrl, token, id);
      if (o && o.status !== "PENDING") { setState({ kind: "done", id, status: o.status, after: Date.now() }); return; }
      setState((s) => ({ ...s, kind: "pending" }));
    }
  }, [baseUrl, token]);
  return { state, run };
}

export function useDlqReplay() {
  const { baseUrl } = useApiBase();
  const { token, session } = useSession();
  const [state, setState] = useState(null);
  const run = useCallback(async () => setState(await replayDlq(baseUrl, token)), [baseUrl, token]);
  return { state, run, isAdmin: !!session && session.role === "ADMIN" };
}
