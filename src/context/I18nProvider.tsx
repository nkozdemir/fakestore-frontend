import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  fallbackLanguage,
  languageMetadata,
  supportedLanguages,
  translationResources,
  type Language,
} from "@/i18n/translations.ts"

type TranslateOptions = {
  values?: Record<string, string | number>
  defaultValue?: string
}

type I18nContextValue = {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
  t: (key: string, options?: TranslateOptions) => string
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string
}

const STORAGE_KEY = "fakestore:language"

type TranslationNode = string | Record<string, TranslationNode>

const I18nContext = createContext<I18nContextValue | null>(null)

const isSupportedLanguage = (value: string): value is Language =>
  (supportedLanguages as string[]).includes(value)

const getStoredLanguage = (): Language | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isSupportedLanguage(stored)) {
      return stored
    }
  } catch {
    /* no-op */
  }

  return null
}

const detectBrowserLanguage = (): Language | null => {
  if (typeof window === "undefined") {
    return null
  }

  const navigatorLanguage = window.navigator.language ?? window.navigator.languages?.[0]

  if (!navigatorLanguage) {
    return null
  }

  const normalized = navigatorLanguage.split("-")[0]?.toLowerCase()

  if (normalized && isSupportedLanguage(normalized)) {
    return normalized
  }

  return null
}

const detectInitialLanguage = (): Language =>
  getStoredLanguage() ?? detectBrowserLanguage() ?? fallbackLanguage

const resolveTranslationString = (language: Language, key: string): string | null => {
  const resource = translationResources[language] as Record<string, unknown>
  const segments = key.split(".").filter(Boolean)

  let current: unknown = resource

  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return null
    }

    current = (current as Record<string, TranslationNode>)[segment]
  }

  return typeof current === "string" ? current : null
}

const interpolateTemplate = (
  template: string,
  values?: Record<string, string | number>,
): string => {
  if (!values) {
    return template
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token) => {
    if (!(token in values) || values[token] === undefined || values[token] === null) {
      return match
    }

    return String(values[token])
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage)

  const locale = languageMetadata[language]?.locale ?? "en-US"

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      /* no-op */
    }
  }, [language])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    document.documentElement.lang = locale.split("-")[0] ?? language
  }, [language, locale])

  const translate = useCallback(
    (key: string, options?: TranslateOptions): string => {
      const template =
        resolveTranslationString(language, key) ??
        resolveTranslationString(fallbackLanguage, key) ??
        options?.defaultValue ??
        key

      return interpolateTemplate(template, options?.values)
    },
    [language],
  )

  const formatCurrency = useCallback(
    (value: number, currency = "USD", options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
        ...options,
      }).format(value),
    [locale],
  )

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState((current) => (current === nextLanguage ? current : nextLanguage))
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale,
      setLanguage,
      t: translate,
      formatCurrency,
    }),
    [formatCurrency, language, locale, setLanguage, translate],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider")
  }

  return context
}
