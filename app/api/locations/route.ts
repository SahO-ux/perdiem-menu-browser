import { NextResponse } from "next/server";

import { fetchLocations } from "@/lib/square/locations";
import { cache } from "@/lib/cache";
import { CACHE_KEY, CACHE_TTL_MS } from "@/constants";
import type { AppLocation } from "@/types/app";

const getLocations = async () => {
  try {
    const cached = cache.get<AppLocation[]>(CACHE_KEY.LOCATIONS);
    if (cached) return NextResponse.json({ locations: cached });

    const locations = await fetchLocations();
    cache.set(CACHE_KEY.LOCATIONS, locations, CACHE_TTL_MS.LOCATIONS);
    return NextResponse.json({ locations });
  } catch (error) {
    // Log full error server-side; never forward SDK strings to the client
    console.error("[/api/locations]", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 502 },
    );
  }
};

export { getLocations as GET };
