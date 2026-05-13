"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState = memo(({ message, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
    <p className="text-sm text-destructive max-w-sm">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try again
    </Button>
  </div>
));

ErrorState.displayName = "ErrorState";
