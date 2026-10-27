import { useCallback, useEffect, useRef, useState } from "react";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { readJson, writeJson } from "../../../shared/lib/index.js";
import { deviceLabel, disablePush, enablePush, environment, onPushFromServiceWorker } from "./firebaseMessaging.js";
import { fetchMyPush, fetchPushConfig, placeTestOrder, registerToken, sendTestPush, unregisterToken } from "./pushApi.js";

const TOKEN_KEY = "impact.ecom.fcmToken";

// Lecția 25 — starea consolei de notificări: ce poate browserul, ce are backend-ul, token-ul
// acestui browser, notificările sosite aici și jurnalul serverului.
export function usePushConsole() {
  const { baseUrl } = useApiBase();
  const { token } = useSession();
  const [env, setEnv] = useState(environment);
  const [config, setConfig] = useState(null);
  const [mine, setMine] = useState(null);
  const [fcmToken, setFcmToken] = useState(() => readJson(TOKEN_KEY, null));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const [received, setReceived] = useState([]);
  const [action, setAction] = useState(null);
  const lastOrder = useRef(null);            // { id, at } — ca să măsurăm „comandă → notificare”

  const refresh = useCallback(async () => {
    if (!token) { setMine(null); return; }
    const res = await fetchMyPush(baseUrl, token);
    if (res.status === 200) setMine(res.body);
  }, [baseUrl, token]);

  useEffect(() => {
    let alive = true;
    fetchPushConfig(baseUrl).then((res) => { if (alive) setConfig(res); });
    return () => { alive = false; };
  }, [baseUrl]);

  // Jurnalul serverului, la fiecare 3 s (ca să vedem notificările comenzilor cum apar).
  useEffect(() => {
    refresh();
    if (!token) return undefined;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh, token]);

  useEffect(() => onPushFromServiceWorker((msg) => {
    const orderId = msg.data && msg.data.orderId ? Number(msg.data.orderId) : null;
    const o = lastOrder.current;
    const elapsedMs = o && orderId === o.id ? msg.receivedAt - o.at : null;
    setReceived((list) => [{ ...msg, orderId, elapsedMs }, ...list].slice(0, 12));
    refresh();
  }), [refresh]);

  const [enableMs, setEnableMs] = useState(null);

  const enable = async () => {
    setBusy(true); setProblem(null); setEnableMs(null);
    const started = Date.now();
    try {
      const result = await enablePush(config.body);
      setEnv(environment());
      if (!result.ok) { setProblem(result); return; }
      const saved = await registerToken(baseUrl, token, result.token, deviceLabel());
      if (saved.status !== 201) { setProblem({ step: "server", status: saved.status }); return; }
      setFcmToken(result.token);
      writeJson(TOKEN_KEY, result.token);
      setEnableMs(Date.now() - started);   // permisiune + service worker + getToken + POST
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      if (fcmToken) await unregisterToken(baseUrl, token, fcmToken);
      await disablePush(config.body);
      setFcmToken(null);
      writeJson(TOKEN_KEY, null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    const res = await sendTestPush(baseUrl, token);
    setAction({ kind: "test", ...res });
    refresh();
  };

  const order = async () => {
    const res = await placeTestOrder(baseUrl, token);
    if (res.body && res.body.id) lastOrder.current = { id: res.body.id, at: Date.now() };
    setAction({ kind: "order", ...res });
    refresh();
  };

  return { env, config, mine, fcmToken, busy, problem, received, action, enableMs, isAuthed: !!token, enable, disable, test, order };
}
