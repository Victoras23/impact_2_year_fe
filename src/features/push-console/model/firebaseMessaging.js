import { getApps, initializeApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";

// Lecția 25 — partea de browser a Firebase Cloud Messaging. Pașii, în ordine:
//   1. permisiunea omului (Notification.requestPermission) — fără „Permite”, nimic nu merge;
//   2. service worker-ul nostru (/firebase-messaging-sw.js) — primește notificările și când
//      tab-ul e în fundal sau închis;
//   3. getToken: Firebase abonează browserul la serviciul de push și ne dă un token —
//      „adresa” acestui browser. Token-ul îl trimitem backend-ului.
const SW_URL = "/firebase-messaging-sw.js";
const APP_NAME = "impact";

export function environment() {
  const hasNotification = typeof window !== "undefined" && "Notification" in window;
  return {
    protocol: location.protocol,
    // http://localhost și https: da; file://: nu. Doar isSecureContext nu ajunge: Chrome îl dă true și pe file://,
    // dar service worker-ul tot nu pornește acolo (văzut în consolă).
    secure: !!window.isSecureContext && /^https?:$/.test(location.protocol),
    serviceWorker: "serviceWorker" in navigator,
    notifications: hasNotification,
    permission: hasNotification ? Notification.permission : "unsupported",
  };
}

// „Chrome pe macOS” — doar ca omul să-și recunoască dispozitivele în listă.
export function deviceLabel() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "?";
  return `${browser} pe ${os}`;
}

function messaging(firebaseConfig) {
  const app = getApps().find((a) => a.name === APP_NAME) || initializeApp(firebaseConfig, APP_NAME);
  return getMessaging(app);
}

export async function enablePush(config) {
  if (!(await isSupported())) return { ok: false, step: "support" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, step: "permission", permission };
  const registration = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;
  try {
    const token = await getToken(messaging(config.firebase), {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: registration,
    });
    return { ok: true, token };
  } catch (e) {
    return { ok: false, step: "token", error: String((e && e.message) || e) };
  }
}

// Dezabonează browserul la Firebase: token-ul vechi devine invalid (UNREGISTERED pentru server).
export async function disablePush(config) {
  try {
    await deleteToken(messaging(config.firebase));
    return true;
  } catch {
    return false;
  }
}

// Service worker-ul ne trimite fiecare notificare primită (vezi firebase-messaging-sw.js).
export function onPushFromServiceWorker(handler) {
  if (!("serviceWorker" in navigator)) return () => {};
  const listener = (event) => {
    if (event.data && event.data.type === "impact-push") handler(event.data);
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
