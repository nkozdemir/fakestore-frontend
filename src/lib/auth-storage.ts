import type { AuthTokens } from "@/types/auth.ts"

const STORAGE_KEY = "fakestore.authTokens"

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function readStoredTokens(): AuthTokens | null {
  if (!isBrowser()) {
    return null
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as AuthTokens
    if (parsed && typeof parsed.access === "string" && typeof parsed.refresh === "string") {
      return parsed
    }
  } catch {
    // Ignore malformed values and clear them out
  }

  window.localStorage.removeItem(STORAGE_KEY)
  return null
}

export function storeTokens(tokens: AuthTokens): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearStoredTokens(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
