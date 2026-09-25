import { useCallback, useEffect, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { CONFIG_INFO_PATH } from "../../../shared/config/index.js";

// Lecția 6 — arată profilul Spring activ (dev/prod), citit din
// GET /api/v1/config/info. Se verifică automat la montare (e doar informativ,
// nu face parte din consola de practică a Lecției 1) și la un click, ca să
// se poată reverifica după o repornire a backend-ului pe alt profil.
export function useEnvInfo() {
  const { baseUrl } = useApiBase();
  const [state, setState] = useState({ kind: "idle" });

  const check = useCallback(async () => {
    setState({ kind: "loading" });
    const res = await request(joinUrl(baseUrl, CONFIG_INFO_PATH), { method: "GET" });
    if (!res.ok) {
      setState({ kind: "down" });
      return;
    }
    try {
      const data = JSON.parse(res.text);
      setState({ kind: "ok", profile: data.profile, appName: data.appName });
    } catch {
      setState({ kind: "down" });
    }
  }, [baseUrl]);

  useEffect(() => {
    check();
  }, [check]);

  return { state, check };
}
