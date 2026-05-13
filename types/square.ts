// Raw shapes returned by our API routes

export interface SquareMoney {
  amount: number;
  currency: string;
}

export interface SquareAddress {
  addressLine1?: string;
  locality?: string;
  administrativeDistrictLevel1?: string;
  country?: string;
}

export interface SquareLocation {
  id: string;
  name: string;
  timezone: string;
  address?: SquareAddress;
  status: "ACTIVE" | "INACTIVE";
}

export interface SquareItemVariation {
  id: string;
  type: "ITEM_VARIATION";
  itemVariationData?: {
    name?: string;
    priceMoney?: SquareMoney;
    pricingType?: string;
  };
}

export interface SquareModifierOption {
  id: string;
  type: "MODIFIER";
  modifierData?: {
    name?: string;
    priceMoney?: SquareMoney;
  };
}

export interface SquareModifierList {
  id: string;
  type: "MODIFIER_LIST";
  modifierListData?: {
    name?: string;
    selectionType?: "SINGLE" | "MULTIPLE";
    modifiers?: SquareModifierOption[];
  };
}

export interface SquareCatalogImage {
  id: string;
  type: "IMAGE";
  imageData?: {
    url?: string;
    name?: string;
  };
}

export interface SquareCatalogItem {
  id: string;
  type: "ITEM";
  presentAtAllLocations?: boolean;
  presentAtLocationIds?: string[];
  absentAtLocationIds?: string[];
  itemData?: {
    name?: string;
    description?: string;
    categoryId?: string;
    imageIds?: string[];
    modifierListInfo?: Array<{ modifierListId: string; enabled?: boolean }>;
    variations?: SquareItemVariation[];
  };
}

export interface SquareCatalogCategory {
  id: string;
  type: "CATEGORY";
  categoryData?: {
    name?: string;
    availabilityPeriodIds?: string[];
  };
}

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface SquareAvailabilityPeriod {
  id: string;
  type: "AVAILABILITY_PERIOD";
  availabilityPeriodData?: {
    startLocalTime?: string; // "HH:MM"
    endLocalTime?: string; // "HH:MM"
    dayOfWeek?: DayOfWeek;
  };
}

export type SquareCatalogObject =
  | SquareCatalogItem
  | SquareCatalogCategory
  | SquareModifierList
  | SquareAvailabilityPeriod
  | SquareCatalogImage;
