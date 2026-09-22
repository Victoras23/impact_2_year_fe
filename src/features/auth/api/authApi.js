import { request, joinUrl } from "../../../shared/api/index.js";
import { AUTH_PATHS } from "../../../shared/config/index.js";

async function post(baseUrl, path, body) {
  const res = await request(joinUrl(baseUrl, path), { method: "POST", body });
  let data = null;
  try { data = JSON.parse(res.text); } catch (e) { /* ignore */ }
  if (res.error) throw new Error("Backend inaccesibil: " + res.error);
  if (!res.ok) throw new Error((data && data.message) || ("Eroare " + res.status));
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
