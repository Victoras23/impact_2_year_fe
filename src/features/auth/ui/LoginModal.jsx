import { useState } from "react";
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

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fn = mode === "login" ? authApi.login : authApi.register;
      const data = await fn(baseUrl, { email: email.trim(), password });
      setSession({ token: data.token, email: data.email, role: data.role });
      setPassword("");
      onClose();
    } catch (err) {
      setError(err.message);
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
        <Button type="submit" disabled={busy}>
          {busy ? "Se trimite…" : mode === "login" ? "Intră în cont" : "Creează cont"}
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
