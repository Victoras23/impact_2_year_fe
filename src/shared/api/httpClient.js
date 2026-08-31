// Client HTTP minim, folosit de toate straturile de mai sus.
// Întoarce mereu un obiect descriptiv, nu aruncă excepții.
export async function request(url, { method = "GET", body } = {}) {
  const started = (performance && performance.now) ? performance.now() : Date.now();
  const options = { method, headers: {} };
  if (body !== undefined && body !== null && method !== "GET" && method !== "HEAD") {
    options.headers["Content-Type"] = "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      text,
      ms: Math.round(((performance && performance.now) ? performance.now() : Date.now()) - started),
    };
  } catch (err) {
    return { ok: false, status: 0, statusText: "", text: "", error: String((err && err.message) || err), ms: 0 };
  }
}

export function joinUrl(base, path) {
  return String(base || "").replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");
}
