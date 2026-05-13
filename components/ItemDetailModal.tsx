"use client";

import { memo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/price";
import { MODIFIER_SELECTION_TYPE } from "@/constants";
import type { AppMenuItem, AppModifierList, CartItem } from "@/types/app";

interface ItemDetailModalProps {
  item: AppMenuItem | null;
  availableNow: boolean;
  modifierLists: AppModifierList[];
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ItemDetailModal = memo(
  ({
    item,
    availableNow,
    modifierLists,
    onClose,
    onAddToCart,
  }: ItemDetailModalProps) => {
    const [selectedVariationId, setSelectedVariationId] = useState<
      string | null
    >(null);

    // Reset variation selection whenever a different item is opened
    useEffect(() => {
      setSelectedVariationId(null);
    }, [item?.id]);

    const effectiveVariationId =
      selectedVariationId ?? item?.variations[0]?.id ?? null;
    const selectedVariation = item?.variations.find(
      (v) => v.id === effectiveVariationId,
    );

    const itemModifierLists = modifierLists.filter((ml) =>
      item?.modifierListIds.includes(ml.id),
    );

    const handleAddToCart = useCallback(() => {
      if (!item || !selectedVariation?.price) return;

      onAddToCart({
        menuItem: item,
        variationId: selectedVariation.id,
        variationName: selectedVariation.name,
        price: selectedVariation.price,
        quantity: 1,
      });

      toast.success(`${item.name} added to cart`);
      onClose();
    }, [item, selectedVariation, onAddToCart, onClose]);

    return (
      <Dialog open={!!item} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {item && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 leading-snug">
                  {item.name}
                </DialogTitle>
              </DialogHeader>

              {item.imageUrl && (
                <div className="relative h-56 w-full rounded-lg overflow-hidden bg-muted -mx-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    unoptimized
                    loading="eager"
                    className="object-cover transition-opacity duration-300"
                    sizes="(max-width: 640px) 100vw, 512px"
                  />
                </div>
              )}

              {!availableNow && (
                <Badge variant="secondary" className="w-fit">
                  Not available right now
                </Badge>
              )}

              {item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}

              {/* Variation selector — only shown when there are multiple sizes/options */}
              {item.variations.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Choose size</p>
                  <div className="flex flex-wrap gap-2">
                    {item.variations.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariationId(v.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          effectiveVariationId === v.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-muted",
                        )}
                      >
                        {v.name}
                        {v.price && ` · ${formatPrice(v.price)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-lg font-semibold">
                {selectedVariation?.price
                  ? formatPrice(selectedVariation.price)
                  : "Price varies"}
              </p>

              {/* Modifier lists */}
              {itemModifierLists.map((ml) => (
                <div key={ml.id} className="space-y-1.5">
                  <p className="text-sm font-medium">
                    {ml.name}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {ml.selectionType === MODIFIER_SELECTION_TYPE.MULTIPLE
                        ? "(choose any)"
                        : "(choose one)"}
                    </span>
                  </p>
                  <div className="space-y-1 pl-1">
                    {ml.modifiers.map((mod) => (
                      <div
                        key={mod.id}
                        className="flex justify-between text-sm text-muted-foreground"
                      >
                        <span>{mod.name}</span>
                        {mod.price && <span>+{formatPrice(mod.price)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                onClick={handleAddToCart}
                disabled={!availableNow || !selectedVariation?.price}
                className="w-full mt-2"
              >
                {availableNow ? "Add to Cart" : "Not Available Right Now"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

ItemDetailModal.displayName = "ItemDetailModal";
