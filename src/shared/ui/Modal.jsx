import { useEffect } from "react";
import { cn } from "../lib/index.js";
import "./Modal.css";

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose && onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ui-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ui-modal__scrim" onClick={onClose} />
      <div className={cn("ui-modal__panel")}>
        <header className="ui-modal__head">
          <h2>{title}</h2>
          <button className="ui-modal__close" onClick={onClose} aria-label="Închide">×</button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
}
