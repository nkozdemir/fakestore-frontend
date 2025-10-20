import { describe, expect, it } from "vitest"
import { formatPrice } from "@/lib/utils.ts"

describe("formatPrice", () => {
  it("formats numbers as USD currency by default", () => {
    expect(formatPrice(12.5)).toBe("$12.50")
  })

  it("respects custom locales and currencies", () => {
    expect(formatPrice(99.99, "de-DE", "EUR")).toBe("99,99 €")
  })

  it("falls back to zero when the input is not finite", () => {
    expect(formatPrice(Number.NaN)).toBe("$0.00")
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe("$0.00")
  })
})
