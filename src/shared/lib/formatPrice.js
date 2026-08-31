export function formatPrice(value, currency = "MDL") {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(n);
}
