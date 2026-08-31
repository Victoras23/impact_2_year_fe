import { Badge } from "../../../shared/ui/index.js";
import { useApiStatus } from "../model/useApiStatus.js";
import "./ApiStatusBadge.css";

const TEXT = {
  idle: "API neverificat", online: "API online",
  reachable: "API accesibil", down: "API offline",
};

export function ApiStatusBadge() {
  const { state, check } = useApiStatus();
  const tone = state.kind === "online" ? "ok" : state.kind === "down" ? "bad" : "neutral";
  return (
    <button className="api-status" onClick={check} title="Verifică conexiunea (trimite un GET)">
      <span className={`api-status__dot api-status__dot--${tone}`} />
      <Badge tone={tone}>{TEXT[state.kind] || state.kind}</Badge>
    </button>
  );
}
