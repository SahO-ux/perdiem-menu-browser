"use client";

import { memo } from "react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = memo(
  ({ message = "No items available at this location." }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  ),
);

EmptyState.displayName = "EmptyState";
