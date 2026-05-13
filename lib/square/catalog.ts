import "server-only";
import { catalogClient } from "./client";
import {
  CATALOG_OBJECT_TYPE,
  MODIFIER_SELECTION_TYPE,
  SQUARE_CATALOG_PAGE_LIMIT,
} from "@/constants";

import type * as Square from "square";

import type {
  AppMenuItem,
  AppCategory,
  AppAvailabilityPeriod,
  AppModifierList,
  AppModifierOption,
  AppItemVariation,
  CatalogData,
} from "@/types/app";

// BigInt → number so the response is JSON-serializable
const toNumber = (value: bigint | null | undefined): number =>
  value != null ? Number(value) : 0;

const parseVariation = (
  v: Square.CatalogObject.ItemVariation,
): AppItemVariation => ({
  id: v.id ?? "",
  name: v.itemVariationData?.name ?? "Default",
  price: v.itemVariationData?.priceMoney
    ? {
        amount: toNumber(v.itemVariationData.priceMoney.amount),
        currency: v.itemVariationData.priceMoney.currency ?? "USD",
      }
    : undefined,
});

const parseModifierOption = (
  m: Square.CatalogObject.Modifier,
): AppModifierOption => ({
  id: m.id ?? "",
  name: m.modifierData?.name ?? "",
  price: m.modifierData?.priceMoney
    ? {
        amount: toNumber(m.modifierData.priceMoney.amount),
        currency: m.modifierData.priceMoney.currency ?? "USD",
      }
    : undefined,
});

export const fetchCatalog = async (): Promise<CatalogData> => {
  const response = await catalogClient.search({
    objectTypes: [
      CATALOG_OBJECT_TYPE.ITEM,
      CATALOG_OBJECT_TYPE.CATEGORY,
      CATALOG_OBJECT_TYPE.MODIFIER_LIST,
      CATALOG_OBJECT_TYPE.AVAILABILITY_PERIOD,
      CATALOG_OBJECT_TYPE.IMAGE,
    ],
    // 1000 is Square's per-page maximum. Any real restaurant menu fits here comfortably;
    // a production-scale catalog with >1000 objects would need full cursor pagination.
    limit: SQUARE_CATALOG_PAGE_LIMIT,
    includeDeletedObjects: false,
  });

  if (response.cursor) {
    console.warn(
      "[catalog] Square returned a cursor — catalog exceeds 1000 objects. " +
        "Full pagination is not implemented in this scope.",
    );
  }

  const objects = response.objects ?? [];

  // Index images by ID so items can resolve their URL in O(1)
  const imageUrlById = new Map<string, string>();
  for (const obj of objects) {
    if (
      obj.type === CATALOG_OBJECT_TYPE.IMAGE &&
      obj.id &&
      obj.imageData?.url
    ) {
      imageUrlById.set(obj.id, obj.imageData.url);
    }
  }

  const items: AppMenuItem[] = [];
  const categories: AppCategory[] = [];
  const availabilityPeriods: AppAvailabilityPeriod[] = [];
  const modifierLists: AppModifierList[] = [];

  for (const obj of objects) {
    switch (obj.type) {
      case CATALOG_OBJECT_TYPE.ITEM: {
        const d = obj.itemData;
        const firstImageId = d?.imageIds?.[0];
        items.push({
          id: obj.id ?? "",
          name: d?.name ?? "Unnamed Item",
          description: d?.descriptionPlaintext ?? d?.description ?? undefined,
          // categoryId was deprecated Dec 2023; new items use the `categories` array instead
          categoryId: d?.categoryId ?? d?.categories?.[0]?.id ?? undefined,
          imageUrl: firstImageId ? imageUrlById.get(firstImageId) : undefined,
          variations: (d?.variations ?? [])
            .filter(
              (v): v is Square.CatalogObject.ItemVariation =>
                v.type === CATALOG_OBJECT_TYPE.ITEM_VARIATION,
            )
            .map(parseVariation),
          modifierListIds: (d?.modifierListInfo ?? [])
            .filter((m) => m.enabled !== false)
            .map((m) => m.modifierListId ?? "")
            .filter(Boolean),
          presentAtAllLocations: obj.presentAtAllLocations ?? true,
          presentAtLocationIds: obj.presentAtLocationIds ?? [],
          absentAtLocationIds: obj.absentAtLocationIds ?? [],
        });
        break;
      }
      case CATALOG_OBJECT_TYPE.CATEGORY: {
        const d = obj.categoryData;
        categories.push({
          id: obj.id ?? "",
          name: d?.name ?? "Uncategorized",
          availabilityPeriodIds: d?.availabilityPeriodIds ?? [],
        });
        break;
      }
      case CATALOG_OBJECT_TYPE.AVAILABILITY_PERIOD: {
        const d = obj.availabilityPeriodData;
        if (d?.dayOfWeek && d.startLocalTime && d.endLocalTime) {
          availabilityPeriods.push({
            id: obj.id ?? "",
            dayOfWeek: d.dayOfWeek,
            startLocalTime: d.startLocalTime,
            endLocalTime: d.endLocalTime,
          });
        }
        break;
      }
      case CATALOG_OBJECT_TYPE.MODIFIER_LIST: {
        const d = obj.modifierListData;
        modifierLists.push({
          id: obj.id ?? "",
          name: d?.name ?? "",
          selectionType:
            d?.selectionType === MODIFIER_SELECTION_TYPE.MULTIPLE
              ? MODIFIER_SELECTION_TYPE.MULTIPLE
              : MODIFIER_SELECTION_TYPE.SINGLE,
          modifiers: (d?.modifiers ?? [])
            .filter(
              (m): m is Square.CatalogObject.Modifier =>
                m.type === CATALOG_OBJECT_TYPE.MODIFIER,
            )
            .map(parseModifierOption),
        });
        break;
      }
    }
  }

  return { items, categories, availabilityPeriods, modifierLists };
};
