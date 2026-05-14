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
              <div className="flex-1 overflow-y-auto divide-y mt-2 -mx-6 px-6">
                {items.map((cartItem) => {
                  const available =
                    itemAvailability.get(cartItem.menuItem.id) !== false;
                  const lineTotal = {
                    amount: cartItem.price.amount * cartItem.quantity,
                    currency: cartItem.price.currency,
                  };
                  return (
                    <div
                      key={cartItem.variationId}
                      className={cn("py-4 space-y-2", !available && "opacity-50")}
                    >
                      {/* Name + remove */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {cartItem.menuItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cartItem.variationName}
                          </p>
                          {!available && (
                            <Badge variant="secondary" className="text-[10px] mt-1">
                              Not available now
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(cartItem.variationId)}
                          aria-label={`Remove ${cartItem.menuItem.name}`}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5 text-xs leading-none"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Line total + quantity controls */}
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            !available && "line-through text-muted-foreground",
                          )}
                        >
                          {formatPrice(lineTotal)}
                        </p>
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
                          <span className="text-sm w-5 text-center tabular-nums">
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
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-3">
                {unavailableCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unavailableCount} item{unavailableCount !== 1 ? "s" : ""}{" "}
                    unavailable — excluded from total.
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
