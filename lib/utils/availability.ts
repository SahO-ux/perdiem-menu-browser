import { toZonedTime, format } from 'date-fns-tz';
import { DAY_OF_WEEK } from '@/constants';
import type { AppMenuItem, AppAvailabilityPeriod } from '@/types/app';
import type { DayOfWeek } from '@/types/square';

export const isAvailableAtLocation = (item: AppMenuItem, locationId: string): boolean => {
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

// Returns true if the current moment falls within any of the availability periods
// for the given IANA timezone. No periods = always available.
export const isAvailableNow = (
  periods: AppAvailabilityPeriod[],
  timezone: string
): boolean => {
  if (periods.length === 0) return true;

  // Convert current UTC time to a local Date object in the location's timezone
  const localDate = toZonedTime(new Date(), timezone);
  const currentDay = DAY_INDEX_TO_SQUARE[localDate.getDay()]!;
  const currentTime = format(localDate, 'HH:mm', { timeZone: timezone });

  return periods.some(
    (p) =>
      p.dayOfWeek === currentDay &&
      currentTime >= p.startLocalTime &&
      currentTime <= p.endLocalTime
  );
};
