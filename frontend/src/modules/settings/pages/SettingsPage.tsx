import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { invoke } from '@tauri-apps/api/core'
import { Alert, Box, Button, Divider, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { clearAccessToken, getAuthHeaders } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'

type Me = {
  id: number
  username: string
  position: string | null
  is_admin: boolean
}

const PROGRAM_NAME_STORAGE_KEY = 'programName'
const DEFAULT_PROGRAM_NAME = 'Restoran Cheki'

export default function SettingsPage({
  onNavigate,
  showUsers,
}: {
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const [me, setMe] = useState<Me | null>(null)
  const [username, setUsername] = useState('')

  const [programName, setProgramName] = useState(DEFAULT_PROGRAM_NAME)
  const [savedProgramName, setSavedProgramName] = useState(DEFAULT_PROGRAM_NAME)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [ipAddress, setIpAddress] = useState<string | null>(null)
  const [ipLoading, setIpLoading] = useState(false)

  useEffect(() => {
    const fromStorage = localStorage.getItem(PROGRAM_NAME_STORAGE_KEY)
    const next = (fromStorage ?? DEFAULT_PROGRAM_NAME).trim() || DEFAULT_PROGRAM_NAME
    setProgramName(next)
    setSavedProgramName(next)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await fetch(`${API_URL}/users/me`, { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = (await res.json()) as Me
      if (!alive) return
      setMe(data)
      setUsername(data.username ?? '')
    })()
    return () => {
      alive = false
    }
  }, [])

  const saveDisabled = useMemo(() => {
    const passwordMismatch = Boolean(password || passwordConfirm) && password !== passwordConfirm
    const unchangedProgram = programName.trim() === savedProgramName.trim()
    const unchangedUser = me ? username.trim() === (me.username ?? '') : true
    return saving || passwordMismatch || (unchangedProgram && unchangedUser && !password)
  }, [password, passwordConfirm, programName, savedProgramName, saving, username, me])

  async function getMyIp() {
    setIpLoading(true)
    try {
      const ip = await invoke<string>('get_local_ip')
      setIpAddress(ip)
    } catch {
      setIpAddress('Xatolik')
    } finally {
      setIpLoading(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (saveDisabled) return
    setSaving(true)
    setStatus(null)
    try {
      const nextProgramName = programName.trim() || DEFAULT_PROGRAM_NAME
      if (nextProgramName !== savedProgramName) {
        localStorage.setItem(PROGRAM_NAME_STORAGE_KEY, nextProgramName)
        setSavedProgramName(nextProgramName)
      }

      const nextUsername = username.trim()
      if (me && nextUsername !== me.username) {
        const res = await fetch(`${API_URL}/users/update-username`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: nextUsername }),
        })
        if (!res.ok) throw new Error('Username update failed')
        setMe((prev) => (prev ? { ...prev, username: nextUsername } : prev))
      }

      if (password && password === passwordConfirm) {
        const res = await fetch(`${API_URL}/users/update-password`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!res.ok) throw new Error('Password update failed')
        setPassword('')
        setPasswordConfirm('')
      }

      setStatus({ kind: 'ok', msg: 'Saqlandi' })
    } catch (err) {
      setStatus({ kind: 'err', msg: 'Xatolik yuz berdi' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Sozlamalar"
        active="menu"
        onNavigate={onNavigate}
        showUsers={showUsers}
        settingsAction={
          <Tooltip title="Sozlamalar" placement="bottom">
            <IconButton
              aria-label="Sozlamalar"
              onClick={() => onNavigate('settings')}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        }
        rightActions={
          <Tooltip title="Chiqish" placement="bottom">
            <IconButton
              aria-label="Chiqish"
              onClick={() => clearAccessToken()}
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
      />

      <Box sx={{ p: 3, display: 'grid', placeItems: 'center', flex: 1 }}>
        <Paper sx={{ width: '100%', maxWidth: 520, p: 2 }}>
          <Stack spacing={1} component="form" onSubmit={save}>
            <Typography sx={{ fontWeight: 900, textAlign: 'center' }}>Sozlamalar</Typography>

            <Divider />

            {status && <Alert severity={status.kind === 'ok' ? 'success' : 'error'}>{status.msg}</Alert>}

            <TextField label="Dastur nomi" value={programName} onChange={(e) => setProgramName(e.target.value)} fullWidth />

            <TextField label="Foydalanuvchi nomi" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />

            <Divider sx={{ my: 1 }} />

            <Typography sx={{ fontWeight: 900 }}>Tarmoq</Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="outlined" onClick={getMyIp} disabled={ipLoading}>
                {ipLoading ? 'Yuklanmoqda…' : 'IP olish'}
              </Button>
              <Typography variant="body2">{ipAddress ?? '—'}</Typography>
            </Stack>

            <Divider />

            <TextField
              label="Parol"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />

            <TextField
              label="Tasdiqlash"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPasswordConfirm((v) => !v)}>
                    {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />

            <Button type="submit" disabled={saveDisabled}>
              Saqlash
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
