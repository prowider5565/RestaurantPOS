export function formatMoney(value: number | null | undefined): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return "0 so'm"
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(numeric))} so'm`
}
