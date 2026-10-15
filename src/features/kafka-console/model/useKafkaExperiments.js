import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { PRODUCTS_PATH } from "../../../shared/config/index.js";
import { useSession } from "../../../entities/session/index.js";
import { placeOrder, fetchMyOrders, fetchQueueStats, notifyOrdersChanged } from "../../../entities/order/index.js";
import {
  fetchKafkaStats, fetchKafkaEvents, fetchSalesSummary, pauseAnalytics, resumeAnalytics, replayAnalytics, totalLag,
} from "../../../entities/analytics/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => (performance && performance.now ? performance.now() : Date.now());

function useAdmin() {
  const { baseUrl } = useApiBase();
  const { token, session } = useSession();
  return { baseUrl, token, isAdmin: !!session && session.role === "ADMIN" };
}

async function productWithMostStock(baseUrl) {
  const res = await request(joinUrl(baseUrl, PRODUCTS_PATH + "?size=50"));
  if (!res.ok) return null;
  try { return JSON.parse(res.text).content.reduce((a, b) => (b.stock > a.stock ? b : a)); } catch { return null; }
}

// Așteaptă până nu mai e nicio comandă PENDING dintre cele date (polling la 1 s — Lecția 16 numără și asta).
async function waitConfirmed(baseUrl, token, ids, timeoutMs = 40000) {
  const started = now();
  while (now() - started < timeoutMs) {
    const res = await fetchMyOrders(baseUrl, token);
    if (res.ok) {
      const mine = (res.data || []).filter((o) => ids.includes(o.id));
      if (mine.length === ids.length && mine.every((o) => o.status !== "PENDING")) return mine;
    }
    await sleep(1000);
  }
  return null;
}

// 0 = backend-ul nu răspunde; 503 = Kafka oprit; orice altceva (ex. 500) = altă eroare — cu statusul real.
const failure = (status) => (status === 0 ? { kind: "down" } : status === 503 ? { kind: "unavailable" } : { kind: "error", status });

const statsKey = (s) => s && `${s.ordersPlaced}/${s.ordersConfirmed}/${s.ordersRejected}/${s.revenue}`;

// Panoul 0 — topicurile: offset final, offset citit de grupul analytics, lag, cine citește fiecare partiție.
export function useKafkaStats() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });
  const refresh = useCallback(async () => {
    const res = await fetchKafkaStats(baseUrl);
    if (res.status === 0) setState({ kind: "down" });
    else if (!res.ok) setState(failure(res.status));
    else setState({ kind: "done", data: res.data });
  }, [baseUrl]);
  return { state, refresh };
}

// Panoul 1 — 3 comenzi, apoi jurnalul: fiecare comandă are 2 evenimente (PLACED, CONFIRMED),
// mereu în aceeași partiție, pentru că au aceeași cheie (orderId).
export function useEventLog() {
  const { baseUrl, token, isAdmin } = useAdmin();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAdmin) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading" });
    const product = await productWithMostStock(baseUrl);
    if (!product) { setState({ kind: "down" }); return; }
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const res = await placeOrder(baseUrl, token, [{ id: product.id, qty: 1 }]);
      if (res.status === 202) ids.push(res.data.id);
    }
    notifyOrdersChanged();
    await waitConfirmed(baseUrl, token, ids);
    await sleep(1000);
    const ev = await fetchKafkaEvents(baseUrl, token, 40);
    if (!ev.ok) { setState(failure(ev.status)); return; }
    const keys = ids.map(String);
    const rows = ev.data.events
      .filter((e) => (e.topic === "shop.orders" && keys.includes(e.key))
        || (e.topic === "shop.stock" && ids.includes(e.value && e.value.orderId)))
      .sort((a, b) => a.topic.localeCompare(b.topic) || a.partition - b.partition || a.offset - b.offset);
    const perOrder = ids.map((id) => {
      const mine = rows.filter((r) => r.topic === "shop.orders" && r.key === String(id));
      return { id, partitions: [...new Set(mine.map((r) => r.partition))], types: mine.map((r) => r.type) };
    });
    setState({ kind: "done", rows, perOrder });
  }, [baseUrl, token, isAdmin]);
  return { state, run };
}

