import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CartLine } from '../types'

export function usePosTotals(cartLines: CartLine[], cartCount: number) {
  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [discountDigits, setDiscountDigits] = useState('')
  const [discountedTotalOverride, setDiscountedTotalOverride] = useState<number | null>(null)
  const [includeWaiterFee, setIncludeWaiterFee] = useState(true)

  const subtotal = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty * line.product.price, 0), [cartLines])
  const subtotalInt = useMemo(() => Math.round(subtotal), [subtotal])
  const waitressWage = useMemo(() => (includeWaiterFee ? Math.round(subtotalInt * 0.1) : 0), [includeWaiterFee, subtotalInt])
  const totalWithWaitressWage = useMemo(() => subtotalInt + waitressWage, [subtotalInt, waitressWage])
  const discountedSubtotal = useMemo(() => {
    const raw = discountedTotalOverride ?? subtotalInt
    if (!Number.isFinite(raw)) return subtotalInt
    return Math.min(Math.max(Math.round(raw), 0), subtotalInt)
  }, [discountedTotalOverride, subtotalInt])

  const discountedTotal = useMemo(() => {
    if (isEditingTotal) {
      const nextValue = discountDigits ? Number(discountDigits) : 0
      if (!Number.isFinite(nextValue)) return totalWithWaitressWage
      return Math.min(Math.max(Math.round(nextValue), waitressWage), totalWithWaitressWage)
    }

    return discountedSubtotal + waitressWage
  }, [discountDigits, discountedSubtotal, isEditingTotal, totalWithWaitressWage, waitressWage])

  function toggleEditTotal() {
    if (cartCount === 0) return

    if (!isEditingTotal) {
      setDiscountDigits(String(discountedTotal))
      setIsEditingTotal(true)
      return
    }

    const nextValue = discountDigits ? Number(discountDigits) : 0
    const nextTotal = Number.isFinite(nextValue)
      ? Math.min(Math.max(Math.round(nextValue), waitressWage), totalWithWaitressWage)
      : totalWithWaitressWage
    const nextSubtotal = Math.min(Math.max(nextTotal - waitressWage, 0), subtotalInt)
    setDiscountedTotalOverride(nextSubtotal === subtotalInt ? null : nextSubtotal)
    setIsEditingTotal(false)
  }

  const setDiscountedSubtotal = useCallback((value: number | null) => {
    setIsEditingTotal(false)
    setDiscountDigits('')
    setDiscountedTotalOverride(value)
  }, [])

  useEffect(() => {
    if (cartCount !== 0) return
    setIsEditingTotal(false)
    setDiscountDigits('')
    setDiscountedTotalOverride(null)
  }, [cartCount])

  return {
    isEditingTotal,
    discountDigits,
    setDiscountDigits,
    discountedSubtotal,
    subtotalInt,
    waitressWage,
    discountedTotal,
    includeWaiterFee,
    setIncludeWaiterFee,
    setDiscountedSubtotal,
    toggleEditTotal,
  }
}
