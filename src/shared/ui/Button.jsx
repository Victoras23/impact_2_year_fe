import { cn } from "../lib/index.js";
import "./Button.css";

export function Button({ variant = "primary", size = "md", className, ...rest }) {
  return <button className={cn("ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, className)} {...rest} />;
}
