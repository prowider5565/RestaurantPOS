import type { CashDeskSummary } from './types'

export function formatTransactionDate(createdAtIso: string) {
  const date = new Date(createdAtIso)
  if (Number.isNaN(date.getTime())) return createdAtIso

  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatInteger(value: number | string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return new Intl.NumberFormat('uz-UZ').format(Math.round(numeric))
}

export function getSafeSummary(summary: CashDeskSummary | null): CashDeskSummary {
  return (
    summary ?? {
      current_amount: 0,
      total_order_income: 0,
      total_misc_income: 0,
      total_expense: 0,
    }
  )
}
