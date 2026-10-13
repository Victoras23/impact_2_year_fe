import { request, joinUrl } from "../../../shared/api/index.js";
import { AUTH_PATHS } from "../../../shared/config/index.js";

async function post(baseUrl, path, body) {
  const res = await request(joinUrl(baseUrl, path), { method: "POST", body });
  let data = null;
  try { data = JSON.parse(res.text); } catch (e) { /* ignore */ }
  if (res.error) throw new Error("Backend inaccesibil: " + res.error);
  if (!res.ok) {
    const err = new Error((data && data.message) || ("Eroare " + res.status));
    // Lecția 16 — rate limiting: pe 429, Retry-After spune câte secunde să
    // așteptăm; pe orice răspuns limitat, X-RateLimit-Remaining spune câte
    // încercări mai sunt. LoginModal le folosește ca să nu lase utilizatorul
    // să apese degeaba.
    err.status = res.status;
    err.retryAfter = Number(res.headers["retry-after"]) || null;
    const remaining = res.headers["x-ratelimit-remaining"];
    err.remaining = remaining === undefined ? null : Number(remaining);
    throw err;
  }
  return data;
}

export const authApi = {
  login: (baseUrl, credentials) => post(baseUrl, AUTH_PATHS.login, credentials),
  register: (baseUrl, credentials) => post(baseUrl, AUTH_PATHS.register, credentials),
  // Lecția 11 — refresh tokenul e opac (un UUID, nu un JWT) și ținut în baza de
  // date pe backend, ca să poată fi revocat; rutele de mai jos sunt publice
  // (nu cer Authorization) fiindcă tocmai refresh tokenul E acreditarea.
  refresh: (baseUrl, refreshToken) => post(baseUrl, AUTH_PATHS.refresh, { refreshToken }),
  logout: (baseUrl, refreshToken) => post(baseUrl, AUTH_PATHS.logout, { refreshToken }),
};
