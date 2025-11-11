type JwtPayload = {
  exp?: number
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const paddingNeeded = normalized.length % 4
  const padded = paddingNeeded === 0 ? normalized : `${normalized}${"=".repeat(4 - paddingNeeded)}`

  return atob(padded)
}

export function getJwtExpiry(token: string): number | null {
  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const decoded = decodeBase64Url(payload)
    const parsed = JSON.parse(decoded) as JwtPayload

    if (parsed && typeof parsed.exp === "number") {
      return parsed.exp * 1000
    }
  } catch (error) {
    console.warn("Failed to parse JWT payload", error)
  }

  return null
}
