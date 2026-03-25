import { useEffect, useState } from 'react'

import { API_URL } from '../../../config/env'
import type { ApiOrderTable, NewOrderTableForm } from '../types'

export function usePosOrderTables() {
  const [orderTables, setOrderTables] = useState<ApiOrderTable[]>([])
  const [selectedOrderTableId, setSelectedOrderTableId] = useState('')
  const [createTableOpen, setCreateTableOpen] = useState(false)
  const [newOrderTable, setNewOrderTable] = useState<NewOrderTableForm>({
    tableNumberDigits: '',
    tableColor: '#FFE5B4',
  })

  function openCreateTable() {
    setNewOrderTable({
      tableNumberDigits: '',
      tableColor: '#FFE5B4',
    })
    setCreateTableOpen(true)
  }

  function closeCreateTable() {
    setCreateTableOpen(false)
  }

  async function createOrderTable() {
    const tableNumber = Number(newOrderTable.tableNumberDigits)
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) return

    const response = await fetch(`${API_URL}/orders/tables/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: tableNumber,
        table_color: newOrderTable.tableColor,
      }),
    })
    if (!response.ok) return

    const created = (await response.json()) as ApiOrderTable
    setOrderTables((prev) => [...prev, created].sort((a, b) => a.table_number - b.table_number))
    setSelectedOrderTableId(String(created.id))
    setCreateTableOpen(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadOrderTables() {
      const response = await fetch(`${API_URL}/orders/tables`)
      if (!response.ok) return
      const list = (await response.json()) as ApiOrderTable[]
      if (cancelled) return
      setOrderTables(list)
      setSelectedOrderTableId((prev) => {
        if (prev && list.some((table) => String(table.id) === prev)) return prev
        return list[0] ? String(list[0].id) : ''
      })
    }

    loadOrderTables()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    orderTables,
    selectedOrderTableId,
    setSelectedOrderTableId,
    createTableOpen,
    openCreateTable,
    closeCreateTable,
    newOrderTable,
    setNewOrderTable,
    createOrderTable,
  }
}
