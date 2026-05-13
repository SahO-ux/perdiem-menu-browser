/**
 * One-time script: creates CatalogAvailabilityPeriods and links them to a category.
 *
 * Usage:
 *   npm run seed:availability
 *
 * Requirements:
 *   - .env.local must have SQUARE_ACCESS_TOKEN and SQUARE_ENVIRONMENT
 *   - Edit CATEGORY_NAME and PERIODS below to match your setup
 */

import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment } from "square";
import type * as Square from "square";

// Load .env.local before reading any env vars
dotenv.config({ path: ".env.local" });

type DayOfWeek = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

interface Period {
  day: DayOfWeek;
  start: string; // HH:MM
  end: string; // HH:MM
}

// ─── Config — edit these ──────────────────────────────────────────────────────
const CATEGORY_NAME = "Dessert"; // exact name as it appears in Square dashboard

// Each entry = one availability window (one Square CatalogAvailabilityPeriod).
// Times are in the location's LOCAL timezone (as set in your Square dashboard).
// Days: SUN MON TUE WED THU FRI SAT
//
// ── Testing workflow ──────────────────────────────────────────────────────────
// STEP 1 — See Dessert as NOT AVAILABLE (cart shows disabled state):
//   Keep PERIODS as-is (WED/FRI/SAT/SUN windows — currently outside those days
//   in Australia/Eucla timezone). Run the script, then hard-refresh (Ctrl+Shift+R).
//
// STEP 2 — See Dessert as AVAILABLE:
//   Add a period for the current day/time in your location's timezone, e.g.:
//     { day: 'THU', start: '00:00', end: '04:00' }
//   Re-run the script, then hard-refresh.
// ─────────────────────────────────────────────────────────────────────────────
const PERIODS: Period[] = [
  { day: "WED", start: "17:00", end: "23:59" },
  { day: "FRI", start: "17:00", end: "23:59" },
  { day: "SAT", start: "10:00", end: "23:59" },
  { day: "SUN", start: "10:00", end: "22:00" },
];
// ─────────────────────────────────────────────────────────────────────────────

// Square requires HH:MM:SS — append seconds if not already present
const toHHMMSS = (t: string): string => (t.length === 5 ? `${t}:00` : t);

async function main(): Promise<void> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const environmentStr = process.env.SQUARE_ENVIRONMENT;

  if (!token) {
    console.error("SQUARE_ACCESS_TOKEN not found in .env.local");
    process.exit(1);
  }

  const environment =
    environmentStr === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  const client = new SquareClient({ token, environment });

  // 1. Fetch all categories to find the target by name
  console.log(`Looking for category: "${CATEGORY_NAME}"...`);
  const catalogResponse = await client.catalog.search({
    objectTypes: ["CATEGORY"],
    limit: 200,
  });

  const category = (catalogResponse.objects ?? []).find(
    (obj): obj is Square.CatalogObject.Category =>
      obj.type === "CATEGORY" && obj.categoryData?.name === CATEGORY_NAME,
  );

  if (!category) {
    console.error(
      `Category "${CATEGORY_NAME}" not found. Available categories:`,
    );
    (catalogResponse.objects ?? []).forEach((obj) => {
      if (obj.type === "CATEGORY") {
        const cat = obj as Square.CatalogObject.Category;
        console.log(" -", cat.categoryData?.name, `(id: ${cat.id})`);
      }
    });
    process.exit(1);
  }

  console.log(`Found: "${CATEGORY_NAME}" (id: ${category.id})`);

  // 2. Upsert one CatalogAvailabilityPeriod per entry + the updated category
  const periodObjects = PERIODS.map((p, i) => ({
    type: "AVAILABILITY_PERIOD" as const,
    id: `#new-period-${i}`,
    availabilityPeriodData: {
      dayOfWeek: p.day,
      startLocalTime: toHHMMSS(p.start),
      endLocalTime: toHHMMSS(p.end),
    },
  }));

  const tempIds = periodObjects.map((o) => o.id);

  const batchResponse = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [
      {
        objects: [
          ...periodObjects,
          {
            type: "CATEGORY" as const,
            id: category.id,
            version: category.version,
            categoryData: {
              name: category.categoryData?.name ?? CATEGORY_NAME,
              availabilityPeriodIds: tempIds,
            },
          },
        ],
      },
    ],
  });

  const idMap = batchResponse.idMappings ?? [];

  console.log("\nDone!");
  console.log(`  Category : ${CATEGORY_NAME}`);
  console.log("  Periods  :");
  PERIODS.forEach((p, i) => {
    const tempId = `#new-period-${i}`;
    const realId =
      idMap.find((m) => m.clientObjectId === tempId)?.objectId ?? "?";
    console.log(`    [${i}] ${p.day} ${p.start}–${p.end}  →  id: ${realId}`);
  });
  console.log(
    "\nHard-refresh the browser (Ctrl+Shift+R) to bust the catalog cache.",
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
