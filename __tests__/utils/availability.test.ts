import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isAvailableAtLocation,
  isAvailableNow,
  isLocationOpen,
} from "@/lib/utils/availability";
import type { AppMenuItem, AppAvailabilityPeriod, AppBusinessHoursPeriod } from "@/types/app";

// ── helpers ──────────────────────────────────────────────────────────────────

const makeItem = (overrides: Partial<AppMenuItem> = {}): AppMenuItem => ({
  id: "item-1",
  name: "Test Item",
  variations: [],
  modifierListIds: [],
  presentAtAllLocations: true,
  presentAtLocationIds: [],
  absentAtLocationIds: [],
  ...overrides,
});

const makePeriod = (
  day: string,
  start: string,
  end: string,
): AppAvailabilityPeriod => ({
  id: "p1",
  dayOfWeek: day,
  startLocalTime: start,
  endLocalTime: end,
});

// January 8 2024 is a Monday. 17:00 UTC = 12:00 EST (UTC-5, winter).
const MON_12PM_UTC = new Date("2024-01-08T17:00:00Z");

// ── isAvailableAtLocation ─────────────────────────────────────────────────────

describe("isAvailableAtLocation", () => {
  it("returns true when presentAtAllLocations is true", () => {
    expect(isAvailableAtLocation(makeItem(), "loc-a")).toBe(true);
  });

  it("returns false for a location in absentAtLocationIds", () => {
    const item = makeItem({ absentAtLocationIds: ["loc-b"] });
    expect(isAvailableAtLocation(item, "loc-b")).toBe(false);
  });

  it("returns true for a location NOT in absentAtLocationIds", () => {
    const item = makeItem({ absentAtLocationIds: ["loc-b"] });
    expect(isAvailableAtLocation(item, "loc-a")).toBe(true);
  });

  it("returns true only for locations in presentAtLocationIds when presentAtAllLocations is false", () => {
    const item = makeItem({
      presentAtAllLocations: false,
      presentAtLocationIds: ["loc-c"],
    });
    expect(isAvailableAtLocation(item, "loc-c")).toBe(true);
    expect(isAvailableAtLocation(item, "loc-d")).toBe(false);
  });

  it("returns false everywhere when presentAtAllLocations is false with no IDs listed", () => {
    const item = makeItem({
      presentAtAllLocations: false,
      presentAtLocationIds: [],
    });
    expect(isAvailableAtLocation(item, "loc-a")).toBe(false);
  });
});

// ── isAvailableNow ────────────────────────────────────────────────────────────

describe("isAvailableNow", () => {
  const TZ = "America/New_York";

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when there are no periods (always available)", () => {
    vi.setSystemTime(MON_12PM_UTC);
    expect(isAvailableNow([], TZ)).toBe(true);
  });

  it("returns true when current time falls within a matching period", () => {
    vi.setSystemTime(MON_12PM_UTC); // Monday 12:00 EST
    const periods = [makePeriod("MON", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(true);
  });

  it("returns true at the exact start boundary (HH:mm:ss comparison)", () => {
    vi.setSystemTime(new Date("2024-01-08T16:00:00Z")); // Monday 11:00:00 EST
    const periods = [makePeriod("MON", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(true);
  });

  it("returns true at the exact end boundary", () => {
    vi.setSystemTime(new Date("2024-01-08T19:00:00Z")); // Monday 14:00:00 EST
    const periods = [makePeriod("MON", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(true);
  });

  it("returns false when current time is before the period start", () => {
    vi.setSystemTime(new Date("2024-01-08T14:00:00Z")); // Monday 09:00 EST
    const periods = [makePeriod("MON", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(false);
  });

  it("returns false when current time is after the period end", () => {
    vi.setSystemTime(new Date("2024-01-08T22:00:00Z")); // Monday 17:00 EST
    const periods = [makePeriod("MON", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(false);
  });

  it("returns false when the day does not match any period", () => {
    vi.setSystemTime(MON_12PM_UTC); // Monday
    const periods = [makePeriod("TUE", "11:00:00", "14:00:00")];
    expect(isAvailableNow(periods, TZ)).toBe(false);
  });

  it("returns true when any one of multiple periods matches", () => {
    vi.setSystemTime(MON_12PM_UTC); // Monday 12:00 EST
    const periods = [
      makePeriod("WED", "11:00:00", "14:00:00"),
      makePeriod("MON", "10:00:00", "15:00:00"), // this one matches
    ];
    expect(isAvailableNow(periods, TZ)).toBe(true);
  });
});

// ── isLocationOpen ────────────────────────────────────────────────────────────

const makeBusinessHours = (
  day: string,
  start: string,
  end: string,
): AppBusinessHoursPeriod => ({ dayOfWeek: day, startLocalTime: start, endLocalTime: end });

describe("isLocationOpen", () => {
  const TZ = "America/New_York";

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns true when no business hours are configured (always open)", () => {
    vi.setSystemTime(MON_12PM_UTC);
    expect(isLocationOpen([], TZ)).toBe(true);
  });

  it("returns true when current time is within a matching business-hours period", () => {
    vi.setSystemTime(MON_12PM_UTC); // Monday 12:00 EST — within 09:00–17:00
    const hours = [makeBusinessHours("MON", "09:00:00", "17:00:00")];
    expect(isLocationOpen(hours, TZ)).toBe(true);
  });

  it("returns false when the location is closed for the day", () => {
    vi.setSystemTime(MON_12PM_UTC); // Monday — no Monday period
    const hours = [makeBusinessHours("TUE", "09:00:00", "17:00:00")];
    expect(isLocationOpen(hours, TZ)).toBe(false);
  });

  it("returns false when current time is after closing time", () => {
    vi.setSystemTime(new Date("2024-01-08T23:00:00Z")); // Monday 18:00 EST
    const hours = [makeBusinessHours("MON", "09:00:00", "17:00:00")];
    expect(isLocationOpen(hours, TZ)).toBe(false);
  });

  it("category window open but location closed → item unavailable", () => {
    // 17:01 EST — category period starts at 17:00 but location closes at 17:00
    vi.setSystemTime(new Date("2024-01-08T22:01:00Z")); // Monday 17:01 EST
    const hours = [makeBusinessHours("MON", "09:00:00", "17:00:00")];
    expect(isLocationOpen(hours, TZ)).toBe(false);
  });
});
