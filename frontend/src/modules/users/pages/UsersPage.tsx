import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders, logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'

type ApiUser = {
  id: number
  username: string
  position?: string | null
  is_admin?: boolean
  is_active?: boolean
}

type CreateUserForm = {
  username: string
  password: string
  confirmPassword: string
  position: string
}

export default function UsersPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const [rows, setRows] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<ApiUser | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivateUser, setDeactivateUser] = useState<ApiUser | null>(null)
  const [deactivateNextActive, setDeactivateNextActive] = useState<boolean>(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateStatus, setDeactivateStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    confirmPassword: '',
    position: '',
  })
  const [page, setPage] = useState(1)
  const [size] = useState(12)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/users/admin/get-user-list`, { headers: getAuthHeaders() })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        const detail = msg?.detail ? `: ${msg.detail}` : ''
        throw new Error(`Foydalanuvchilarni yuklab bo'lmadi (${res.status})${detail}`)
      }
      const data = (await res.json()) as ApiUser[]
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Foydalanuvchilarni yuklab bo'lmadi")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handler = () => {
      setCreateError(null)
      setCreateSaving(false)
      setCreateForm({ username: '', password: '', confirmPassword: '', position: '' })
      setCreateOpen(true)
    }
    window.addEventListener('users:createUser', handler)
    return () => window.removeEventListener('users:createUser', handler)
  }, [])

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
      const res = await fetch(`${API_URL}/users/admin/create-user`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, position: position || null }),
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || "Foydalanuvchini yaratib bo'lmadi")
      }
      setCreateOpen(false)
      await load()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Foydalanuvchini yaratib bo'lmadi")
    } finally {
      setCreateSaving(false)
    }
  }

  function openEdit(u: ApiUser) {
    setEditUser(u)
    setEditUsername(u.username ?? '')
    setEditPassword('')
    setEditPasswordConfirm('')
    setShowPassword(false)
    setShowPasswordConfirm(false)
    setSaveStatus(null)
    setEditOpen(true)
  }

  function closeEdit() {
    if (saving) return
    setEditOpen(false)
  }

  function openDeactivate(u: ApiUser) {
    setDeactivateUser(u)
    setDeactivateNextActive(u.is_active === false)
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

      const res = await fetch(path, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || "Foydalanuvchini yangilab bo'lmadi")
      }
      setDeactivateStatus({ kind: 'ok', msg: deactivateNextActive ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi faolsizlantirildi' })
      setDeactivateOpen(false)
      await load()
    } catch (e) {
      setDeactivateStatus({ kind: 'err', msg: e instanceof Error ? e.message : "Foydalanuvchini yangilab bo'lmadi" })
    } finally {
      setDeactivating(false)
    }
  }

  const saveDisabled =
    saving ||
    !editUser ||
    !editUsername.trim() ||
    (Boolean(editPassword) || Boolean(editPasswordConfirm)
      ? !editPassword || !editPasswordConfirm || editPassword !== editPasswordConfirm
      : false)

  async function saveEdit() {
    if (saveDisabled || !editUser) return
    setSaving(true)
    setSaveStatus(null)
    try {
      const body: { username: string; password?: string } = { username: editUsername.trim() }
      if (editPassword) body.password = editPassword

      const res = await fetch(`${API_URL}/users/admin/update-user/${editUser.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || "Foydalanuvchini yangilab bo'lmadi")
      }

      setSaveStatus({ kind: 'ok', msg: 'Foydalanuvchi yangilandi' })
      setEditOpen(false)
      await load()
    } catch (e) {
      setSaveStatus({ kind: 'err', msg: e instanceof Error ? e.message : "Foydalanuvchini yangilab bo'lmadi" })
    } finally {
      setSaving(false)
    }
  }

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((u) => {
      const username = (u.username ?? '').toLowerCase()
      const position = (u.position ?? '').toLowerCase()
      return username.includes(q) || position.includes(q)
    })
  }, [rows, search])

  const pages = useMemo(() => Math.max(1, Math.ceil(visibleRows.length / size)), [size, visibleRows.length])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * size
    return visibleRows.slice(start, start + size)
  }, [page, size, visibleRows])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        onAdd={() => setCreateOpen(true)}
        rightActions={
          <Tooltip title="Chiqish" placement="bottom">
            <IconButton
              aria-label="Chiqish"
              onClick={() => logout()}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'error.main',
                  color: 'error.main',
                  bgcolor: 'rgba(211, 47, 47, 0.06)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Foydalanuvchi qidirish..."
        settingsAction={
          <Tooltip title="Sozlamalar" placement="bottom">
            <IconButton
              aria-label="Sozlamalar"
              onClick={() => onNavigate('settings')}
              sx={{ width: 36, height: 36, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        }
      />

      <Box
        sx={{
          p: 2,
          pb: 12,
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
            <Stack gap={1}>
              <Typography sx={{ fontWeight: 900 }}>Foydalanuvchilar yuklanmadi</Typography>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
              <Button onClick={load} variant="contained" color="primary" size="large">
                Qayta urinish
              </Button>
            </Stack>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'auto', flex: 1 }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                '& .MuiTableCell-root': {
                  fontSize: '0.9em',
                  py: 1.1,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Foydalanuvchi</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Lavozim</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Holat</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    Amallar
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 1000 }}>{u.username}</TableCell>
                    <TableCell>{u.position ?? '-'}</TableCell>
                    <TableCell>
                      {u.is_admin ? <Chip label="Admin" color="warning" size="small" /> : <Chip label="Foydalanuvchi" size="small" />}
                    </TableCell>
                    <TableCell>
                      {u.is_active === false ? <Chip label="Faol emas" color="error" size="small" /> : <Chip label="Faol" color="success" size="small" />}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" gap={1} justifyContent="flex-end">
                        <Button variant="outlined" size="small" sx={{ minWidth: 120 }} onClick={() => openEdit(u)}>
                          Tahrirlash
                        </Button>
                        <Button
                          variant="contained"
                          color={u.is_active === false ? 'success' : 'error'}
                          size="small"
                          sx={{ minWidth: 140 }}
                          onClick={() => openDeactivate(u)}
                        >
                          {u.is_active === false ? 'Faollashtirish' : 'Faolsizlantirish'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && pages > 1 ? (
          <Stack direction="row" justifyContent="flex-end">
            <Pagination
              color="primary"
              size="large"
              page={page}
              count={pages}
              onChange={(_, next) => setPage(next)}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '1.4em',
                  minWidth: 45,
                  height: 45,
                },
              }}
            />
          </Stack>
        ) : null}
      </Box>

      <Dialog
        open={createOpen}
        onClose={closeCreate}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: '780px' },
            height: { xs: 'calc(100dvh - 32px)', sm: '90dvh' },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: 920 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>Foydalanuvchi yaratish</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 2 }}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              {createError ? <Alert severity="error">{createError}</Alert> : null}

              <TextField
                label="Foydalanuvchi nomi"
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Parol"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Parolni tasdiqlash"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  error={Boolean(createForm.confirmPassword) && createForm.password !== createForm.confirmPassword}
                  helperText={
                    Boolean(createForm.confirmPassword) && createForm.password !== createForm.confirmPassword
                      ? 'Parollar mos emas'
                      : ' '
                  }
                  fullWidth
                />
              </Stack>

              <TextField
                label="Lavozim"
                value={createForm.position}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, position: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="contained"
          onClick={closeCreate}
          fullWidth
          size="large"
          sx={{
            py: 1.6,
            fontSize: 16,
            fontWeight: 900,
            bgcolor: 'grey.500',
            color: 'white',
            '&:hover': {
              bgcolor: 'grey.600',
            },
          }}
          disabled={createSaving}
        >
          Bekor qilish
        </Button>
          <Button
            color="success"
            variant="contained"
            onClick={createUser}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={createSaving || !createForm.username.trim() || !createForm.password || !createForm.confirmPassword}
          >
            {createSaving ? 'Yaratilmoqda…' : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>Foydalanuvchini tahrirlash</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {saveStatus ? (
              <Alert severity={saveStatus.kind === 'ok' ? 'success' : 'error'}>{saveStatus.msg}</Alert>
            ) : null}

            <TextField label="Foydalanuvchi nomi" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} fullWidth />

            <TextField
              label="Yangi parol"
              type={showPassword ? 'text' : 'password'}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Parolni tasdiqlash"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={editPasswordConfirm}
              onChange={(e) => setEditPasswordConfirm(e.target.value)}
              error={Boolean(editPasswordConfirm) && editPassword !== editPasswordConfirm}
              helperText={Boolean(editPasswordConfirm) && editPassword !== editPasswordConfirm ? 'Parollar mos emas' : ' '}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPasswordConfirm ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      onClick={() => setShowPasswordConfirm((v) => !v)}
                      edge="end"
                    >
                      {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={closeEdit}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={saving}
          >
            Bekor qilish
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={saveEdit}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={saveDisabled}
          >
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateOpen} onClose={closeDeactivate} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>
          {deactivateNextActive ? 'Foydalanuvchini faollashtirish' : 'Foydalanuvchini faolsizlantirish'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {deactivateStatus ? <Alert severity={deactivateStatus.kind === 'ok' ? 'success' : 'error'}>{deactivateStatus.msg}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {deactivateUser
                ? `${deactivateNextActive ? 'Faollashtirish' : 'Faolsizlantirish'} "${deactivateUser.username}"?`
                : 'Ushbu foydalanuvchini yangilaysizmi?'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={closeDeactivate}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={deactivating}
          >
            Bekor qilish
          </Button>
          <Button
            color={deactivateNextActive ? 'success' : 'error'}
            variant="contained"
            onClick={confirmDeactivate}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={!deactivateUser || deactivating}
          >
            {deactivating ? 'Saqlanmoqda…' : deactivateNextActive ? 'Faollashtirish' : 'Faolsizlantirish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
