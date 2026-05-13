import "server-only";
import { inventoryClient } from "./client";
import { INVENTORY_STATE } from "@/constants";

import type * as Square from "square";

export interface InventoryCount {
  variationId: string;
  quantity: number;
  state: string;
}

export const fetchInventoryCounts = async (
  variationIds: string[],
): Promise<InventoryCount[]> => {
  const page = await inventoryClient.batchGetCounts({
    catalogObjectIds: variationIds,
  });

  return page.data.map((count: Square.InventoryCount) => ({
    variationId: count.catalogObjectId ?? "",
    quantity: parseFloat(count.quantity ?? "0"),
    state: count.state ?? INVENTORY_STATE.IN_STOCK,
  }));
};
