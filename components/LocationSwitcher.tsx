"use client";

import { memo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppLocation } from "@/types/app";

interface LocationSwitcherProps {
  locations: AppLocation[];
  selectedId: string;
  onChange: (id: string) => void;
}

export const LocationSwitcher = memo(
  ({ locations, selectedId, onChange }: LocationSwitcherProps) => {
    // Base UI's Select.Value renders the raw value by default.
    // The `items` prop provides the value→label mapping so the trigger shows the name.
    const items = locations.map((loc) => ({ value: loc.id, label: loc.name }));

    return (
      <Select
        value={selectedId}
        onValueChange={(v) => v && onChange(v)}
        items={items}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

LocationSwitcher.displayName = "LocationSwitcher";
