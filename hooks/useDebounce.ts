import { useState, useEffect } from "react";

import { SEARCH_DEBOUNCE_MS } from "@/constants";

export const useDebounce = <T>(
  value: T,
  delayMs: number = SEARCH_DEBOUNCE_MS,
): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
