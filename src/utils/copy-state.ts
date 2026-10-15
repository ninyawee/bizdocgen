/**
 * ④ ต้นฉบับ / สำเนา — presentation state only. There is no data behind it and
 * no Grist column: it is a print-time toggle driven by a URL param.
 *
 *   ?copy       → สำเนา
 *   ?copy=1     → สำเนา
 *   (absent)    → ต้นฉบับ
 */
export const ORIGINAL = 'ต้นฉบับ'
export const DUPLICATE = 'สำเนา'

const TRUTHY = new Set(['', '1', 'true', 'yes', 'copy', DUPLICATE])

export function getCopyLabel(search: string = typeof location === 'undefined' ? '' : location.search): string {
  const value = new URLSearchParams(search).get('copy')
  if (value === null) return ORIGINAL
  return TRUTHY.has(value.toLowerCase()) ? DUPLICATE : ORIGINAL
}

export function isDuplicate(search?: string): boolean {
  return getCopyLabel(search) === DUPLICATE
}
