import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";
import { useSession } from "../../../entities/session/index.js";
import {
  placeOrder, fetchMyOrders, fetchQueueStats, sendPoisonMessage, purgeDeadLetters, notifyOrdersChanged,
} from "../../../entities/order/index.js";

export const BURST_SIZE = 10;
export const QUEUES = { confirmation: "order.confirmation", notification: "order.notification", dlq: "order.confirmation.dlq" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => (performance && performance.now ? performance.now() : Date.now());

async function loadProducts(baseUrl) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "?size=50"));
  if (!res.ok) return null;
  try { return JSON.parse(res.text).content || []; } catch { return null; }
}

// Așteaptă până când toate comenzile cu id-urile date nu mai sunt PENDING.
// Polling la 1 s — rate limiting-ul din Lecția 16 numără și aceste cereri.
async function waitForOrders(baseUrl, token, ids, onTick, timeoutMs = 40000) {
  const started = now();
  while (now() - started < timeoutMs) {
    const res = await fetchMyOrders(baseUrl, token);
    if (res.ok) {
      const mine = (res.data || []).filter((o) => ids.includes(o.id));
      if (onTick) onTick(mine);
      if (mine.length === ids.length && mine.every((o) => o.status !== "PENDING")) return { orders: mine, ms: Math.round(now() - started) };
    }
    await sleep(1000);
  }
  return null;
}

// Starea cozilor: mesaje în așteptare și consumatori, pentru fiecare coadă.
export function useQueueStats() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const refresh = useCallback(async () => {
    const res = await fetchQueueStats(baseUrl);
    if (res.status === 0) setState({ kind: "down" });
    else if (!res.ok) setState({ kind: "unavailable" });
    else setState({ kind: "done", queues: res.data.queues });
  }, [baseUrl]);
  return { state, refresh };
}

function useAuthed() {
  const { baseUrl } = useApiBase();
  const { token, isAuthed } = useSession();
  return { baseUrl, token, isAuthed };
}

// Panoul 1 — aceeași comandă, o dată sincron (clientul așteaptă munca lentă) și o
// dată asincron (202 imediat, confirmarea vine din RabbitMQ).
export function useSyncVsAsync() {
  const { baseUrl, token, isAuthed } = useAuthed();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAuthed) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading", step: "sync" });
    const products = await loadProducts(baseUrl);
    if (!products) { setState({ kind: "down" }); return; }
    const product = products.reduce((a, b) => (b.stock > a.stock ? b : a));
    const items = [{ id: product.id, qty: 1 }];
    const sync = await placeOrder(baseUrl, token, items, "sync");
    setState({ kind: "loading", step: "async", sync });
    const clicked = now();
    const asyncRes = await placeOrder(baseUrl, token, items, "async");
    notifyOrdersChanged();
    if (asyncRes.status !== 202) { setState({ kind: "error", status: asyncRes.status, sync }); return; }
    setState({ kind: "loading", step: "wait", sync, async: asyncRes });
    const done = await waitForOrders(baseUrl, token, [asyncRes.data.id]);
    notifyOrdersChanged();
    setState({ kind: "done", product, sync, async: asyncRes,
      confirmed: done ? done.orders[0] : null, confirmMs: Math.round(now() - clicked) });
  }, [baseUrl, token, isAuthed]);
  return { state, run };
}

// Panoul 2 — 10 comenzi deodată: coada se umple, iar cele două instanțe (competing
// consumers) o golesc împreună.
export function useBurst() {
  const { baseUrl, token, isAuthed } = useAuthed();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAuthed) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading", depth: [], orders: [] });
    const products = await loadProducts(baseUrl);
    if (!products) { setState({ kind: "down" }); return; }
    const product = products.reduce((a, b) => (b.stock > a.stock ? b : a));
    const started = now();
    const ids = [];
    for (let i = 0; i < BURST_SIZE; i++) {
      const res = await placeOrder(baseUrl, token, [{ id: product.id, qty: 1 }]);
      if (res.status === 202) ids.push(res.data.id);
    }
    const postedMs = Math.round(now() - started);
    notifyOrdersChanged();
    const depth = [];
    let orders = [];
    while (now() - started < 40000) {
      const stats = await fetchQueueStats(baseUrl);
      if (stats.ok) depth.push(stats.data.queues[QUEUES.confirmation].messages);
      const res = await fetchMyOrders(baseUrl, token);
      if (res.ok) orders = (res.data || []).filter((o) => ids.includes(o.id));
      setState({ kind: "loading", depth: [...depth], orders, postedMs });
      if (orders.length === ids.length && orders.every((o) => o.status !== "PENDING")) break;
      await sleep(1000);
    }
    const counts = {};
    orders.forEach((o) => { const k = o.processedBy || "?"; counts[k] = (counts[k] || 0) + 1; });
    notifyOrdersChanged();
    setState({ kind: "done", depth, orders, postedMs, totalMs: Math.round(now() - started), counts, sent: ids.length });
  }, [baseUrl, token, isAuthed]);
  return { state, run };
}

// Panoul 3 — un mesaj „otrăvit” (comanda 0 nu există): 3 încercări, apoi DLQ.
export function usePoison() {
  const { baseUrl, token, isAuthed } = useAuthed();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAuthed) { setState({ kind: "anon" }); return; }
    const before = await fetchQueueStats(baseUrl);
    if (!before.ok) { setState({ kind: before.status === 0 ? "down" : "unavailable" }); return; }
    const baseline = before.data.queues[QUEUES.dlq].messages;
    const started = now();
    await sendPoisonMessage(baseUrl, token);
    setState({ kind: "loading", baseline });
    while (now() - started < 15000) {
      await sleep(300);
      const stats = await fetchQueueStats(baseUrl);
      if (stats.ok && stats.data.queues[QUEUES.dlq].messages > baseline) {
        setState({ kind: "done", ms: Math.round(now() - started), dlq: stats.data.queues[QUEUES.dlq].messages });
        return;
      }
    }
    setState({ kind: "timeout" });
  }, [baseUrl, token, isAuthed]);
  const purge = useCallback(async () => {
    const res = await purgeDeadLetters(baseUrl, token);
    setState(res.ok ? { kind: "purged" } : { kind: "error", status: res.status });
  }, [baseUrl, token]);
  return { state, run, purge };
}

// Panoul 4 — mai mult decât e în stoc: comanda e RESPINSĂ de consumator (eroare de
// business), nu reîncercată — și stocul rămâne neatins.
export function useOutOfStock() {
  const { baseUrl, token, isAuthed } = useAuthed();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAuthed) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading" });
    const products = await loadProducts(baseUrl);
    if (!products) { setState({ kind: "down" }); return; }
    const candidates = products.filter((p) => p.stock < 20);
    if (!candidates.length) { setState({ kind: "nocandidate" }); return; }
    const product = candidates.reduce((a, b) => (b.stock < a.stock ? b : a));
    const quantity = product.stock + 1;
    const res = await placeOrder(baseUrl, token, [{ id: product.id, qty: quantity }]);
    notifyOrdersChanged();
    if (res.status !== 202) { setState({ kind: "error", status: res.status }); return; }
    const done = await waitForOrders(baseUrl, token, [res.data.id]);
    const after = (await loadProducts(baseUrl) || []).find((p) => p.id === product.id);
    notifyOrdersChanged();
    setState({ kind: "done", product, quantity, order: done ? done.orders[0] : null, stockAfter: after ? after.stock : null });
  }, [baseUrl, token, isAuthed]);
  return { state, run };
}
