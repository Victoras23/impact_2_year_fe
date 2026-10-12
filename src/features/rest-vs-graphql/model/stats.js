// Statistici simple pentru benchmark. Mediana contează mai mult decât media:
// o singură cerere lentă (ex. garbage collector-ul JVM) strică media, nu și mediana.
export function summarize(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    avg: Math.round(avg * 10) / 10,
    median: pick(0.5),
    p95: pick(0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return bytes + " B";
  return (bytes / 1024).toFixed(1) + " KB";
}

// Acordul numeralului în română: 1 produs, 2–19 produse, 20+ „de produse”.
export function countLabel(n, one, many) {
  if (n === 1) return "1 " + one;
  const mod = n % 100;
  return n + (n !== 0 && (mod === 0 || mod >= 20) ? " de " : " ") + many;
}
