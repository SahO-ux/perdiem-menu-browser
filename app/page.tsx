"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { useLocations } from "@/hooks/useLocations";
import { useCatalog } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { MenuGrid } from "@/components/MenuGrid";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { CartDrawer } from "@/components/CartDrawer";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DEFAULT_TIMEZONE } from "@/constants";
import { isAvailableAtLocation } from "@/lib/utils/availability";
import type { AppMenuItem, CartItem } from "@/types/app";

export default function Home() {
  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useLocations();

  // null means "no explicit choice yet — use the first location from the list"
  const [manualLocationId, setManualLocationId] = useState<string | null>(null);
  // Deriving avoids a useEffect+setState cascade: first render with locations
  // auto-picks locations[0]; user override (setManualLocationId) takes precedence.
  const selectedLocationId = manualLocationId ?? locations[0]?.id ?? null;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<AppMenuItem | null>(null);
  const [selectedItemAvailableNow, setSelectedItemAvailableNow] =
    useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const selectedLocation =
    locations.find((l) => l.id === selectedLocationId) ?? null;

  const {
    visibleItems,
    availableCategories,
    modifierLists,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
    isSearchPending,
  } = useCatalog({
    locationId: selectedLocationId,
    locationTimezone: selectedLocation?.timezone ?? DEFAULT_TIMEZONE,
    locationBusinessHours: selectedLocation?.businessHours ?? [],
    categoryId: selectedCategoryId,
    searchQuery,
  });

  const {
    items: cartItems,
    itemCount,
    addItem,
    removeItem,
    updateQty,
    clearCart,
  } = useCart();

  // Map menuItem.id → availableNow so the cart can look up each item's status
  const itemAvailabilityById = useMemo(() => {
    const map = new Map<string, boolean>();
    visibleItems.forEach(({ item, availableNow }) =>
      map.set(item.id, availableNow),
    );
    return map;
  }, [visibleItems]);

  // Subtotal counting only items whose category window is currently open.
  // Items not yet in visibleItems (catalog still loading) default to available.
  const availableSubtotal = useMemo(() => {
    const available = cartItems.filter(
      (ci) => itemAvailabilityById.get(ci.menuItem.id) !== false,
    );
    if (available.length === 0) return null;
    const currency = available[0]?.price.currency ?? "USD";
    const amount = available.reduce(
      (sum, i) => sum + i.price.amount * i.quantity,
      0,
    );
    return { amount, currency };
  }, [cartItems, itemAvailabilityById]);

  const handleLocationChange = useCallback(
    (id: string) => {
      setManualLocationId(id);
      setSelectedCategoryId(null);

      if (itemCount === 0) return;

      // Keep items that exist at the new location; only drop ones that don't.
      const unavailable = cartItems.filter(
        (ci) => !isAvailableAtLocation(ci.menuItem, id),
      );

      if (unavailable.length === 0) {
        // Everything carries over — no disruption needed
        return;
      }

      if (unavailable.length === cartItems.length) {
        clearCart();
        toast.info("Cart cleared", {
          description: "None of your items are available at this location.",
        });
      } else {
        unavailable.forEach((ci) => removeItem(ci.variationId));
        toast.info(
          `${unavailable.length} item${unavailable.length !== 1 ? "s" : ""} removed from cart`,
          { description: "Not available at this location." },
        );
      }
    },
    [itemCount, cartItems, clearCart, removeItem],
  );

  const handleItemClick = useCallback(
    (item: AppMenuItem, availableNow: boolean) => {
      setSelectedItem(item);
      setSelectedItemAvailableNow(availableNow);
    },
    [],
  );

  const handleModalClose = useCallback(() => setSelectedItem(null), []);
  const handleCartOpen = useCallback(() => setCartOpen(true), []);
  const handleCartClose = useCallback(() => setCartOpen(false), []);
  const handleAddToCart = useCallback(
    (cartItem: CartItem) => addItem(cartItem),
    [addItem],
  );

  const locationsReady =
    !locationsLoading && !locationsError && locations.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header — always rendered so the navbar never pops in ── */}
      <header className="shrink-0 border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <h1 className="font-semibold text-sm sm:text-base shrink-0">
            Per Diem Menu
          </h1>

          <div className="flex items-center gap-3 ml-auto">
            {locationsLoading ? (
              <Skeleton className="h-8 w-32 rounded-md" />
            ) : selectedLocationId ? (
              <LocationSwitcher
                locations={locations}
                selectedId={selectedLocationId}
                onChange={handleLocationChange}
              />
            ) : null}

            {/* Cart button */}
            <button
              onClick={handleCartOpen}
              aria-label={`Open cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter bar — always rendered; disabled until locations resolve ── */}
      <div className="shrink-0 border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <CategoryFilter
            categories={availableCategories}
            selectedId={selectedCategoryId}
            onChange={setSelectedCategoryId}
            disabled={!locationsReady}
          />
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            loading={isSearchPending}
            disabled={!locationsReady}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          {locationsLoading ? (
            <LoadingState />
          ) : locationsError ? (
            <ErrorState message={locationsError} onRetry={refetchLocations} />
          ) : locations.length === 0 ? (
            <EmptyState message="No active locations found. Check your Square sandbox setup." />
          ) : catalogLoading ? (
            <LoadingState />
          ) : catalogError ? (
            <ErrorState message={catalogError} onRetry={refetchCatalog} />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              message={
                searchQuery.trim()
                  ? `No items match "${searchQuery.trim()}"`
                  : "No items available at this location right now."
              }
            />
          ) : (
            <MenuGrid items={visibleItems} onItemClick={handleItemClick} />
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <ItemDetailModal
        item={selectedItem}
        availableNow={selectedItemAvailableNow}
        modifierLists={modifierLists}
        onClose={handleModalClose}
        onAddToCart={handleAddToCart}
      />
      <CartDrawer
        open={cartOpen}
        onClose={handleCartClose}
        items={cartItems}
        subtotal={availableSubtotal}
        itemAvailability={itemAvailabilityById}
        onRemove={removeItem}
        onUpdateQty={updateQty}
        onClear={clearCart}
      />
    </div>
  );
}
