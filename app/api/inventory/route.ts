import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchInventoryCounts } from "@/lib/square/inventory";

// Square object IDs are uppercase alphanumeric; enforce format to prevent
// unexpected characters being forwarded to the Square SDK.
const SQUARE_ID_RE = /^[A-Z0-9]{1,192}$/;
const MAX_IDS = 100; // Square's BatchRetrieveInventoryCounts limit

const querySchema = z.object({
  variationIds: z
    .string()
    .min(1, "variationIds is required")
    .max(20_000, "variationIds parameter too long"),
});

const getInventory = async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    variationIds: searchParams.get("variationIds"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const ids = parsed.data.variationIds
    .split(",")
    .map((s) => s.trim())
    .filter((id) => SQUARE_ID_RE.test(id)); // drop any malformed IDs silently

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No valid variation IDs provided" },
      { status: 400 },
    );
  }

  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Too many IDs — maximum ${MAX_IDS} per request` },
      { status: 400 },
    );
  }

  try {
    const counts = await fetchInventoryCounts(ids);
    return NextResponse.json({ counts });
  } catch (error) {
    console.error("[/api/inventory]", error);
    // Return a generic message — never forward Square SDK error strings to the client
    // as they may contain internal detail (rate-limit headers, request IDs, etc.)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 502 },
    );
  }
};

export { getInventory as GET };
