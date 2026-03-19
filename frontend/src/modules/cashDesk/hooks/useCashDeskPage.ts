import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders } from '../../../shared/auth'
import type { DateRangePreset } from '../../../shared/components/DateRangeFilterCard'
import { useAuth } from '../../../shared/authContext'
import type { ApiCashDeskTransaction, ApiDeleteOut, ApiPage, CashDeskSummary } from '../types'

function toYmd(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function getResponseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null
  return payload?.detail || `${fallback} (${response.status})`
}

export function useCashDeskPage() {
  const { me } = useAuth()
  const isAdmin = me?.is_admin === true || me?.is_admin === 1
  const today = toYmd(new Date())

  const [summary, setSummary] = useState<CashDeskSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const [txPage, setTxPage] = useState<ApiPage<ApiCashDeskTransaction> | null>(null)
  const [preset, setPreset] = useState<DateRangePreset>('daily')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [createAmount, setCreateAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const size = 10
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiCashDeskTransaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const hasCompleteRange = preset !== null || (!!fromDate && !!toDate)

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      if (!hasCompleteRange) {
        setSummary(null)
        setSummaryError(null)
        setSummaryLoading(false)
        return
      }

      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const params = new URLSearchParams()
        if (preset) params.set('preset', preset)
        if (fromDate) params.set('from_date', fromDate)
        if (toDate) params.set('to_date', toDate)

        const summaryUrl = params.size ? `${API_URL}/cash-desk/summary?${params.toString()}` : `${API_URL}/cash-desk/summary`
        const response = await fetch(summaryUrl)
        if (!response.ok) {
          throw new Error(await getResponseError(response, "Hisobotni yuklab bo'lmadi"))
        }
        const data = (await response.json()) as CashDeskSummary
        if (!cancelled) setSummary(data)
      } catch (nextError) {
        if (cancelled) return
        setSummary(null)
        setSummaryError(nextError instanceof Error ? nextError.message : "Hisobotni yuklab bo'lmadi")
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }

    loadSummary()
    return () => {
      cancelled = true
    }
  }, [fromDate, hasCompleteRange, preset, reloadKey, toDate])

  useEffect(() => {
    let cancelled = false

    async function loadTransactions() {
      if (!hasCompleteRange) {
        setTxPage(null)
        return
      }

      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (preset) params.set('preset', preset)
        if (fromDate) params.set('from_date', fromDate)
        if (toDate) params.set('to_date', toDate)

        const response = await fetch(`${API_URL}/cash-desk/transactions?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getResponseError(response, "Tranzaksiyalarni yuklab bo'lmadi"))
        }

        const data = (await response.json()) as ApiPage<ApiCashDeskTransaction>
        if (cancelled) return
        setTxPage(data)
        if (data.pages && page > data.pages) setPage(data.pages)
      } catch {
        if (!cancelled) setTxPage(null)
      }
    }

    loadTransactions()
    return () => {
      cancelled = true
    }
  }, [fromDate, hasCompleteRange, page, preset, reloadKey, size, toDate])

  const createAmountInt = useMemo(() => {
    const numeric = Number(createAmount)
    if (!Number.isFinite(numeric)) return null
    const integer = Math.floor(numeric)
    if (integer <= 0) return null
    return integer
  }, [createAmount])

  async function createTransaction(transactionType: 'in' | 'out') {
    if (creating || !createAmountInt) return

    setCreating(true)
    setCreateError(null)
    try {
      const response = await fetch(`${API_URL}/cash-desk/transactions`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: createAmountInt, transaction_type: transactionType }),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Tranzaksiyani yaratib bo'lmadi"))
      }

      await response.json().catch(() => null)
      setCreateAmount('')
      setPage(1)
      setReloadKey((value) => value + 1)
    } catch (nextError) {
      setCreateError(nextError instanceof Error ? nextError.message : "Tranzaksiyani yaratib bo'lmadi")
    } finally {
      setCreating(false)
    }
  }

  function requestDeleteTransaction(transaction: ApiCashDeskTransaction) {
    if (!isAdmin) return
    setDeleteError(null)
    setDeleteTarget(transaction)
    setDeleteOpen(true)
  }

  function closeDelete() {
    if (deleting) return
    setDeleteOpen(false)
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return

    setDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`${API_URL}/cash-desk/transactions/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Tranzaksiyani o'chirib bo'lmadi"))
      }

      await response.json().catch(() => null as ApiDeleteOut | null)
      setDeleteOpen(false)
      setReloadKey((value) => value + 1)
    } catch (nextError) {
      setDeleteError(nextError instanceof Error ? nextError.message : "Tranzaksiyani o'chirib bo'lmadi")
    } finally {
      setDeleting(false)
    }
  }

  function exportSnapshot() {
    // Backend-driven export will be wired here.
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
    isAdmin,
    summary,
    summaryLoading,
    summaryError,
    preset,
    changePreset,
    fromDate,
    toDate,
    changeDateRange,
    page,
    setPage,
    pages: txPage?.pages ?? 1,
    pagedTransactions: txPage?.items ?? [],
    createAmount,
    setCreateAmount,
    createAmountInt,
    creating,
    createError,
    createTransaction,
    exportSnapshot,
    deleteOpen,
    deleteTarget,
    deleting,
    deleteError,
    requestDeleteTransaction,
    closeDelete,
    confirmDelete,
  }
}
