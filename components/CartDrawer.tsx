"use client";

import { memo } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/price";
import type { CartItem, AppMoney } from "@/types/app";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  /** Pre-filtered subtotal — only counts items whose availability window is open */
  subtotal: AppMoney | null;
  /** menuItem.id → availableNow; absence means unknown (treated as available) */
  itemAvailability: Map<string, boolean>;
  onRemove: (variationId: string) => void;
  onUpdateQty: (variationId: string, quantity: number) => void;
  onClear: () => void;
}

export const CartDrawer = memo(
  ({
    open,
    onClose,
    items,
    subtotal,
    itemAvailability,
    onRemove,
    onUpdateQty,
    onClear,
  }: CartDrawerProps) => {
    const unavailableCount = items.filter(
      (ci) => itemAvailability.get(ci.menuItem.id) === false,
    ).length;

    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-6">
              Your cart is empty.
            </p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1">
                {items.map((cartItem) => {
                  const available =
                    itemAvailability.get(cartItem.menuItem.id) !== false;
                  return (
                    <div
                      key={cartItem.variationId}
                      className={cn(
                        "flex items-start gap-3",
                        !available && "opacity-50",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {cartItem.menuItem.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cartItem.variationName}
                        </p>
                        {!available && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-0.5"
                          >
                            Not available now
                          </Badge>
                        )}
                        <p
                          className={cn(
                            "text-sm font-semibold mt-0.5",
                            !available && "line-through text-muted-foreground",
                          )}
                        >
                          {formatPrice(cartItem.price)}
                        </p>
                      </div>

                      {/* Quantity controls — disabled when item is out of window */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            available &&
                            onUpdateQty(
                              cartItem.variationId,
                              cartItem.quantity - 1,
                            )
                          }
                          disabled={!available}
                          aria-label="Decrease quantity"
                          className="h-6 w-6 rounded-full border flex items-center justify-center text-sm hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="text-sm w-4 text-center tabular-nums">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() =>
                            available &&
                            onUpdateQty(
                              cartItem.variationId,
                              cartItem.quantity + 1,
                            )
                          }
                          disabled={!available}
                          aria-label="Increase quantity"
                          className="h-6 w-6 rounded-full border flex items-center justify-center text-sm hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemove(cartItem.variationId)}
                        aria-label={`Remove ${cartItem.menuItem.name}`}
                        className="text-muted-foreground hover:text-destructive transition-colors text-xs shrink-0 mt-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-3 mt-4">
                {unavailableCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unavailableCount} item{unavailableCount !== 1 ? "s" : ""}{" "}
                    currently unavailable and excluded from total.
                  </p>
                )}
                <div className="flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{subtotal ? formatPrice(subtotal) : "—"}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onClear}
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  },
);

CartDrawer.displayName = "CartDrawer";
