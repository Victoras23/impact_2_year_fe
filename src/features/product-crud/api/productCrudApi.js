import { request, joinUrl } from "../../../shared/api/index.js";
import { PRACTICE_PATH } from "../../../shared/config/index.js";
import { matchesExpectation } from "../../../entities/api-practice/index.js";

// La Lecția 1 toate operațiile lovesc aceeași rută de practică (/api/practice)
// și doar verifică forma răspunsului. În lecțiile următoare fiecare funcție
// va apela ruta reală (ex. /api/products), fără a schimba componentele.
async function call(baseUrl, method, payload) {
  const res = await request(joinUrl(baseUrl, PRACTICE_PATH), { method, body: payload });
  return {
    method, ...res,
    passed: res.ok && matchesExpectation(method, res.text),
  };
}

export const productCrudApi = {
  create: (baseUrl, payload) => call(baseUrl, "POST", payload),
  replace: (baseUrl, payload) => call(baseUrl, "PUT", payload),
  patch:   (baseUrl, payload) => call(baseUrl, "PATCH", payload),
  remove:  (baseUrl, payload) => call(baseUrl, "DELETE", payload),
};
