import type { Item, DocumentType } from '../types/document-schema'

export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const sortA = a.Manual_Sort ?? 0
    const sortB = b.Manual_Sort ?? 0
    return sortA - sortB
  })
}

export function getDocumentTypeInThai(type: DocumentType, hasVat?: boolean): string {
  switch (type) {
    case 'Quotation':
      return 'ใบเสนอราคา'
    case 'Invoice':
      return 'ใบแจ้งหนี้'
    case 'Receipt':
      return hasVat ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน'
    default:
      return type
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function calculateSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.Total, 0)
}

/**
 * dd/mm/yyyy, Gregorian — the form PEAK prints and the redesign adopts.
 * Formatted in UTC so a date-only value never drifts a day by timezone.
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

/**
 * ② Credit term ("7 วัน", "30 days", "15") → number of days.
 * Returns null when there is no term, which collapses the whole due-date block.
 */
export function parseCreditTermDays(term: string | null | undefined): number | null {
  if (!term) return null
  const match = /(\d+)/.exec(term)
  if (!match) return null
  const days = Number(match[1])
  return Number.isFinite(days) ? days : null
}

/** ② Date + Credit_Term → the due date. Derived in the view model, never stored. */
export function getDueDate(dateString: string, term: string | null | undefined): string | null {
  const days = parseCreditTermDays(term)
  if (days === null) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

/**
 * Two-level item text: the first line is the item name, everything after it is
 * the description, which may carry markdown bullets.
 */
export function splitItemText(description: string): { name: string; detail: string } {
  const newline = description.indexOf('\n')
  if (newline === -1) return { name: description.trim(), detail: '' }
  return {
    name: description.slice(0, newline).trim(),
    detail: description.slice(newline + 1).trim(),
  }
}
