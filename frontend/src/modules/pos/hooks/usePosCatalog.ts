import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import type { ApiCategory, ApiProduct, Category, UiProduct } from '../types'
import { DEFAULT_CATEGORY_IMAGE_SRC, toCategoryImageSrc, toImageSrc } from '../utils'

export function usePosCatalog(search: string) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])
  const [menuProducts, setMenuProducts] = useState<UiProduct[]>([])

  const menuCategories: Category[] = useMemo(() => {
    const base: Category[] = [{ id: 'all', label: 'Barchasi', imageSrc: DEFAULT_CATEGORY_IMAGE_SRC }]

    return [
      ...base,
      ...apiCategories.map((category) => ({
        id: String(category.id),
        label: category.name,
        imageSrc: toCategoryImageSrc(category),
      })),
    ]
  }, [apiCategories])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return menuProducts.filter((product) => (!query ? true : product.name.toLowerCase().includes(query)))
  }, [menuProducts, search])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      const response = await fetch(`${API_URL}/product-categories`)
      if (!response.ok) return
      const list = (await response.json()) as ApiCategory[]
      if (cancelled) return
      setApiCategories(list)
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      const params = new URLSearchParams()
      if (selectedCategoryId === 'uncategorized') params.set('category_id', '0')
      else if (selectedCategoryId !== 'all') params.set('category_id', selectedCategoryId)

      const url = params.size ? `${API_URL}/products?${params.toString()}` : `${API_URL}/products`
      const response = await fetch(url)
      if (!response.ok) return
      const list = (await response.json()) as ApiProduct[]
      if (cancelled) return

      setMenuProducts(
        list.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageSrc: toImageSrc(product),
          categoryId: product.category_id ? String(product.category_id) : 'uncategorized',
          measure: product.measure ?? 'unit',
        })),
      )
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [selectedCategoryId])

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    apiCategories,
    setApiCategories,
    menuProducts,
    setMenuProducts,
    menuCategories,
    visibleProducts,
  }
}
