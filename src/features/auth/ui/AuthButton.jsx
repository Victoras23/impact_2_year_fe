import { useState } from "react";
import { useSession } from "../../../entities/session/index.js";
import { LoginModal } from "./LoginModal.jsx";
import "./AuthButton.css";

// Butonul din colțul din dreapta al barei de sus.
export function AuthButton() {
  const { session, isAuthed, logout } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      {isAuthed ? (
        <div className="auth-button auth-button--in">
          <span className="auth-button__user" title={session.email}>
            {session.email}{session.role === "ADMIN" ? " · admin" : ""}
          </span>
          <button className="auth-button__logout" onClick={logout}>Ieși</button>
        </div>
      ) : (
        <button className="auth-button" onClick={() => setOpen(true)}>Autentificare</button>
      )}
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
