import "server-only";
import { SquareClient, SquareEnvironment } from "square";

import { SQUARE_ENVIRONMENT } from "@/constants";

if (!process.env.SQUARE_ACCESS_TOKEN) {
  throw new Error("SQUARE_ACCESS_TOKEN is not set. Add it to .env.local.");
}

const environment =
  process.env.SQUARE_ENVIRONMENT === SQUARE_ENVIRONMENT.PRODUCTION
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

export const locationsClient = client.locations;
export const catalogClient = client.catalog;
export const inventoryClient = client.inventory;
