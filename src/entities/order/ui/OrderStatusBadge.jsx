import { Badge } from "../../../shared/ui/index.js";

const LABEL = { PENDING: "în coadă", CONFIRMED: "confirmată", REJECTED: "respinsă" };
const TONE = { PENDING: "neutral", CONFIRMED: "ok", REJECTED: "bad" };

export function OrderStatusBadge({ status }) {
  return <Badge tone={TONE[status] || "neutral"}>{status} · {LABEL[status] || "?"}</Badge>;
}
