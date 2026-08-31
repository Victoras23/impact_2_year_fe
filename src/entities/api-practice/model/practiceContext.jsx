import { createContext, useContext, useMemo, useState } from "react";

// Ține minte, pentru fiecare verb HTTP, ultima cerere făcută în timpul lecției:
// statusul, textul răspunsului și dacă a trecut verificarea.
const PracticeContext = createContext(null);

export function PracticeProvider({ children }) {
  const [log, setLog] = useState({});   // { GET: {ok, status, text, ms, at}, ... }

  const value = useMemo(() => ({
    log,
    record(method, result) {
      setLog((prev) => ({ ...prev, [method]: { ...result, at: Date.now() } }));
    },
    reset() { setLog({}); },
  }), [log]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice must be used inside <PracticeProvider>");
  return ctx;
}
