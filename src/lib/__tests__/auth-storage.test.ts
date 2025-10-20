import { describe, expect, it, beforeEach } from "vitest"
import {
  clearStoredTokens,
  readStoredTokens,
  storeTokens,
} from "@/lib/auth-storage.ts"
import type { AuthTokens } from "@/types/auth.ts"

const STORAGE_KEY = "fakestore.authTokens"

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("stores tokens and reads them back", () => {
    const tokens: AuthTokens = {
      access: "access-token",
      refresh: "refresh-token",
    }

    storeTokens(tokens)

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify(tokens),
    )
    expect(readStoredTokens()).toEqual(tokens)
  })

  it("clears malformed data and returns null", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-valid-json")

    expect(readStoredTokens()).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("removes stored tokens", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }))

    clearStoredTokens()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
