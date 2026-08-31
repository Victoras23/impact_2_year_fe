import { cn } from "../lib/index.js";
import "./Field.css";

export function Field({ label, hint, className, children }) {
  return (
    <label className={cn("ui-field", className)}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      {children}
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...rest }) {
  return <input className={cn("ui-input", className)} spellCheck="false" {...rest} />;
}

export function TextArea({ className, rows = 3, ...rest }) {
  return <textarea className={cn("ui-input", "ui-input--area", className)} rows={rows} spellCheck="false" {...rest} />;
}
