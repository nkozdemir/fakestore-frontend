import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  fallbackLanguage,
  languageMetadata,
  translationResources,
  type Language,
} from "@/i18n/translations.ts"
import { getActiveLanguage, setActiveLanguage } from "@/i18n/language-preferences.ts"
import {
  I18nContext,
  type I18nContextValue,
  type TranslateOptions,
} from "@/context/I18nContext.ts"

type TranslationLeaf = string

interface TranslationBranch {
  [key: string]: TranslationLeaf | TranslationBranch
}

type TranslationNode = TranslationLeaf | TranslationBranch

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
  const [language, setLanguageState] = useState<Language>(getActiveLanguage)

  const locale = languageMetadata[language]?.locale ?? "en-US"

  useEffect(() => {
    setActiveLanguage(language)
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
    setLanguageState((current) => {
      if (current === nextLanguage) {
        return current
      }

      setActiveLanguage(nextLanguage, { persist: false })
      return nextLanguage
    })
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
