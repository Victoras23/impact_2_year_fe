import { createContext, useContext, useMemo, useState } from "react";
import { STORAGE } from "../../../shared/config/index.js";
import { readJson, writeJson } from "../../../shared/lib/index.js";

// Sesiunea utilizatorului: token JWT + date de bază. Persistată local (dacă se poate).
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readJson(STORAGE.session, null)); // { token, email, role } | null

  const value = useMemo(() => ({
    session,
    token: session ? session.token : null,
    isAuthed: !!session,
    setSession(next) {
      setSession(next);
      writeJson(STORAGE.session, next);
    },
    logout() {
      setSession(null);
      writeJson(STORAGE.session, null);   // șterge tokenul
    },
  }), [session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
