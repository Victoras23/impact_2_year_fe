import { useState } from "react";
import { useSession } from "../../../entities/session/index.js";
import { useApiBase } from "../../../shared/api/index.js";
import { authApi } from "../api/authApi.js";
import { LoginModal } from "./LoginModal.jsx";
import "./AuthButton.css";

// Butonul din colțul din dreapta al barei de sus.
export function AuthButton() {
  const { session, isAuthed, logout } = useSession();
  const { baseUrl } = useApiBase();
  const [open, setOpen] = useState(false);

  // Lecția 11 — deconectarea nu mai șterge doar tokenul local: revocă și
  // refresh tokenul pe backend, ca un al doilea refresh cu el să eșueze.
  // Best-effort — dacă backend-ul nu răspunde, tot ieșim din cont local.
  async function handleLogout() {
    if (session && session.refreshToken) {
      try { await authApi.logout(baseUrl, session.refreshToken); } catch (e) { /* ignore */ }
    }
    logout();
  }

  return (
    <>
      {isAuthed ? (
        <div className="auth-button auth-button--in">
          <span className="auth-button__user" title={session.email}>
            {session.email}{session.role === "ADMIN" ? " · admin" : ""}
          </span>
          <button className="auth-button__logout" onClick={handleLogout}>Ieși</button>
        </div>
      ) : (
        <button className="auth-button" onClick={() => setOpen(true)}>Autentificare</button>
      )}
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
