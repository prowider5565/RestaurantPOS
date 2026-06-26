import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders } from '../../../shared/auth'
import { useAuth } from '../../../shared/authContext'
import type { DateRangePreset } from '../../../shared/components/DateRangeFilterCard'
import type { ApiOrderHistoryResponse } from '../types'
import { formatCreated, toYmd } from '../utils'

async function getResponseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null
  return payload?.detail || `${fallback} (${response.status})`
}

export function useOrderHistoryPage() {
  const { me } = useAuth()
  const isAdmin = me?.is_admin === true || me?.is_admin === 1

  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [preset, setPreset] = useState<DateRangePreset>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const size = 12
  const [history, setHistory] = useState<ApiOrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const hasCompleteRange = preset !== null || (!!fromDate && !!toDate)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      if (!hasCompleteRange) {
        setHistory(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (preset !== 'all') {
          if (fromDate) params.set('from_date', fromDate)
          if (toDate) params.set('to_date', toDate)
        }

        const response = await fetch(`${API_URL}/orders/history?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) return
        const data = (await response.json()) as ApiOrderHistoryResponse
        if (cancelled) return
        setHistory((prev) => {
          if (data.page.page <= 1 || !prev) return data
          return {
            ...data,
            page: {
              ...data.page,
              items: [...prev.page.items, ...data.page.items],
            },
          }
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [fromDate, hasCompleteRange, page, preset, reloadKey, size, toDate])

  const rows = useMemo(() => {
    const items = history?.page.items ?? []
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((order) => String(order.id).includes(query))
  }, [history?.page.items, search])

  function exportToExcelCsv() {
    const header = ['ID', 'Foydalanuvchi', 'Jami summa', 'Sana']
    const lines = rows.map((order) => {
      const total = order.total_price
      const username = order.user?.username ?? '-'

      return [
        order.id,
        username,
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

  const loadNextPage = useCallback(() => {
    const pageInfo = history?.page
    if (loading || !pageInfo || pageInfo.page >= pageInfo.pages) return
    setPage(pageInfo.page + 1)
  }, [history?.page, loading])

  function requestDeleteOrder(orderId: number) {
    if (!isAdmin) return
    setDeleteError(null)
    setDeletePassword('')
    setDeleteTargetId(orderId)
    setDeleteOpen(true)
  }

  function closeDelete() {
    if (deleting) return
    setDeleteOpen(false)
    setDeletePassword('')
  }

  async function confirmDelete() {
    const password = deletePassword.trim()
    if (!deleteTargetId || deleting || !password) return

    setDeleting(true)
    setDeleteError(null)
    try {
      const params = new URLSearchParams({ password })
      const response = await fetch(`${API_URL}/orders/delete/${deleteTargetId}?${params.toString()}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Buyurtmani o'chirib bo'lmadi"))
      }

      await response.text().catch(() => '')
      if (selectedOrderId === deleteTargetId) {
        setSelectedOrderId(null)
      }
      setDeleteOpen(false)
      setDeleteTargetId(null)
      setDeletePassword('')
      setPage(1)
      setReloadKey((value) => value + 1)
    } catch (nextError) {
      setDeleteError(nextError instanceof Error ? nextError.message : "Buyurtmani o'chirib bo'lmadi")
    } finally {
      setDeleting(false)
    }
  }

  return {
    isAdmin,
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
    loadNextPage,
    hasMoreHistory: history ? history.page.page < history.page.pages : false,
    history,
    loading,
    rows,
    exportToExcelCsv,
    deleteOpen,
    deleteTargetId,
    deleting,
    deleteError,
    deletePassword,
    setDeletePassword,
    requestDeleteOrder,
    closeDelete,
    confirmDelete,
  }
}
