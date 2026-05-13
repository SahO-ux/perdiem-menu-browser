import { useState, useEffect, useCallback } from "react";

import type { AppLocation } from "@/types/app";

interface UseLocationsResult {
  locations: AppLocation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLocations = (): UseLocationsResult => {
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/locations");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setLocations(data.locations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load locations",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchTrigger]);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  return { locations, loading, error, refetch };
};
