"use client";

import { memo, useCallback, type ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SearchBar = memo(
  ({ value, onChange, loading = false, disabled = false }: SearchBarProps) => {
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      [onChange],
    );

    return (
      <div className="relative w-full sm:w-64">
        {loading ? (
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
        )}
        <input
          type="search"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Search menu..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        />
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