// Panoul 2 — handler-ul oprit: comenzile se confirmă în continuare, evenimentele se adună (lag),
// statisticile stau pe loc. La pornire, handler-ul recuperează tot.
export function useLagExperiment() {
  const { baseUrl, token, isAdmin } = useAdmin();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAdmin) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading", step: "pause" });
    const paused = await pauseAnalytics(baseUrl, token);
    if (!paused.ok) { setState(failure(paused.status)); return; }
    await sleep(1500);
    const before = (await fetchSalesSummary(baseUrl, token)).data;
    const product = await productWithMostStock(baseUrl);
    const ids = [];
    setState({ kind: "loading", step: "orders" });
    for (let i = 0; i < 5; i++) {
      const res = await placeOrder(baseUrl, token, [{ id: product.id, qty: 1 }]);
      if (res.status === 202) ids.push(res.data.id);
    }
    notifyOrdersChanged();
    await waitConfirmed(baseUrl, token, ids);
    await sleep(800);
    const lagWhilePaused = totalLag((await fetchKafkaStats(baseUrl)).data);
    const during = (await fetchSalesSummary(baseUrl, token)).data;
    setState({ kind: "loading", step: "resume", before, during, lagWhilePaused });
    const started = now();
    await resumeAnalytics(baseUrl, token);
    let lag = lagWhilePaused;
    while (lag > 0 && now() - started < 20000) {
      await sleep(400);
      lag = totalLag((await fetchKafkaStats(baseUrl)).data);
    }
    const catchUpMs = Math.round(now() - started);
    const after = (await fetchSalesSummary(baseUrl, token)).data;
    notifyOrdersChanged();
    setState({ kind: "done", before, during, after, lagWhilePaused, catchUpMs, orders: ids.length });
  }, [baseUrl, token, isAdmin]);
  return { state, run };
}

// Panoul 3 — replay: statisticile șterse și reconstruite din jurnal, de la offset 0.
export function useReplay() {
  const { baseUrl, token, isAdmin } = useAdmin();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAdmin) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading" });
    const before = await fetchSalesSummary(baseUrl, token);
    if (!before.ok) { setState(failure(before.status)); return; }
    const started = now();
    const res = await replayAnalytics(baseUrl, token);
    if (!res.ok) { setState(failure(res.status)); return; }
    let after = null;
    let lowest = null;
    while (now() - started < 30000) {
      after = (await fetchSalesSummary(baseUrl, token)).data;
      if (lowest === null || after.ordersPlaced < lowest) lowest = after.ordersPlaced;
      if (statsKey(after) === statsKey(before.data)) break;
      await sleep(500);
    }
    setState({ kind: "done", before: before.data, after, lowest, ms: Math.round(now() - started),
      same: statsKey(after) === statsKey(before.data) });
  }, [baseUrl, token, isAdmin]);
  return { state, run };
}

// Panoul 4 — după consum: în RabbitMQ mesajul dispare, în Kafka evenimentul rămâne în jurnal.
export function useCompare() {
  const { baseUrl, token, isAdmin } = useAdmin();
  const [state, setState] = useState({ kind: "idle" });
  const run = useCallback(async () => {
    if (!isAdmin) { setState({ kind: "anon" }); return; }
    setState({ kind: "loading" });
    const [kafka, events, mq] = await Promise.all([
      fetchKafkaStats(baseUrl), fetchKafkaEvents(baseUrl, token, 50), fetchQueueStats(baseUrl)]);
    if (!kafka.ok || !mq.ok) { setState(failure(kafka.ok ? mq.status : kafka.status)); return; }
    const inLog = kafka.data.topics.reduce((s, t) => s + t.partitions.reduce((a, p) => a + p.endOffset, 0), 0);
    setState({ kind: "done", inLog, lag: totalLag(kafka.data), readable: events.ok ? events.data.events.length : 0,
      rabbit: mq.data.queues["order.confirmation"].messages });
  }, [baseUrl, token, isAdmin]);
  return { state, run };
}
