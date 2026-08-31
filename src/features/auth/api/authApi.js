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
};
