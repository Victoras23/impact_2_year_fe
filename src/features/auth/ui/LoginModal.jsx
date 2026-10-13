import { useEffect, useState } from "react";
import { Modal, Button, Field, TextInput } from "../../../shared/ui/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { useSession } from "../../../entities/session/index.js";
import { authApi } from "../api/authApi.js";
import "./LoginModal.css";

export function LoginModal({ open, onClose }) {
  const { baseUrl } = useApiBase();
  const { setSession } = useSession();
  const [mode, setMode] = useState("login");           // "login" | "register"
  const [email, setEmail] = useState("user@impact.md");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Lecția 16 — după un 429, butonul rămâne blocat până trece Retry-After,
  // cu numărătoare inversă: nu are rost să trimitem cereri pe care backend-ul
  // oricum le va refuza.
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const secondsLeft = Math.max(0, Math.ceil((blockedUntil - now) / 1000));

  useEffect(() => {
    if (!blockedUntil) return undefined;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= blockedUntil) {
        setBlockedUntil(0);
        setError(null);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [blockedUntil]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fn = mode === "login" ? authApi.login : authApi.register;
      const data = await fn(baseUrl, { email: email.trim(), password });
      setSession({ token: data.token, refreshToken: data.refreshToken, email: data.email, role: data.role });
      setPassword("");
      onClose();
    } catch (err) {
      if (err.status === 429 && err.retryAfter) {
        setNow(Date.now());
        setBlockedUntil(Date.now() + err.retryAfter * 1000);
        setError("Prea multe încercări de pe acest dispozitiv. Așteaptă puțin și încearcă din nou.");
      } else if (err.status === 401 && err.remaining !== null && err.remaining <= 2) {
        setError(err.message + (err.remaining === 0
          ? " — aceasta a fost ultima încercare în acest minut."
          : " — mai ai " + err.remaining + (err.remaining === 1 ? " încercare" : " încercări") + " în acest minut."));
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}
           title={mode === "login" ? "Autentificare" : "Cont nou"}>
      <form className="login-form" onSubmit={submit}>
        <Field label="Email">
          <TextInput type="email" value={email} autoComplete="username"
                     onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Parolă">
          <TextInput type="password" value={password} autoComplete="current-password"
                     onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? <p className="login-form__error">{error}</p> : null}
        <Button type="submit" disabled={busy || secondsLeft > 0}>
          {secondsLeft > 0 ? "Așteaptă " + secondsLeft + " s"
            : busy ? "Se trimite…" : mode === "login" ? "Intră în cont" : "Creează cont"}
        </Button>
        <button type="button" className="login-form__switch"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
          {mode === "login" ? "Nu ai cont? Creează unul" : "Ai deja cont? Autentifică-te"}
        </button>
        <p className="login-form__hint">Cont de test: user@impact.md / user123</p>
      </form>
    </Modal>
  );
}
