// Concatenează clase CSS, ignorând valorile false/undefined.
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
