import { useCallback, useMemo, useRef, useState } from 'react'

import type { CartLine, UiProduct } from '../types'

export function usePosCart() {
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const cartItemsRef = useRef<HTMLDivElement | null>(null)

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty, 0), [cartLines])

  const addToCart = useCallback((product: UiProduct) => {
    setCart((prev) => {
      const existing = prev[String(product.id)]
      const nextQty = existing ? existing.qty + 1 : 1
      return { ...prev, [String(product.id)]: { product, qty: nextQty } }
    })
  }, [])

  function setQty(productId: number, qty: number) {
    setCart((prev) => {
      const key = String(productId)
      if (qty <= 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }

      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, qty } }
    })
  }

  function clearCart() {
    setCart({})
  }

  return {
    cartItemsRef,
    cartLines,
    cartCount,
    addToCart,
    setQty,
    clearCart,
  }
}
