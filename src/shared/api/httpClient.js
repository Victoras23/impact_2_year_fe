// Client HTTP minim, folosit de toate straturile de mai sus.
// Întoarce mereu un obiect descriptiv, nu aruncă excepții.
export async function request(url, { method = "GET", body, token } = {}) {
  const started = (performance && performance.now) ? performance.now() : Date.now();
  const options = { method, headers: {} };
  if (body !== undefined && body !== null && method !== "GET" && method !== "HEAD") {
    options.headers["Content-Type"] = "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  // Lecția 11 — rutele de administrare a produselor cer un JWT; restul
  // apelurilor nu trimit deloc acest parametru, deci headerul lipsește.
  if (token) options.headers["Authorization"] = "Bearer " + token;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    // Lecția 10 — consola de securitate citește headerele răspunsului; un obiect
    // simplu e mai ușor de folosit decât res.headers (un Headers iterabil).
    const headers = {};
    res.headers.forEach((value, key) => { headers[key] = value; });
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      text,
      headers,
      ms: Math.round(((performance && performance.now) ? performance.now() : Date.now()) - started),
    };
  } catch (err) {
    return { ok: false, status: 0, statusText: "", text: "", error: String((err && err.message) || err), ms: 0 };
  }
}

export function joinUrl(base, path) {
  return String(base || "").replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");
}
