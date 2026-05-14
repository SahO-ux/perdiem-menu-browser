export interface AppMoney {
  amount: number; // cents
  currency: string;
}

export interface AppBusinessHoursPeriod {
  dayOfWeek: string;
  startLocalTime: string; // "HH:MM:SS"
  endLocalTime: string; // "HH:MM:SS"
}

export interface AppLocation {
  id: string;
  name: string;
  timezone: string;
  address?: {
    addressLine1?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
  };
  /** Empty array means no hours configured — treat as always open */
  businessHours: AppBusinessHoursPeriod[];
}

export interface AppItemVariation {
  id: string;
  name: string;
  price?: AppMoney;
}

export interface AppModifierOption {
  id: string;
  name: string;
  price?: AppMoney;
}

export interface AppModifierList {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  modifiers: AppModifierOption[];
}

export interface AppMenuItem {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  imageUrl?: string;
  variations: AppItemVariation[];
  modifierListIds: string[];
  presentAtAllLocations: boolean;
  presentAtLocationIds: string[];
  absentAtLocationIds: string[];
}

export interface AppCategory {
  id: string;
  name: string;
  // IDs referencing AppAvailabilityPeriod — empty means always available
  availabilityPeriodIds: string[];
}

export interface AppAvailabilityPeriod {
  id: string;
  dayOfWeek: string;
  startLocalTime: string; // "HH:MM"
  endLocalTime: string; // "HH:MM"
}

export interface CatalogData {
  items: AppMenuItem[];
  categories: AppCategory[];
  availabilityPeriods: AppAvailabilityPeriod[];
  modifierLists: AppModifierList[];
}

// Cart (bonus)
export interface CartItem {
  menuItem: AppMenuItem;
  variationId: string;
  variationName: string;
  price: AppMoney;
  quantity: number;
}

export type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; variationId: string }
  | { type: "UPDATE_QTY"; variationId: string; quantity: number }
  | { type: "CLEAR" };

// API error shape returned by our routes
export interface ApiError {
  error: string;
}
