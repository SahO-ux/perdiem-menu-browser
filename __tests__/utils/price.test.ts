import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils/price";

describe("formatPrice", () => {
  it("formats USD cents as a dollar string", () => {
    expect(formatPrice({ amount: 1299, currency: "USD" })).toBe("$12.99");
  });

  it("formats whole-dollar amounts with two decimal places", () => {
    expect(formatPrice({ amount: 500, currency: "USD" })).toBe("$5.00");
  });

  it("formats zero correctly", () => {
    expect(formatPrice({ amount: 0, currency: "USD" })).toBe("$0.00");
  });

  it("formats AUD with the correct symbol", () => {
    // Intl formats AUD as 'A$' in en-US locale
    expect(formatPrice({ amount: 1000, currency: "AUD" })).toMatch(
      /A?\$10\.00/,
    );
  });

  it('returns "Price varies" when money is undefined', () => {
    expect(formatPrice(undefined)).toBe("Price varies");
  });
});
