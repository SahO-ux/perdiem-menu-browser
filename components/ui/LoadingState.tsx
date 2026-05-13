"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_COUNT = 6;

export const LoadingState = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border bg-card p-0 overflow-hidden space-y-0"
      >
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
));

LoadingState.displayName = "LoadingState";
