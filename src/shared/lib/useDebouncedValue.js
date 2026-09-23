import { useEffect, useState } from "react";

// Întârzie o valoare cu `delayMs` — folosit la căutare, ca să nu trimitem o
// cerere la fiecare apăsare de tastă, ci abia când utilizatorul se oprește.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
