/**
 * Extrai o nome do arquivo do header Content-Disposition (RFC 5987 / filename*).
 */
export function filenameFromContentDisposition(
  header: string | null | undefined
): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header)
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return match[1].trim()
  }
}
