import { useReducer, useMemo, useCallback } from "react";

import type { CartItem, CartAction, AppMoney } from "@/types/app";

export const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case "ADD": {
      const existing = state.find(
        (i) => i.variationId === action.item.variationId,
      );
      if (existing) {
        return state.map((i) =>
          i.variationId === action.item.variationId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...state, action.item];
    }
    case "REMOVE":
      return state.filter((i) => i.variationId !== action.variationId);
    case "UPDATE_QTY":
      return state
        .map((i) =>
          i.variationId === action.variationId
            ? { ...i, quantity: action.quantity }
            : i,
        )
        .filter((i) => i.quantity > 0);
    case "CLEAR":
      return [];
    default:
      return state;
  }
};

interface UseCartResult {
  items: CartItem[];
  itemCount: number;
  subtotal: AppMoney | null;
  addItem: (item: CartItem) => void;
  removeItem: (variationId: string) => void;
  updateQty: (variationId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = (): UseCartResult => {
  const [items, dispatch] = useReducer(cartReducer, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo<AppMoney | null>(() => {
    if (items.length === 0) return null;
    const currency = items[0]?.price.currency ?? "USD";
    const amount = items.reduce(
      (sum, i) => sum + i.price.amount * i.quantity,
      0,
    );
    return { amount, currency };
  }, [items]);

  const addItem = useCallback(
    (item: CartItem) => dispatch({ type: "ADD", item }),
    [],
  );

  const removeItem = useCallback(
    (variationId: string) => dispatch({ type: "REMOVE", variationId }),
    [],
  );

  const updateQty = useCallback(
    (variationId: string, quantity: number) =>
      dispatch({ type: "UPDATE_QTY", variationId, quantity }),
    [],
  );

  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQty,
    clearCart,
  };
};
