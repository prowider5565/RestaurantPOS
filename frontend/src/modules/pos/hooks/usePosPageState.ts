import { useCallback, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getCurrentUser } from '../../../shared/auth'
import { printReceipt } from '../receipt'
import type { ApiOrderTable, CartLine, UiProduct } from '../types'

type ProductMenuState = {
  product: UiProduct
  left: number
  top: number
} | null

type UsePosPageStateOptions = {
  cartLines: CartLine[]
  clearCart: () => void
  discountedSubtotal: number
  includeWaiterFee: boolean
  orderTables: ApiOrderTable[]
  selectedOrderTableId: string
  subtotalInt: number
}

export function usePosPageState({
  cartLines,
  clearCart,
  discountedSubtotal,
  includeWaiterFee,
  orderTables,
  selectedOrderTableId,
  subtotalInt,
}: UsePosPageStateOptions) {
  const [search, setSearch] = useState('')
  const [productMenu, setProductMenu] = useState<ProductMenuState>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current == null) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  const beginLongPress = useCallback((product: UiProduct, left: number, top: number) => {
    clearLongPressTimer()
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setProductMenu({ product, left, top })
      clearLongPressTimer()
    }, 550)
  }, [clearLongPressTimer])

  const cancelLongPress = useCallback(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

  const placeOrder = useCallback(async () => {
    if (cartLines.length === 0 || isPlacingOrder || !selectedOrderTableId) return

    setIsPlacingOrder(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const payload = {
        total: subtotalInt,
        discounted_total: discountedSubtotal,
        user_id: currentUser.id,
        order_table_id: Number(selectedOrderTableId),
        waiter_fee: includeWaiterFee,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return

      const orderData = await response.json()
      const selectedOrderTable = orderTables.find((table) => String(table.id) === selectedOrderTableId)
      await printReceipt({
        ...orderData,
        order_table: selectedOrderTable
          ? {
              id: selectedOrderTable.id,
              table_number: selectedOrderTable.table_number,
              table_color: selectedOrderTable.table_color,
            }
          : orderData.order_table ?? null,
      })
      clearCart()
    } finally {
      setIsPlacingOrder(false)
    }
  }, [
    cartLines,
    clearCart,
    discountedSubtotal,
    includeWaiterFee,
    isPlacingOrder,
    orderTables,
    selectedOrderTableId,
    subtotalInt,
  ])

  return {
    beginLongPress,
    cancelLongPress,
    isPlacingOrder,
    longPressFiredRef,
    placeOrder,
    productMenu,
    search,
    setProductMenu,
    setSearch,
  }
}
