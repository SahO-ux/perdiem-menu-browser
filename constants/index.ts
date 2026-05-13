// Square catalog object types
export const CATALOG_OBJECT_TYPE = {
  ITEM: "ITEM",
  CATEGORY: "CATEGORY",
  MODIFIER_LIST: "MODIFIER_LIST",
  MODIFIER: "MODIFIER",
  AVAILABILITY_PERIOD: "AVAILABILITY_PERIOD",
  IMAGE: "IMAGE",
  ITEM_VARIATION: "ITEM_VARIATION",
} as const;

// Comma-separated list passed to Square's listCatalog / searchCatalogObjects
export const CATALOG_FETCH_TYPES =
  "ITEM,CATEGORY,MODIFIER_LIST,AVAILABILITY_PERIOD,IMAGE" as const;

// Square location status
export const LOCATION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// Square modifier list selection types
export const MODIFIER_SELECTION_TYPE = {
  SINGLE: "SINGLE",
  MULTIPLE: "MULTIPLE",
} as const;

// Square inventory states
export const INVENTORY_STATE = {
  IN_STOCK: "IN_STOCK",
  SOLD_OUT: "SOLD_OUT",
  WASTE: "WASTE",
} as const;

// Square day-of-week enum values
export const DAY_OF_WEEK = {
  SUN: "SUN",
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
} as const;

// Square environment identifiers (read from SQUARE_ENVIRONMENT env var)
export const SQUARE_ENVIRONMENT = {
  PRODUCTION: "production",
  SANDBOX: "sandbox",
} as const;

// Server-side cache keys
export const CACHE_KEY = {
  LOCATIONS: "locations",
  CATALOG: "catalog",
} as const;

// Server-side cache TTLs
export const CACHE_TTL_MS = {
  LOCATIONS: 5 * 60 * 1000,
  CATALOG: 5 * 60 * 1000,
} as const;

// Max items per Square API page (their documented maximum for searchCatalogObjects)
export const SQUARE_CATALOG_PAGE_LIMIT = 1000;

// Fallback timezone used when a location has no timezone set.
// Square requires merchants to configure a timezone, but the SDK types it as optional.
export const DEFAULT_TIMEZONE = "America/New_York";

// Debounce delay for the menu search input.
// Prevents useMemo from recomputing on every keystroke — search is client-side
// so there's no network cost, but 300 ms still avoids thrashing on fast typing.
export const SEARCH_DEBOUNCE_MS = 300;
