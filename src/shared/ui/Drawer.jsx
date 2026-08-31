import { useEffect } from "react";
import { cn } from "../lib/index.js";
import "./Drawer.css";

export function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose && onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cn("ui-drawer", open && "ui-drawer--open")} aria-hidden={!open}>
      <div className="ui-drawer__scrim" onClick={onClose} />
      <aside className="ui-drawer__panel" role="dialog" aria-label={title}>
        <header className="ui-drawer__head">
          <h2>{title}</h2>
          <button className="ui-drawer__close" onClick={onClose} aria-label="Închide">×</button>
        </header>
        <div className="ui-drawer__body">{children}</div>
        {footer ? <footer className="ui-drawer__foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}
