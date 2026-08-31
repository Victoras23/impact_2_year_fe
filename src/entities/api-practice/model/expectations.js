import { PRACTICE_EXPECTATIONS } from "../../../shared/config/index.js";

// Verifică dacă răspunsul serverului corespunde cerinței lecției pentru un verb.
export function matchesExpectation(method, text) {
  const rule = PRACTICE_EXPECTATIONS[method];
  if (!rule || typeof text !== "string") return false;
  const t = text.trim();
  if (rule.kind === "equals") return t === rule.value;
  if (rule.kind === "prefix") return t.indexOf(rule.value) === 0;
  return false;
}

export const PRACTICE_METHODS = Object.keys(PRACTICE_EXPECTATIONS);
