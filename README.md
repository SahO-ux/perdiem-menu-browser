# Per Diem Menu Browser

A multi-location menu browser built with Next.js and Square's Catalog & Locations APIs. Browse items across locations, filter by category, search, check real-time day/time availability, and manage a cart — all in a single page.

---

## Tech stack

| Layer          | Choice                             |
| -------------- | ---------------------------------- |
| Framework      | Next.js 16 (App Router)            |
| Language       | TypeScript (strict mode, no `any`) |
| Styling        | Tailwind CSS v4 + shadcn/ui        |
| Square SDK     | `square` v44                       |
| Timezone       | `date-fns-tz`                      |
| Virtualization | `react-window`                     |
| Validation     | Zod (API route inputs)             |
| Notifications  | Sonner                             |

---

## Local setup

### Prerequisites

- Node.js 18+
- A Square developer account (free) — [developer.squareup.com](https://developer.squareup.com)

### 1. Clone and install

```bash
git clone <repo-url>
cd perdiem-menu-browser
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Square **sandbox** credentials:

```
SQUARE_ACCESS_TOKEN=EAAAl...your_sandbox_token
SQUARE_ENVIRONMENT=sandbox
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Square sandbox setup

### Get your sandbox credentials

1. Sign in at [developer.squareup.com](https://developer.squareup.com).
2. Create an application (or open the default one).
3. Go to the **Sandbox** tab → copy the **Sandbox Access Token**.
4. Paste it into `.env.local` as `SQUARE_ACCESS_TOKEN`.

### Seed test data

The app needs at least one active location with catalog items. Use the **Sandbox Seller Dashboard** (linked from your app's Sandbox tab):

1. **Locations** — Go to _Account & Settings → Locations_. Setup 2 locations along with timezone and then finally set Opening hours.

2. **Items** — Go to _Items → Item Library_ and create 6–10 items across 3–4 categories (e.g. Breakfast, Lunch, Drinks, Desserts). Add images and prices. To exercise location filtering, mark at least one item as available only at a specific location.

3. **Time-of-day availability** — Square's sandbox dashboard does not expose category availability windows in the UI (this is a documented API-only feature in sandbox). Use the included seed script instead:

   ```bash
   npm run seed:availability
   ```

   Edit `scripts/seed-availability.ts` to set your `CATEGORY_NAME` and `PERIODS` (each period = one day + time window). The script creates all periods in a single batch upsert and links them to the category. After running, re-run the "npm run dev" command to bypass the 5-minute catalog in-memory server cache.

---

## Features implemented

### Core

| #   | Requirement                                                                                              | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Location switcher backed by Square Locations API                                                         | ✅     |
| 2   | Catalog items and categories from Square Catalog API                                                     | ✅     |
| 3   | Location filtering via `present_at_all_locations` / `present_at_location_ids` / `absent_at_location_ids` | ✅     |
| 4   | Category filter pills                                                                                    | ✅     |
| 5   | Item detail modal — name, description, image, price (cents → formatted currency)                         | ✅     |
| 6   | Loading, empty, and error states on every screen                                                         | ✅     |

### Bonus

| Feature                                | Notes                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time-of-day & day-of-week availability | Items outside their category's service window are visibly disabled with a "Not available now" badge (not hidden). See architecture section for the API approach.                                                                                                                                        |
| Search                                 | Debounced (300 ms) full-text filter across item name and description, runs client-side over the already-loaded catalog. Spinner shown during the debounce window.                                                                                                                                       |
| Cart                                   | Add, remove, quantity controls, and subtotal. Items that fall out of their availability window while in the cart are shown dimmed with a strikethrough price and excluded from the subtotal. Smart location switching: items available at the new location are kept; only unavailable ones are removed. |

---

## Architecture decisions

### Server-side Square proxy

All Square API calls happen inside Next.js route handlers (`/api/catalog`, `/api/locations`, `/api/inventory`). The Square access token is loaded only on the server via `process.env`, and `lib/square/client.ts` is guarded with `import 'server-only'` — Next.js will throw a build error if this module is ever imported from a client component. The token is never bundled into client JS.

### In-memory TTL cache

Each route handler holds a 5-minute in-memory TTL cache (a `Map` keyed by route). On a cold request the handler fetches from Square; subsequent requests within the TTL return instantly. Trade-off: the cache resets on every server restart and is not shared across multiple server instances. For a single-instance dev/demo setup this is appropriate; production would use Redis.

### Single-page catalog fetch

`searchCatalogObjects` supports a maximum of 1,000 objects per call. Any real restaurant menu fits comfortably within that limit, so we make one request rather than recursive cursor-following. If Square returns a cursor (catalog > 1,000 objects), the app logs a `console.warn` and continues — an acknowledged edge case documented in code, not a silent failure. Full cursor pagination is the top item in **What I'd build next**.

### Time-of-day availability — API approach

Square's scheduling APIs have evolved across SDK versions. After reading the current docs I chose `CatalogAvailabilityPeriod` objects linked to categories via `availabilityPeriodIds`. Each period carries a `dayOfWeek`, `startLocalTime`, and `endLocalTime` (interpreted in the location's IANA timezone). The check runs client-side in `useCatalog`:

1. `AVAILABILITY_PERIOD` objects are fetched alongside items and categories in the single catalog call.
2. An `id → period` map is built once per catalog load for O(1) lookups.
3. For each item, the category's period IDs are resolved, then `isAvailableNow(periods, locationTimezone)` uses `date-fns-tz` to convert `new Date()` into the location's local time before comparing against each window.

Items outside their window are **visibly disabled** (not hidden) — hiding them would confuse guests wondering where items went. The detail modal also reflects the unavailable state and prevents adding to cart. If an item was added to cart while available and later falls out of its window, the cart dims it, disables quantity controls, strikes through the price, and excludes it from the subtotal, without removing it.

The sandbox dashboard doesn't expose an availability UI, so `scripts/seed-availability.ts` automates this via the Catalog API.

### Client-side search with debounce

Search filters over the already-loaded catalog in memory. An API round-trip via `searchCatalogObjects textFilter` would add latency on every keystroke for no meaningful gain — the entire catalog is already on the client. A 300 ms `useDebounce` prevents the filter `useMemo` from recomputing on every keystroke. `isSearchPending = rawQuery !== debouncedQuery` drives the search-bar spinner.

### List virtualization

`MenuGrid` uses `react-window`'s `FixedSizeList` to render only the rows in the viewport. A `ResizeObserver` tracks container height dynamically so the list fills the remaining screen without overflow. For 10–50 items this is premature optimization, but it demonstrates the pattern for catalogs with hundreds of items and has no downside at this scale.

### Smart cart on location switch

Earlier in ine implementation, switching locations used to clear the entire cart. It now checks each item against the new location's `presentAtAllLocations` / `presentAtLocationIds` / `absentAtLocationIds` fields — already present on every `CartItem.menuItem` — and removes only items that don't exist at the new location. Items shared between locations are kept silently; the toast only fires if something was actually dropped.

### Error handling — two tiers

| Situation                                       | Treatment                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Locations or catalog fail to load               | Inline `ErrorState` with retry — user can't browse without this data    |
| Cart actions, non-critical feedback             | Sonner toast — dismissible, non-blocking                                |
| Developer/infra warnings (e.g. cursor returned) | `console.warn` only — never surfaced to users                           |
| Square SDK errors                               | Logged in full server-side; client receives only a fixed generic string |

---

## Security

**No token on the client** — `lib/square/client.ts` carries `import 'server-only'`. Next.js's build pipeline treats this as a hard error if the module is ever imported from a client component, making accidental token exposure a build failure rather than a runtime surprise.

**Secrets never committed** — `.env*` is in `.gitignore`; only `.env.example` (placeholder values, no real credentials) is tracked. The seed script uses `dotenv` to load `.env.local` explicitly at runtime rather than relying on any shell environment leakage.

**Input validation and sanitization** — The only route that accepts user input is `/api/inventory`. Zod validates the raw query string, then each individual ID is matched against `/^[A-Z0-9]{1,192}$/` (Square's object ID format) before being forwarded to the SDK. Malformed IDs are silently dropped; a 400 is returned if none remain. The count is capped at 100 (Square's batch limit). The catalog and locations routes accept no user input at all.

**No SSRF surface** — No user-supplied URLs are ever fetched. The inventory route accepts opaque ID strings passed to the Square SDK, which hard-codes the Square API hostname. There is no `fetch(userProvidedUrl)` anywhere in the codebase.

**Sanitized error responses** — Route handlers always return a fixed string to the client (e.g. `"Failed to fetch catalog"`). The full error — which may include Square SDK internals, rate-limit detail, or request IDs — is logged server-side only and never forwarded to the browser.

---

## Project structure

```
app/
  api/
    catalog/route.ts       — GET /api/catalog (cached Square proxy)
    locations/route.ts     — GET /api/locations (cached Square proxy)
    inventory/route.ts     — GET /api/inventory?variationIds=... (Zod-validated Square proxy)
  layout.tsx
  page.tsx                 — Root composition: all state, early returns for loading/error

components/
  ui/                      — LoadingState, ErrorState, EmptyState
  LocationSwitcher.tsx
  CategoryFilter.tsx
  SearchBar.tsx            — Debounced input with loading spinner
  MenuGrid.tsx             — react-window virtualized grid
  MenuItem.tsx             — Card with image skeleton and availability badge
  ItemDetailModal.tsx      — Dialog: image, description, modifiers, price, add-to-cart
  CartDrawer.tsx           — Sheet: quantity controls, availability-aware subtotal

hooks/
  useLocations.ts
  useCatalog.ts            — 4-step pipeline: location → time-window → category → search
  useCart.ts               — useReducer with memoized subtotal
  useDebounce.ts

lib/
  square/
    client.ts              — SquareClient init, server-only guard
    locations.ts
    catalog.ts             — Parses all catalog object types; handles deprecated categoryId field
    inventory.ts
  utils/
    availability.ts        — isAvailableAtLocation, isAvailableNow (date-fns-tz)
    price.ts               — Intl.NumberFormat: cents → "$12.99"
  cache.ts                 — In-memory TTL Map

scripts/
  seed-availability.ts     — Sets CatalogAvailabilityPeriods on a category via Square API
                             Run with: npm run seed:availability

types/
  app.ts                   — Normalized domain types (no BigInt, no deep optionals)
constants/
  index.ts                 — All magic strings and config values
```

---

## What I'd build next

**Full cursor pagination** — The current single-page fetch (limit 1,000) covers every reasonable restaurant menu. For a marketplace with thousands of items, implement `while (cursor) { ... }` pagination in `fetchCatalog`.

**Redis-backed cache** — The current in-memory TTL cache resets on every server restart and is not shared across multiple server instances. Replacing `lib/cache.ts` with Redis would make the cache persistent, shared, and horizontally scalable with no changes to the route handler call sites.

**Webhook-driven cache invalidation** — The 5-minute TTL is a coarse approximation. A Square `catalog.version.updated` webhook would let the server invalidate the cache immediately when the merchant changes their menu.

**API-based search** — Client-side filtering is the right call when the catalog is in memory. At scale (thousands of items, partial loads), switch to Square's `searchCatalogObjects` `textFilter` with server-side debounce and streaming results.

**Axiom based error logging** — Instead of using plain server-side logging via `console.log` or `console.error`, we should use axiom logger, so it's easier to monitor logs via axiom dashboards since it offers custom querying of logs.

**Improve UI/UX** — The current version of the web app has simple and plain design which should definitely be updated to match the current standards of real-world apps.

**Persistent cart + auth** — Move cart state to a backend session (Redis) so guests can resume across page reloads or devices. Add Square OAuth so merchants authenticate with their own account.

**Payment flow** — Wire up Square's Web Payments SDK to complete the order. The cart model (`variationId`, `quantity`, `price`) already maps directly to a Square `CreateOrder` request.

**Offline support** — Cache the last-known catalog response in `localStorage` (stale-while-revalidate) so the menu renders immediately on repeat visits even without a network connection.

**CDN for images** — Route Square's S3 image URLs through a CDN (Cloudflare Images or a Next.js custom image loader) for faster loads and reduced dependency on Square's CDN uptime. Also replace current approach of rendering images directly with optimizations like lazy-loading of images and other practices.
