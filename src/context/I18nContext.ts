import { createContext } from "react"
import type { Language } from "@/i18n/translations.ts"

export type TranslateOptions = {
  values?: Record<string, string | number>
  defaultValue?: string
}

export type I18nContextValue = {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
  t: (key: string, options?: TranslateOptions) => string
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
