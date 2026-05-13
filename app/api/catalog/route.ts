import { NextResponse } from "next/server";

import { fetchCatalog } from "@/lib/square/catalog";
import { cache } from "@/lib/cache";
import { CACHE_KEY, CACHE_TTL_MS } from "@/constants";
import type { CatalogData } from "@/types/app";

const getCatalog = async () => {
  try {
    const cached = cache.get<CatalogData>(CACHE_KEY.CATALOG);
    if (cached) return NextResponse.json(cached);

    const catalog = await fetchCatalog();
    cache.set(CACHE_KEY.CATALOG, catalog, CACHE_TTL_MS.CATALOG);
    return NextResponse.json(catalog);
  } catch (error) {
    // Log full error server-side; never forward SDK strings to the client
    console.error("[/api/catalog]", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 502 },
    );
  }
};

export { getCatalog as GET };
