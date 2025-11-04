const REQUIRED_ENV_KEYS = ["VITE_API_BASE_URL"] as const

type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number]

function readEnv(key: RequiredEnvKey): string {
  const rawValue = import.meta.env[key]

  if (!rawValue || rawValue.trim().length === 0) {
    throw new Error(`${key} is not defined. Check your environment configuration.`)
  }

  return rawValue
}

function normalizeUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`
}

export const env = {
  apiBaseUrl: normalizeUrl(readEnv("VITE_API_BASE_URL")),
} as const

export type AppEnv = typeof env
