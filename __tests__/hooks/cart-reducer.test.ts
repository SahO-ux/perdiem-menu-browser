import { describe, it, expect } from "vitest";
import { cartReducer } from "@/hooks/useCart";
import type { CartItem, AppMenuItem } from "@/types/app";

// ── helpers ──────────────────────────────────────────────────────────────────

const makeMenuItem = (id = "item-1"): AppMenuItem => ({
  id,
  name: "Coffee",
  variations: [],
  modifierListIds: [],
  presentAtAllLocations: true,
  presentAtLocationIds: [],
  absentAtLocationIds: [],
});

const makeCartItem = (variationId = "var-1", quantity = 1): CartItem => ({
  menuItem: makeMenuItem(),
  variationId,
  variationName: "Regular",
  price: { amount: 500, currency: "USD" },
  quantity,
});

// ── ADD ───────────────────────────────────────────────────────────────────────

describe("cartReducer — ADD", () => {
  it("adds a new item to an empty cart", () => {
    const result = cartReducer([], { type: "ADD", item: makeCartItem() });
    expect(result).toHaveLength(1);
    expect(result[0]?.variationId).toBe("var-1");
    expect(result[0]?.quantity).toBe(1);
  });

  it("increments quantity when the same variation is added again", () => {
    const state = [makeCartItem("var-1", 2)];
    const result = cartReducer(state, {
      type: "ADD",
      item: makeCartItem("var-1"),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });

  it("adds a new entry for a different variation", () => {
    const state = [makeCartItem("var-1")];
    const result = cartReducer(state, {
      type: "ADD",
      item: makeCartItem("var-2"),
    });
    expect(result).toHaveLength(2);
  });
});

// ── REMOVE ────────────────────────────────────────────────────────────────────

describe("cartReducer — REMOVE", () => {
  it("removes the item with the matching variationId", () => {
    const state = [makeCartItem("var-1"), makeCartItem("var-2")];
    const result = cartReducer(state, { type: "REMOVE", variationId: "var-1" });
    expect(result).toHaveLength(1);
    expect(result[0]?.variationId).toBe("var-2");
  });

  it("is a no-op when the variationId does not exist", () => {
    const state = [makeCartItem("var-1")];
    const result = cartReducer(state, {
      type: "REMOVE",
      variationId: "var-999",
    });
    expect(result).toHaveLength(1);
  });
});

// ── UPDATE_QTY ────────────────────────────────────────────────────────────────

describe("cartReducer — UPDATE_QTY", () => {
  it("updates quantity for the matching item", () => {
    const state = [makeCartItem("var-1", 1)];
    const result = cartReducer(state, {
      type: "UPDATE_QTY",
      variationId: "var-1",
      quantity: 5,
    });
    expect(result[0]?.quantity).toBe(5);
  });

  it("removes the item when quantity is set to 0", () => {
    const state = [makeCartItem("var-1", 2)];
    const result = cartReducer(state, {
      type: "UPDATE_QTY",
      variationId: "var-1",
      quantity: 0,
    });
    expect(result).toHaveLength(0);
  });

  it("does not affect other items", () => {
    const state = [makeCartItem("var-1", 3), makeCartItem("var-2", 1)];
    const result = cartReducer(state, {
      type: "UPDATE_QTY",
      variationId: "var-1",
      quantity: 10,
    });
    expect(result.find((i) => i.variationId === "var-2")?.quantity).toBe(1);
  });
});

// ── CLEAR ─────────────────────────────────────────────────────────────────────

describe("cartReducer — CLEAR", () => {
  it("empties the cart", () => {
    const state = [makeCartItem("var-1"), makeCartItem("var-2")];
    expect(cartReducer(state, { type: "CLEAR" })).toHaveLength(0);
  });

  it("is safe on an already-empty cart", () => {
    expect(cartReducer([], { type: "CLEAR" })).toHaveLength(0);
  });
});
