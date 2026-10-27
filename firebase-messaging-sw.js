/*
 * Lecția 25 — service worker-ul pentru notificări push.
 *
 * Un service worker e un script pe care browserul îl ține „deoparte” de pagină: rulează și când
 * tab-ul e în fundal sau închis. Când Firebase trimite o notificare, browserul îl trezește cu un
 * eveniment „push”. Fișierul e servit de containerul frontend (http://localhost:3000), la rădăcină —
 * un service worker controlează doar paginile de sub folderul lui.
 *
 * Fără bibliotecă: FCM livrează un JSON { notification: { title, body }, data: { ... } }.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { notification: { title: "Impact Shop", body: event.data ? event.data.text() : "" } };
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  event.waitUntil(handle(notification, data));
});

async function handle(notification, data) {
  const title = notification.title || "Impact Shop";
  const body = notification.body || "";
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const visible = windows.some((c) => c.visibilityState === "visible");

  // Tab-ul e în față: pagina arată notificarea ei însăși (fără fereastră de sistem peste ea).
  // În fundal: o arată sistemul de operare. „tag” = o notificare nouă a aceleiași comenzi o înlocuiește.
  if (!visible) {
    await self.registration.showNotification(title, {
      body,
      data,
      tag: data.orderId ? "order-" + data.orderId : undefined,
    });
  }
  // Oricum, pagina (dacă e deschisă) află — ca s-o adauge în listă.
  for (const client of windows) {
    client.postMessage({ type: "impact-push", title, body, data, receivedAt: Date.now(), shownBySystem: !visible });
  }
}

// Click pe notificare: aducem în față un tab deschis sau deschidem unul nou.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (windows.length > 0) return windows[0].focus();
    return self.clients.openWindow(url);
  })());
});
