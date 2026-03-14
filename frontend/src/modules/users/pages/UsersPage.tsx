import LogoutIcon from '@mui/icons-material/Logout'
import RefreshIcon from '@mui/icons-material/Refresh'
import SettingsIcon from '@mui/icons-material/Settings'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  AppBar,
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
  List,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import { API_URL } from '../../../config/env'
import { logout } from '../../../shared/auth'

type ApiUser = {
  id: number
  username: string
  position?: string | null
  is_admin?: boolean
  is_active?: boolean
}

export default function UsersPage() {
  const [rows, setRows] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/users/admin/get-user-list`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load users')
      const data = (await res.json()) as ApiUser[]
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
        credentials: 'include',
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || 'Failed to update user')
      }
      setDeactivateStatus({ kind: 'ok', msg: deactivateNextActive ? 'User activated' : 'User deactivated' })
      setDeactivateOpen(false)
      await load()
    } catch (e) {
      setDeactivateStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Failed to update user' })
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || 'Failed to update user')
      }

      setSaveStatus({ kind: 'ok', msg: 'User updated' })
      setEditOpen(false)
      await load()
    } catch (e) {
      setSaveStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Failed to update user' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography sx={{ fontWeight: 1100, fontSize: 20, flex: 1 }}>Users</Typography>

          <Tooltip title="Refresh" placement="bottom">
            <IconButton
              aria-label="Refresh"
              onClick={load}
              sx={{ width: 52, height: 52, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings" placement="bottom">
            <IconButton
              aria-label="Settings"
              onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'settings' }))}
              sx={{ width: 52, height: 52, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout" placement="bottom">
            <IconButton
              aria-label="Logout"
              onClick={() => logout()}
              sx={{
                width: 52,
                height: 52,
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
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, pb: 12 }}>
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack gap={1}>
              <Typography sx={{ fontWeight: 900 }}>Could not load users</Typography>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
              <Button onClick={load} variant="contained" color="primary" size="large">
                Try again
              </Button>
            </Stack>
          </Paper>
        ) : (
          <List sx={{ display: 'grid', gap: 1.5 }}>
            {rows.map((u) => (
              <Paper key={u.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
                        {u.username}
                      </Typography>
                      {u.is_admin ? <Chip label="Admin" color="warning" size="small" /> : <Chip label="User" size="small" />}
                      {u.is_active === false ? <Chip label="Inactive" color="error" size="small" /> : null}
                    </Stack>
                    {u.position ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {u.position}
                      </Typography>
                    ) : null}
                  </Box>

                  <Stack direction="row" gap={1}>
                    <Button variant="outlined" size="large" sx={{ minWidth: 120 }} onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color={u.is_active === false ? 'success' : 'error'}
                      size="large"
                      sx={{ minWidth: 140 }}
                      onClick={() => openDeactivate(u)}
                    >
                      {u.is_active === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </List>
        )}
      </Box>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>Edit user</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {saveStatus ? (
              <Alert severity={saveStatus.kind === 'ok' ? 'success' : 'error'}>{saveStatus.msg}</Alert>
            ) : null}

            <TextField
              label="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              fullWidth
            />

            <TextField
              label="New password"
              type={showPassword ? 'text' : 'password'}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              label="Confirm password"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={editPasswordConfirm}
              onChange={(e) => setEditPasswordConfirm(e.target.value)}
              error={Boolean(editPasswordConfirm) && editPassword !== editPasswordConfirm}
              helperText={
                Boolean(editPasswordConfirm) && editPassword !== editPasswordConfirm ? 'Passwords do not match' : ' '
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
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
            Cancel
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
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateOpen} onClose={closeDeactivate} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>
          {deactivateNextActive ? 'Activate user' : 'Deactivate user'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {deactivateStatus ? (
              <Alert severity={deactivateStatus.kind === 'ok' ? 'success' : 'error'}>
                {deactivateStatus.msg}
              </Alert>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              {deactivateUser
                ? `${deactivateNextActive ? 'Activate' : 'Deactivate'} "${deactivateUser.username}"?`
                : 'Update this user?'}
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
            Cancel
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
            {deactivating ? 'Saving…' : deactivateNextActive ? 'Activate' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
