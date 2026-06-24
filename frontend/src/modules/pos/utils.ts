import { API_URL } from '../../config/env'
import { DEFAULT_PRODUCT_IMAGE_SRC } from '../../shared/utils/images'
import type { ApiCategory, ApiProduct } from './types'

export const DEFAULT_CATEGORY_IMAGE_SRC = '/category-default.svg'
export { DEFAULT_PRODUCT_IMAGE_SRC }

export function formatIntegerForInput(digits: string) {
  if (!digits) return ''
  try {
    return new Intl.NumberFormat('uz-UZ').format(BigInt(digits))
  } catch {
    const n = Number(digits)
    if (!Number.isFinite(n)) return digits
    return new Intl.NumberFormat('uz-UZ').format(n)
  }
}

export function toImageSrc(apiProduct: ApiProduct) {
  const raw = apiProduct.image_path
  if (!raw) return DEFAULT_PRODUCT_IMAGE_SRC

  const trimmed = raw.trim()
  if (!trimmed) return DEFAULT_PRODUCT_IMAGE_SRC
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')

  const mediaMarker = '/media/'
  const mediaIdx = normalized.lastIndexOf(mediaMarker)
  if (mediaIdx !== -1) {
    const tail = normalized.slice(mediaIdx)
    return `${API_URL}${tail}`
  }

  const productsMarker = '/products/'
  const productsIdx = normalized.lastIndexOf(productsMarker)
  if (productsIdx !== -1) {
    const filename = normalized.slice(productsIdx + productsMarker.length)
    return `${API_URL}/media/products/${filename}`
  }

  const filename = normalized.split('/').filter(Boolean).at(-1)
  if (filename) return `${API_URL}/media/products/${filename}`

  return DEFAULT_PRODUCT_IMAGE_SRC
}

export function toCategoryImageSrc(apiCategory: ApiCategory) {
  const raw = apiCategory.image_path
  if (!raw) return DEFAULT_CATEGORY_IMAGE_SRC

  const trimmed = raw.trim()
  if (!trimmed) return DEFAULT_CATEGORY_IMAGE_SRC
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')
  if (normalized.startsWith('/')) return `${API_URL}${normalized}`
  return `${API_URL}/${normalized}`
}
