import { cn } from "../lib/index.js";
import "./Badge.css";

export function Badge({ tone = "neutral", className, ...rest }) {
  return <span className={cn("ui-badge", `ui-badge--${tone}`, className)} {...rest} />;
}
