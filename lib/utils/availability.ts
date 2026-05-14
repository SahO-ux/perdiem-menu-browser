import { toZonedTime, format } from "date-fns-tz";

import { DAY_OF_WEEK } from "@/constants";
import type {
  AppMenuItem,
  AppAvailabilityPeriod,
  AppBusinessHoursPeriod,
} from "@/types/app";
import type { DayOfWeek } from "@/types/square";

export const isAvailableAtLocation = (
  item: AppMenuItem,
  locationId: string,
): boolean => {
  if (item.presentAtAllLocations) {
    return !item.absentAtLocationIds.includes(locationId);
  }
  return item.presentAtLocationIds.includes(locationId);
};

// Ordered to match date-fns getDay() output (0 = Sunday)
const DAY_INDEX_TO_SQUARE: DayOfWeek[] = [
  DAY_OF_WEEK.SUN,
  DAY_OF_WEEK.MON,
  DAY_OF_WEEK.TUE,
  DAY_OF_WEEK.WED,
  DAY_OF_WEEK.THU,
  DAY_OF_WEEK.FRI,
  DAY_OF_WEEK.SAT,
];

// Shared time-window check used by both catalog periods and location business hours.
// Both types carry dayOfWeek / startLocalTime / endLocalTime in HH:MM:SS format.
// No periods = no restriction → returns true.
function isCurrentTimeInPeriods(
  periods: { dayOfWeek: string; startLocalTime: string; endLocalTime: string }[],
  timezone: string,
): boolean {
  if (periods.length === 0) return true;

  const localDate = toZonedTime(new Date(), timezone);
  const currentDay = DAY_INDEX_TO_SQUARE[localDate.getDay()]!;
  // Use HH:mm:ss so string comparison works correctly against Square's HH:MM:SS period times.
  // HH:mm would be a prefix of HH:MM:SS, making '17:00' >= '17:00:00' evaluate to false.
  const currentTime = format(localDate, "HH:mm:ss", { timeZone: timezone });

  return periods.some(
    (p) =>
      p.dayOfWeek === currentDay &&
      currentTime >= p.startLocalTime &&
      currentTime <= p.endLocalTime,
  );
}

// Returns true if the current moment falls within any of the category's
// availability periods. No periods = always available.
export const isAvailableNow = (
  periods: AppAvailabilityPeriod[],
  timezone: string,
): boolean => isCurrentTimeInPeriods(periods, timezone);

// Returns true if the location is currently within its configured business hours.
// No hours configured = treat as always open.
export const isLocationOpen = (
  businessHours: AppBusinessHoursPeriod[],
  timezone: string,
): boolean => isCurrentTimeInPeriods(businessHours, timezone);
