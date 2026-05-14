import { useState, useEffect, useMemo, useCallback } from "react";

import { useDebounce } from "./useDebounce";
import {
  isAvailableAtLocation,
  isAvailableNow,
  isLocationOpen,
} from "@/lib/utils/availability";
import type {
  CatalogData,
  AppCategory,
  AppModifierList,
  AppAvailabilityPeriod,
  AppMenuItem,
  AppBusinessHoursPeriod,
} from "@/types/app";

interface UseCatalogOptions {
  locationId: string | null;
  locationTimezone: string;
  locationBusinessHours: AppBusinessHoursPeriod[];
  categoryId: string | null;
  searchQuery: string;
}

export interface VisibleItem {
  item: AppMenuItem;
  availableNow: boolean;
}

interface UseCatalogResult {
  visibleItems: VisibleItem[];
  availableCategories: AppCategory[];
  modifierLists: AppModifierList[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isSearchPending: boolean;
}

export const useCatalog = ({
  locationId,
  locationTimezone,
  locationBusinessHours,
  categoryId,
  searchQuery,
}: UseCatalogOptions): UseCatalogResult => {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setCatalog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchTrigger]);

  const debouncedSearchQuery = useDebounce(searchQuery);

  // Build an ID → period map once per catalog load for O(1) lookups during filtering
  const availabilityPeriodById = useMemo<
    Map<string, AppAvailabilityPeriod>
  >(() => {
    if (!catalog) return new Map();
    return new Map(catalog.availabilityPeriods.map((p) => [p.id, p]));
  }, [catalog]);

  const { visibleItems, availableCategories } = useMemo<{
    visibleItems: VisibleItem[];
    availableCategories: AppCategory[];
  }>(() => {
    if (!catalog || !locationId)
      return { visibleItems: [], availableCategories: [] };

    const categoryById = new Map(catalog.categories.map((c) => [c.id, c]));

    // Step 1 — keep only items present at the selected location
    const locationFiltered = catalog.items.filter((item) =>
      isAvailableAtLocation(item, locationId),
    );

    // Step 2 — annotate each item with whether it is currently orderable.
    // Both the location's business hours AND the category's availability window
    // must be open. Items outside either window are shown but visually disabled
    // so guests understand why they can't order rather than wondering where items went.
    const locationCurrentlyOpen = isLocationOpen(locationBusinessHours, locationTimezone);

    const timeAnnotated: VisibleItem[] = locationFiltered.map((item) => {
      if (!locationCurrentlyOpen) return { item, availableNow: false };

      const category = item.categoryId
        ? categoryById.get(item.categoryId)
        : undefined;

      if (!category || category.availabilityPeriodIds.length === 0) {
        return { item, availableNow: true };
      }

      const periods = category.availabilityPeriodIds
        .map((id) => availabilityPeriodById.get(id))
        .filter((p): p is AppAvailabilityPeriod => p !== undefined);

      return { item, availableNow: isAvailableNow(periods, locationTimezone) };
    });

    // Step 3 — apply the active category pill filter
    const categoryFiltered = categoryId
      ? timeAnnotated.filter(({ item }) => item.categoryId === categoryId)
      : timeAnnotated;

    // Step 4 — apply search query against name and description
    const query = debouncedSearchQuery.trim().toLowerCase();
    const searchFiltered = query
      ? categoryFiltered.filter(
          ({ item }) =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query),
        )
      : categoryFiltered;

    // Derive category pills from location-filtered items only, so pills don't
    // disappear when the user narrows by category or search
    const categoryIdsWithItems = new Set(
      locationFiltered.map((item) => item.categoryId).filter(Boolean),
    );
    const availableCategories = catalog.categories.filter((c) =>
      categoryIdsWithItems.has(c.id),
    );

    return { visibleItems: searchFiltered, availableCategories };
  }, [
    catalog,
    locationId,
    locationTimezone,
    locationBusinessHours,
    categoryId,
    debouncedSearchQuery,
    availabilityPeriodById,
  ]);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  // True during the 300ms debounce window — lets the UI show a search spinner
  const isSearchPending = searchQuery !== debouncedSearchQuery;

  return {
    visibleItems,
    availableCategories,
    modifierLists: catalog?.modifierLists ?? [],
    loading,
    error,
    refetch,
    isSearchPending,
  };
};
