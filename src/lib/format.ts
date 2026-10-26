export function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}
