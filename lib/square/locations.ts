import "server-only";
import { locationsClient } from "./client";
import { LOCATION_STATUS, DEFAULT_TIMEZONE } from "@/constants";

import type * as Square from "square";

import type { AppLocation } from "@/types/app";

export const fetchLocations = async (): Promise<AppLocation[]> => {
  const response = await locationsClient.list();

  return (response.locations ?? [])
    .filter((loc: Square.Location) => loc.status === LOCATION_STATUS.ACTIVE)
    .map((loc: Square.Location) => ({
      id: loc.id ?? "",
      name: loc.name ?? "Unnamed Location",
      timezone: loc.timezone ?? DEFAULT_TIMEZONE,
      address: loc.address
        ? {
            addressLine1: loc.address.addressLine1 ?? undefined,
            locality: loc.address.locality ?? undefined,
            administrativeDistrictLevel1:
              loc.address.administrativeDistrictLevel1 ?? undefined,
          }
        : undefined,
    }))
    .filter((loc) => loc.id !== "");
};
