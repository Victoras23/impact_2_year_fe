import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { fetchMyOrders, ORDERS_CHANGED } from "../../../entities/order/index.js";

// Lecția 18 — lista se reîncarcă singură cât timp există comenzi PENDING: așa
// vezi statusul schimbându-se când consumatorul RabbitMQ termină. Fără PENDING,
// polling-ul se oprește (rate limiting-ul din Lecția 16 numără și aceste cereri).
const POLL_MS = 1000;

export function useMyOrders() {
  const { baseUrl } = useApiBase();
  const { token, isAuthed } = useSession();
  const [state, setState] = useState({ kind: "idle", orders: [] });
  const timer = useRef(null);
  // O comandă rămasă PENDING pentru totdeauna (mesaj pierdut cât RabbitMQ era
  // oprit) nu trebuie să țină polling-ul pornit la nesfârșit: ne oprim după
  // 30 de reîncărcări fără nicio schimbare.
  const unchanged = useRef({ signature: "", polls: 0 });

  const load = useCallback(async () => {
    if (!isAuthed) { setState({ kind: "anon", orders: [] }); return; }
    const res = await fetchMyOrders(baseUrl, token);
    if (!res.ok) { setState((s) => ({ ...s, kind: "error", status: res.status })); return; }
    const orders = res.data || [];
    const signature = orders.map((o) => `${o.id}:${o.status}:${!!o.notifiedAt}`).join("|");
    unchanged.current = signature === unchanged.current.signature
      ? { signature, polls: unchanged.current.polls + 1 }
      : { signature, polls: 0 };
    setState({ kind: "done", orders });
  }, [baseUrl, token, isAuthed]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onChange = () => { unchanged.current = { signature: "", polls: 0 }; load(); };
    window.addEventListener(ORDERS_CHANGED, onChange);
    return () => window.removeEventListener(ORDERS_CHANGED, onChange);
  }, [load]);

  const pending = unchanged.current.polls < 30
    && state.orders.some((o) => o.status === "PENDING" || !o.notifiedAt);
  useEffect(() => {
    clearTimeout(timer.current);
    if (pending) timer.current = setTimeout(load, POLL_MS);
    return () => clearTimeout(timer.current);
  }, [pending, state, load]);

  return { state, reload: load, polling: pending };
}

// createdAt / confirmedAt vin fără fus orar (LocalDateTime) — diferența e corectă oricum.
export function secondsBetween(from, to) {
  if (!from || !to) return null;
  return ((new Date(to) - new Date(from)) / 1000).toFixed(1);
}
