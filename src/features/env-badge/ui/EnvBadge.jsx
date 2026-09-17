import { Badge } from "../../../shared/ui/index.js";
import { useEnvInfo } from "../model/useEnvInfo.js";
import "./EnvBadge.css";

const LABELS = { dev: "Mediu: DEV", prod: "Mediu: PROD" };

export function EnvBadge() {
  const { state, check } = useEnvInfo();

  const tone =
    state.kind === "ok" ? (state.profile === "prod" ? "accent" : "ok")
    : state.kind === "down" ? "bad"
    : "neutral";

  const text =
    state.kind === "ok" ? (LABELS[state.profile] || `Mediu: ${state.profile}`)
    : state.kind === "loading" ? "Se verifică mediul…"
    : state.kind === "down" ? "Mediu necunoscut"
    : "Mediu neverificat";

  return (
    <button
      className="env-badge"
      onClick={check}
      title="GET /api/config/info — profilul Spring activ (dev/prod), setat prin variabile de mediu"
    >
      <Badge tone={tone}>{text}</Badge>
    </button>
  );
}
