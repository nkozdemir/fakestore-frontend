import { fallbackLanguage, supportedLanguages, type Language } from "@/i18n/translations.ts"

export const LANGUAGE_STORAGE_KEY = "fakestore:language"

let currentLanguage: Language | null = null

const supportedLanguageValues = new Set<Language>(supportedLanguages)

export const isSupportedLanguage = (value: unknown): value is Language =>
  typeof value === "string" && supportedLanguageValues.has(value as Language)

export function readStoredLanguage(): Language | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return stored && isSupportedLanguage(stored) ? stored : null
  } catch {
    return null
  }
}

export function detectBrowserLanguage(): Language | null {
  const navigatorLanguage =
    typeof window !== "undefined"
      ? window.navigator.language ?? window.navigator.languages?.[0]
      : typeof navigator !== "undefined"
        ? navigator.language ?? navigator.languages?.[0]
        : null

  if (!navigatorLanguage) {
    return null
  }

  const normalized = navigatorLanguage.split("-")[0]?.toLowerCase()

  return normalized && isSupportedLanguage(normalized) ? normalized : null
}

export function getActiveLanguage(): Language {
  if (currentLanguage && isSupportedLanguage(currentLanguage)) {
    return currentLanguage
  }

  const stored = readStoredLanguage()
  if (stored) {
    currentLanguage = stored
    return stored
  }

  const detected = detectBrowserLanguage()
  if (detected) {
    currentLanguage = detected
    return detected
  }

  currentLanguage = fallbackLanguage
  return fallbackLanguage
}

export function setActiveLanguage(
  language: Language,
  options: {
    persist?: boolean
  } = {},
): void {
  currentLanguage = language

  if (options.persist === false || typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    /* no-op */
  }
}
