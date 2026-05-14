import "server-only";
import { locationsClient } from "./client";
import { LOCATION_STATUS, DEFAULT_TIMEZONE } from "@/constants";

import type * as Square from "square";

import type { AppLocation, AppBusinessHoursPeriod } from "@/types/app";

// Square returns business-hour times as "HH:MM"; normalise to "HH:MM:SS" so
// string comparison in isLocationOpen works the same way as isAvailableNow.
const toHHMMSS = (t: string): string => (t.length === 5 ? `${t}:00` : t);

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
      businessHours: (loc.businessHours?.periods ?? [])
        .filter((p) => !!p.dayOfWeek)
        .map(
          (p): AppBusinessHoursPeriod => ({
            dayOfWeek: p.dayOfWeek!,
            startLocalTime: toHHMMSS(p.startLocalTime ?? "00:00:00"),
            endLocalTime: toHHMMSS(p.endLocalTime ?? "23:59:59"),
          }),
        ),
    }))
    .filter((loc) => loc.id !== "");
};
