import { env } from "@/config/env.ts"
import { getActiveLanguage } from "@/i18n/language-preferences.ts"

type QueryValue = string | number | boolean | null | undefined

export const API_BASE_URL = env.apiBaseUrl as string

type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    status: number
    details?: unknown
    hint?: string | null
    extra?: unknown
    headers?: Record<string, string>
  }
}

export type ApiErrorPayload = ApiErrorEnvelope["error"]

type CreateApiErrorOptions = ApiErrorPayload & {
  rawBody?: unknown
  responseStatus: number
}

function extractDetailString(details: unknown): string | null {
  if (!details) {
    return null
  }

  if (typeof details === "string") {
    const trimmed = details.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (Array.isArray(details)) {
    for (const entry of details) {
      const candidate = extractDetailString(entry)
      if (candidate) {
        return candidate
      }
    }
    return null
  }

  if (typeof details === "object") {
    for (const value of Object.values(details as Record<string, unknown>)) {
      const candidate = extractDetailString(value)
      if (candidate) {
        return candidate
      }
    }
  }

  return null
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown
  readonly hint?: string | null
  readonly extra?: unknown
  readonly headers?: Record<string, string>
  readonly rawBody?: unknown
  readonly backendMessage: string
  readonly detailMessage: string | null

  constructor(options: CreateApiErrorOptions) {
    const { message, code, status, details, hint, extra, headers, rawBody, responseStatus } =
      options

    const normalizedBackendMessage =
      typeof message === "string" && message.trim().length > 0 ? message.trim() : ""
    const normalizedHint = typeof hint === "string" && hint.trim().length > 0 ? hint.trim() : null
    const normalizedDetail = extractDetailString(details ?? null)

    const resolvedMessage =
      normalizedHint ??
      normalizedDetail ??
      normalizedBackendMessage ??
      `Request failed with status ${responseStatus}`

    super(resolvedMessage)
    this.name = "ApiError"
    this.code = code
    this.status = status
    this.details = details
    this.hint = normalizedHint
    this.extra = extra
    this.headers = headers
    this.rawBody = rawBody
    this.backendMessage =
      normalizedBackendMessage.length > 0 ? normalizedBackendMessage : resolvedMessage
    this.detailMessage = normalizedDetail
  }
}

const DEFAULT_GENERIC_ERROR_MESSAGES = ["Validation failed", "Request failed"] as const

export function formatApiErrorMessage(
  error: ApiError,
  fallback: string,
  genericMessages: string[] = [],
): string {
  const normalizedGeneric = genericMessages
    .map((message) => message.trim().toLowerCase())
    .filter((message) => message.length > 0)

  const candidates = [error.message, error.detailMessage ?? undefined, error.backendMessage].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  )

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.trim()
    if (
      normalizedCandidate.length > 0 &&
      !normalizedGeneric.includes(normalizedCandidate.toLowerCase())
    ) {
      return normalizedCandidate
    }
  }

  return fallback
}

export type FriendlyErrorOptions = {
  fallback: string
  codeMessages?: Partial<Record<string, string>>
  statusMessages?: Partial<Record<number, string>>
  genericMessages?: string[]
}

function mergeGenericMessages(extra: string[] | undefined): string[] {
  if (!extra || extra.length === 0) {
    return [...DEFAULT_GENERIC_ERROR_MESSAGES]
  }

  const normalized = extra.map((message) => message.trim()).filter((message) => message.length > 0)

  return Array.from(new Set<string>([...DEFAULT_GENERIC_ERROR_MESSAGES, ...normalized]))
}

export function resolveFriendlyErrorMessage(error: unknown, options: FriendlyErrorOptions): string {
  const { fallback, codeMessages = {}, statusMessages = {}, genericMessages } = options

  if (error instanceof ApiError) {
    const override = codeMessages[error.code] ?? statusMessages[error.status] ?? fallback

    return formatApiErrorMessage(error, override, mergeGenericMessages(genericMessages))
  }

  if (error instanceof Error) {
    const trimmed = error.message.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return fallback
}

export function toFriendlyError(error: unknown, options: FriendlyErrorOptions): Error {
  const message = resolveFriendlyErrorMessage(error, options)

  if (error instanceof Error) {
    error.message = message
    return error
  }

  return new Error(message)
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false
  }

  const envelope = (value as { error: unknown }).error
  if (!envelope || typeof envelope !== "object") {
    return false
  }

  const candidate = envelope as Record<string, unknown>
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number"
  )
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const responseStatus = response.status
  const rawText = await response.text().catch(() => "")
  let parsedBody: unknown = null

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText)
    } catch {
      parsedBody = rawText
    }
  }

  if (isApiErrorEnvelope(parsedBody)) {
    const payload = parsedBody.error
    return new ApiError({
      ...payload,
      rawBody: parsedBody,
      responseStatus,
    })
  }

  return new ApiError({
    code: `HTTP_${responseStatus}`,
    message: typeof rawText === "string" ? rawText : "",
    status: responseStatus,
    details: undefined,
    hint: null,
    extra: undefined,
    headers: undefined,
    rawBody: parsedBody ?? rawText,
    responseStatus,
  })
}

export function resolvePreferredApiLanguage(): string {
  return getActiveLanguage()
}

export function buildApiUrl(path: string, params?: Record<string, QueryValue>): string {
  const sanitizedPath = path.replace(/^\/+/, "")
  const url = new URL(sanitizedPath, API_BASE_URL)
  const preferredLanguage = resolvePreferredApiLanguage()

  if (params) {
    Object.entries(params).forEach(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null) {
        return
      }

      url.searchParams.set(key, String(rawValue))
    })
  }

  const hasLanguageParam =
    Boolean(url.searchParams.get("lang")) || Boolean(url.searchParams.get("language"))

  if (!hasLanguageParam && preferredLanguage) {
    url.searchParams.set("lang", preferredLanguage)
  }

  return url.toString()
}

export async function fetchJson<T>(
  path: string,
  options: {
    params?: Record<string, QueryValue>
    init?: RequestInit
  } = {},
): Promise<T> {
  const { params, init } = options
  const preferredLanguage = resolvePreferredApiLanguage()
  const response = await fetch(buildApiUrl(path, params), {
    headers: {
      Accept: "application/json",
      ...(preferredLanguage ? { "Accept-Language": preferredLanguage } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return response.json() as Promise<T>
}
