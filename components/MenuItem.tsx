"use client";

import { memo, useCallback, useState, useEffect } from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/price";
import type { AppMenuItem } from "@/types/app";

interface MenuItemProps {
  item: AppMenuItem;
  availableNow: boolean;
  onClick: (item: AppMenuItem, availableNow: boolean) => void;
}

export const MenuItem = memo(
  ({ item, availableNow, onClick }: MenuItemProps) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    // Reset when the virtual list reuses this slot for a different item
    useEffect(() => {
      setImgLoaded(false);
    }, [item.imageUrl]);

    const handleClick = useCallback(
      () => onClick(item, availableNow),
      [item, availableNow, onClick],
    );

    const firstVariation = item.variations[0];

    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !availableNow && "opacity-60",
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "relative h-40 bg-muted",
            item.imageUrl && !imgLoaded && "animate-pulse",
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              loading="eager"
              onLoad={() => setImgLoaded(true)}
              className={cn(
                "object-cover transition-opacity duration-300",
                imgLoaded ? "opacity-100" : "opacity-0",
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
          {!availableNow && (
            <div className="absolute inset-0 flex items-end justify-start p-2 bg-gradient-to-t from-background/60 to-transparent">
              <Badge variant="secondary" className="text-xs">
                Not available now
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1">
          <p className="font-medium text-sm leading-snug line-clamp-1">
            {item.name}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-sm font-semibold pt-0.5">
            {firstVariation?.price
              ? formatPrice(firstVariation.price)
              : item.variations.length > 1
                ? "Multiple prices"
                : "Price varies"}
          </p>
        </div>
      </button>
    );
  },
);

MenuItem.displayName = "MenuItem";
