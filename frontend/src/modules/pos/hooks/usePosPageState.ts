import { useCallback, useEffect, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getCurrentUser } from '../../../shared/auth'
import { printReceipt } from '../receipt'
import type { ApiOrderDetail, ApiOrderTable, CartLine, PaymentType, UiProduct } from '../types'
import { toImageSrc } from '../utils'

type ProductMenuState = {
  product: UiProduct
  left: number
  top: number
} | null

type UsePosPageStateOptions = {
  cartLines: CartLine[]
  discountedSubtotal: number
  includeWaiterFee: boolean
  orderTables: ApiOrderTable[]
  replaceCart: (lines: CartLine[]) => void
  selectedOrderTableId: string
  setDiscountedSubtotal: (value: number | null) => void
  setIncludeWaiterFee: (value: boolean) => void
  subtotalInt: number
}

function toPaymentType(value?: string | null): PaymentType {
  return value === 'Naqd' ? 'Naqd' : 'Karta'
}

function toCartLines(order: ApiOrderDetail): CartLine[] {
  return order.items.map((item) => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      imageSrc: toImageSrc(item.product),
      categoryId: item.product.category_id ? String(item.product.category_id) : 'uncategorized',
      measure: item.product.measure ?? 'unit',
    },
    qty: item.quantity,
  }))
}

export function usePosPageState({
  cartLines,
  discountedSubtotal,
  includeWaiterFee,
  orderTables,
  replaceCart,
  selectedOrderTableId,
  setDiscountedSubtotal,
  setIncludeWaiterFee,
  subtotalInt,
}: UsePosPageStateOptions) {
  const [search, setSearch] = useState('')
  const [productMenu, setProductMenu] = useState<ProductMenuState>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [isCompletingOrder, setIsCompletingOrder] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>('Karta')
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)
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

  useEffect(() => {
    let cancelled = false

    async function loadPendingOrder() {
      if (!selectedOrderTableId) {
        setActiveOrderId(null)
        replaceCart([])
        setIncludeWaiterFee(true)
        setDiscountedSubtotal(null)
        setPaymentType('Karta')
        return
      }

      const response = await fetch(`${API_URL}/orders/tables/${selectedOrderTableId}/pending`)
      if (!response.ok) return

      const order = (await response.json()) as ApiOrderDetail | null
      if (cancelled) return

      if (!order) {
        setActiveOrderId(null)
        replaceCart([])
        setIncludeWaiterFee(true)
        setDiscountedSubtotal(null)
        setPaymentType('Karta')
        return
      }

      setActiveOrderId(order.id)
      replaceCart(toCartLines(order))
      setIncludeWaiterFee(order.waiter_fee)
      setDiscountedSubtotal(
        order.discount_amount ? Math.max(Math.round(order.total_price - order.discount_amount), 0) : null,
      )
      setPaymentType(toPaymentType(order.payment_type))
    }

    loadPendingOrder()
    return () => {
      cancelled = true
    }
  }, [replaceCart, selectedOrderTableId, setDiscountedSubtotal, setIncludeWaiterFee])

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
        payment_type: paymentType,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }

      const response = await fetch(activeOrderId ? `${API_URL}/orders/${activeOrderId}` : `${API_URL}/orders`, {
        method: activeOrderId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return

      const orderData = (await response.json()) as ApiOrderDetail
      setActiveOrderId(orderData.id)
      replaceCart(toCartLines(orderData))
      setIncludeWaiterFee(orderData.waiter_fee)
      setDiscountedSubtotal(
        orderData.discount_amount ? Math.max(Math.round(orderData.total_price - orderData.discount_amount), 0) : null,
      )
      setPaymentType(toPaymentType(orderData.payment_type))
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
    } finally {
      setIsPlacingOrder(false)
    }
  }, [
    activeOrderId,
    cartLines,
    discountedSubtotal,
    includeWaiterFee,
    isPlacingOrder,
    orderTables,
    paymentType,
    replaceCart,
    selectedOrderTableId,
    setDiscountedSubtotal,
    setIncludeWaiterFee,
    subtotalInt,
  ])

  const completeOrder = useCallback(async () => {
    if (!activeOrderId || isCompletingOrder) return

    setIsCompletingOrder(true)
    try {
      const response = await fetch(`${API_URL}/orders/${activeOrderId}/complete`, {
        method: 'POST',
      })
      if (!response.ok) return

      setActiveOrderId(null)
      replaceCart([])
      setIncludeWaiterFee(true)
      setDiscountedSubtotal(null)
      setPaymentType('Karta')
    } finally {
      setIsCompletingOrder(false)
    }
  }, [activeOrderId, isCompletingOrder, replaceCart, setDiscountedSubtotal, setIncludeWaiterFee])

  return {
    activeOrderId,
    beginLongPress,
    cancelLongPress,
    completeOrder,
    isCompletingOrder,
    isPlacingOrder,
    longPressFiredRef,
    paymentType,
    placeOrder,
    productMenu,
    search,
    setPaymentType,
    setProductMenu,
    setSearch,
  }
}
