import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_API_BASE, STORAGE } from "../config/index.js";
import { readStorage, writeStorage } from "../lib/index.js";

const ApiBaseContext = createContext(null);

export function ApiBaseProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState(() => readStorage(STORAGE.apiBase, DEFAULT_API_BASE));
  useEffect(() => { writeStorage(STORAGE.apiBase, baseUrl); }, [baseUrl]);
  const value = useMemo(() => ({ baseUrl, setBaseUrl }), [baseUrl]);
  return <ApiBaseContext.Provider value={value}>{children}</ApiBaseContext.Provider>;
}

export function useApiBase() {
  const ctx = useContext(ApiBaseContext);
  if (!ctx) throw new Error("useApiBase must be used inside <ApiBaseProvider>");
  return ctx;
}
