type QueryValue = string | number | boolean | null | undefined

export const API_BASE_URL = (() => {
  const value = import.meta.env.VITE_API_BASE_URL

  if (!value) {
    throw new Error("VITE_API_BASE_URL is not defined")
  }

  return value.endsWith("/") ? value : `${value}/`
})()

export function buildApiUrl(
  path: string,
  params?: Record<string, QueryValue>,
): string {
  const sanitizedPath = path.replace(/^\/+/, "")
  const url = new URL(sanitizedPath, API_BASE_URL)

  if (params) {
    Object.entries(params).forEach(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null) {
        return
      }

      url.searchParams.set(key, String(rawValue))
    })
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
  const response = await fetch(buildApiUrl(path, params), {
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(
      `Request failed with status ${response.status}${
        errorText ? `: ${errorText}` : ""
      }`,
    )
  }

  return response.json() as Promise<T>
}
