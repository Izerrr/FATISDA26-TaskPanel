const API_CACHE = "fatisda-api-v1";
const CACHEABLE_PATHS = ["/api/schedule", "/api/schedule/exam", "/api/courses"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("fatisda-") && key !== API_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;

  const isCacheableApi = CACHEABLE_PATHS.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  );
  if (!isCacheableApi) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const copy = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: "Offline", cached: false }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
  );
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "FATISDA TaskPanel",
    body: "Ada pembaruan baru di dashboard.",
    href: "/dashboard",
    tag: "fatisda-notif",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        href: parsed.href || payload.href,
        tag: parsed.tag || payload.tag,
      };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.tag,
      data: { href: payload.href },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawHref = event.notification.data?.href || "/dashboard";
  const targetUrl = new URL(rawHref, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(targetUrl).then((navClient) => (navClient ? navClient.focus() : client.focus()));
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
