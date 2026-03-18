import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders } from '../../../shared/auth'
import type { ApiUser, CreateUserForm, EditUserForm, StatusMessage } from '../types'

const EMPTY_CREATE_FORM: CreateUserForm = {
  username: '',
  password: '',
  confirmPassword: '',
  position: '',
}

const EMPTY_EDIT_FORM: EditUserForm = {
  username: '',
  password: '',
  confirmPassword: '',
  showPassword: false,
  showPasswordConfirm: false,
}

async function getResponseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null
  return payload?.detail || fallback
}

export function useUsersPage() {
  const [rows, setRows] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_CREATE_FORM)

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<ApiUser | null>(null)
  const [editForm, setEditForm] = useState<EditUserForm>(EMPTY_EDIT_FORM)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<StatusMessage | null>(null)

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivateUser, setDeactivateUser] = useState<ApiUser | null>(null)
  const [deactivateNextActive, setDeactivateNextActive] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateStatus, setDeactivateStatus] = useState<StatusMessage | null>(null)

  const [page, setPage] = useState(1)
  const size = 12

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/users/admin/get-user-list`, { headers: getAuthHeaders() })
      if (!response.ok) {
        const detail = await getResponseError(response, "Foydalanuvchilarni yuklab bo'lmadi")
        throw new Error(`Foydalanuvchilarni yuklab bo'lmadi (${response.status}): ${detail}`)
      }

      const data = (await response.json()) as ApiUser[]
      setRows(Array.isArray(data) ? data : [])
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Foydalanuvchilarni yuklab bo'lmadi")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  function openCreate() {
    setCreateError(null)
    setCreateSaving(false)
    setCreateForm(EMPTY_CREATE_FORM)
    setCreateOpen(true)
  }

  function closeCreate() {
    if (createSaving) return
    setCreateOpen(false)
  }

  async function createUser() {
    if (createSaving) return

    const username = createForm.username.trim()
    const password = createForm.password
    const confirmPassword = createForm.confirmPassword
    const position = createForm.position.trim()

    if (!username || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      setCreateError('Parollar mos emas')
      return
    }

    setCreateSaving(true)
    setCreateError(null)
    try {
      const response = await fetch(`${API_URL}/users/admin/create-user`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, position: position || null }),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Foydalanuvchini yaratib bo'lmadi"))
      }

      setCreateOpen(false)
      await load()
    } catch (nextError) {
      setCreateError(nextError instanceof Error ? nextError.message : "Foydalanuvchini yaratib bo'lmadi")
    } finally {
      setCreateSaving(false)
    }
  }

  function openEdit(user: ApiUser) {
    setEditUser(user)
    setEditForm({
      username: user.username ?? '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showPasswordConfirm: false,
    })
    setSaveStatus(null)
    setEditOpen(true)
  }

  function closeEdit() {
    if (saving) return
    setEditOpen(false)
  }

  function openDeactivate(user: ApiUser) {
    setDeactivateUser(user)
    setDeactivateNextActive(user.is_active === false)
    setDeactivateStatus(null)
    setDeactivateOpen(true)
  }

  function closeDeactivate() {
    if (deactivating) return
    setDeactivateOpen(false)
  }

  async function confirmDeactivate() {
    if (!deactivateUser || deactivating) return

    setDeactivating(true)
    setDeactivateStatus(null)
    try {
      const path = deactivateNextActive
        ? `${API_URL}/users/admin/activate-user/${deactivateUser.id}`
        : `${API_URL}/users/admin/deactivate-user/${deactivateUser.id}`

      const response = await fetch(path, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Foydalanuvchini yangilab bo'lmadi"))
      }

      setDeactivateStatus({
        kind: 'ok',
        msg: deactivateNextActive ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi faolsizlantirildi',
      })
      setDeactivateOpen(false)
      await load()
    } catch (nextError) {
      setDeactivateStatus({
        kind: 'err',
        msg: nextError instanceof Error ? nextError.message : "Foydalanuvchini yangilab bo'lmadi",
      })
    } finally {
      setDeactivating(false)
    }
  }

  const saveDisabled =
    saving ||
    !editUser ||
    !editForm.username.trim() ||
    (Boolean(editForm.password) || Boolean(editForm.confirmPassword)
      ? !editForm.password || !editForm.confirmPassword || editForm.password !== editForm.confirmPassword
      : false)

  async function saveEdit() {
    if (saveDisabled || !editUser) return

    setSaving(true)
    setSaveStatus(null)
    try {
      const body: { username: string; password?: string } = { username: editForm.username.trim() }
      if (editForm.password) body.password = editForm.password

      const response = await fetch(`${API_URL}/users/admin/update-user/${editUser.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error(await getResponseError(response, "Foydalanuvchini yangilab bo'lmadi"))
      }

      setSaveStatus({ kind: 'ok', msg: 'Foydalanuvchi yangilandi' })
      setEditOpen(false)
      await load()
    } catch (nextError) {
      setSaveStatus({
        kind: 'err',
        msg: nextError instanceof Error ? nextError.message : "Foydalanuvchini yangilab bo'lmadi",
      })
    } finally {
      setSaving(false)
    }
  }

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((user) => {
      const username = (user.username ?? '').toLowerCase()
      const position = (user.position ?? '').toLowerCase()
      return username.includes(query) || position.includes(query)
    })
  }, [rows, search])

  const pages = useMemo(() => Math.max(1, Math.ceil(visibleRows.length / size)), [size, visibleRows.length])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * size
    return visibleRows.slice(start, start + size)
  }, [page, size, visibleRows])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handler = () => openCreate()
    window.addEventListener('users:createUser', handler)
    return () => window.removeEventListener('users:createUser', handler)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  return {
    rows,
    loading,
    error,
    search,
    setSearch,
    load,
    createOpen,
    openCreate,
    closeCreate,
    createSaving,
    createError,
    createForm,
    setCreateForm,
    createUser,
    editOpen,
    editUser,
    editForm,
    setEditForm,
    saving,
    saveStatus,
    saveDisabled,
    openEdit,
    closeEdit,
    saveEdit,
    deactivateOpen,
    deactivateUser,
    deactivateNextActive,
    deactivating,
    deactivateStatus,
    openDeactivate,
    closeDeactivate,
    confirmDeactivate,
    page,
    setPage,
    pages,
    pagedRows,
  }
}
