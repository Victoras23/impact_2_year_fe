import { useCallback, useState } from "react";
import { request, joinUrl, useApiBase } from "../../../shared/api/index.js";
import { AUTH_PATHS } from "../../../shared/config/index.js";
import { useSession } from "../../../entities/session/index.js";

// Lecția 11 — verificare live, nu simulată: trimite refresh tokenul curent la
// backend, primește o pereche NOUĂ (token + refresh token), apoi retrimite
// tokenul VECHI — ca să demonstreze că rotația chiar l-a revocat, nu doar că
// „ar trebui" să-l revoce.
export function useRefreshCheck() {
  const { baseUrl } = useApiBase();
  const { session, setSession } = useSession();
  const [state, setState] = useState({ kind: "idle" });

  const run = useCallback(async () => {
    if (!session || !session.refreshToken) {
      setState({ kind: "no-session" });
      return;
    }
    setState({ kind: "loading" });

    const oldRefreshToken = session.refreshToken;
    const firstRes = await request(joinUrl(baseUrl, AUTH_PATHS.refresh), {
      method: "POST", body: { refreshToken: oldRefreshToken },
    });

    if (!firstRes.ok) {
      if (firstRes.status === 0) { setState({ kind: "down" }); return; }
      let message = null;
      try { message = JSON.parse(firstRes.text).message; } catch { /* ignore */ }
      setState({ kind: "done", newTokenReceived: false, newTokenMessage: message || ("eroare " + firstRes.status) });
      return;
    }

    const rotated = JSON.parse(firstRes.text);
    // Actualizăm sesiunea cu perechea nouă — dacă am mai apăsa butonul o dată,
    // testul ar trebui să treacă din nou, cu perechea asta ca punct de plecare.
    setSession({ ...session, token: rotated.token, refreshToken: rotated.refreshToken });

    const reuseRes = await request(joinUrl(baseUrl, AUTH_PATHS.refresh), {
      method: "POST", body: { refreshToken: oldRefreshToken },
    });
    let reuseMessage = null;
    try { reuseMessage = JSON.parse(reuseRes.text).message; } catch { /* ignore */ }
    const reuseRejected = reuseRes.status === 401;

    setState({
      kind: "done",
      newTokenReceived: !!rotated.token && rotated.refreshToken !== oldRefreshToken,
      newRefreshToken: rotated.refreshToken,
      reuseRejected,
      reuseStatus: reuseRes.status,
      reuseMessage,
    });
  }, [baseUrl, session, setSession]);

  return { state, run, isAuthed: !!(session && session.refreshToken) };
}
