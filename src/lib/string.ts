export function truncateText(value: string, limit: number): string {
  const normalized = value.trim()

  if (normalized.length <= limit) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`
}
