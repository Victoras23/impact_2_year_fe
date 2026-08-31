import { cn } from "../lib/index.js";
import "./Card.css";

export function Card({ className, ...rest }) {
  return <div className={cn("ui-card", className)} {...rest} />;
}
