import { API_URL } from '../../config/env'
import type { ApiOrderItemRef, ApiOrderRow } from './types'

export function toYmd(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function formatCreated(createdAtIso: string) {
  const date = new Date(createdAtIso)
  if (Number.isNaN(date.getTime())) return createdAtIso

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export function countFoodTypes(items: ApiOrderItemRef[]) {
  return new Set(items.map((item) => item.product_id)).size
}

export function getOrderTotals(order: Pick<ApiOrderRow, 'total_price' | 'discount_amount'>) {
  const total = order.total_price
  const discountAmount = Math.max(0, Number(order.discount_amount ?? 0) || 0)
  const discountedTotal = Math.max(0, Math.round(total) - Math.round(discountAmount))
  return { total, discountAmount, discountedTotal }
}

export function toOrderHistoryImageSrc(raw?: string | null) {
  if (!raw) return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'

  const trimmed = raw.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')

  const mediaMarker = '/media/'
  const mediaIndex = normalized.lastIndexOf(mediaMarker)
  if (mediaIndex !== -1) {
    return `${API_URL}${normalized.slice(mediaIndex)}`
  }

  const productsMarker = '/products/'
  const productsIndex = normalized.lastIndexOf(productsMarker)
  if (productsIndex !== -1) {
    const filename = normalized.slice(productsIndex + productsMarker.length)
    return `${API_URL}/media/products/${filename}`
  }

  const filename = normalized.split('/').filter(Boolean).at(-1)
  if (filename) return `${API_URL}/media/products/${filename}`

  return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'
}
