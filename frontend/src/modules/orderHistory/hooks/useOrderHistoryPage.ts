import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import type { DateRangePreset } from '../../../shared/components/DateRangeFilterCard'
import type { ApiOrderHistoryResponse } from '../types'
import { countFoodTypes, formatCreated, toYmd } from '../utils'

export function useOrderHistoryPage() {
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [preset, setPreset] = useState<DateRangePreset>('daily')
  const [fromDate, setFromDate] = useState<string>(toYmd(new Date()))
  const [toDate, setToDate] = useState<string>(toYmd(new Date()))
  const [page, setPage] = useState(1)
  const size = 12
  const [history, setHistory] = useState<ApiOrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (fromDate) params.set('from_date', fromDate)
        if (toDate) params.set('to_date', toDate)

        const response = await fetch(`${API_URL}/orders/history?${params.toString()}`)
        if (!response.ok) return
        const data = (await response.json()) as ApiOrderHistoryResponse
        if (cancelled) return
        setHistory(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [fromDate, page, size, toDate])

  const rows = useMemo(() => {
    const items = history?.page.items ?? []
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((order) => String(order.id).includes(query))
  }, [history?.page.items, search])

  function exportToExcelCsv() {
    const header = ['ID', 'Foydalanuvchi', 'Lavozim', 'Taom turlari', 'Ichimlik turlari', "To'lov holati", 'Jami summa', 'Sana']
    const lines = rows.map((order) => {
      const foodTypes = countFoodTypes(order.items)
      const drinkTypes = 0
      const payTypeLabel = order.status === 'Pending' ? 'Kutilmoqda' : "To'langan"
      const total = order.total_price
      const username = order.user?.username ?? '-'
      const position = order.user?.position ?? '-'

      return [
        order.id,
        username,
        position,
        foodTypes,
        drinkTypes,
        payTypeLabel,
        total.toFixed(2),
        formatCreated(order.created_at),
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(',')
    })

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `order-history-${toYmd(new Date())}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function changePreset(next: DateRangePreset) {
    setPreset(next)
    setPage(1)
  }

  function changeDateRange(nextFromDate: string, nextToDate: string) {
    setFromDate(nextFromDate)
    setToDate(nextToDate)
    setPage(1)
  }

  return {
    search,
    setSearch,
    selectedOrderId,
    setSelectedOrderId,
    preset,
    changePreset,
    fromDate,
    toDate,
    changeDateRange,
    page,
    setPage,
    history,
    loading,
    rows,
    exportToExcelCsv,
  }
}
