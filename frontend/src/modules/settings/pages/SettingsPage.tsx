import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Alert, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders, logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'

type Me = {
  id: number
  username: string
  position: string | null
  is_admin: boolean
}

export default function SettingsPage({
  onNavigate,
  showUsers,
}: {
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const [me, setMe] = useState<Me | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    let alive = true

    async function loadMe() {
      const res = await fetch(`${API_URL}/users/me`, { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = (await res.json()) as Me
      if (!alive) return
      setMe(data)
      setUsername(data.username ?? '')
    }

    loadMe()
    return () => {
      alive = false
    }
  }, [])

  const saveDisabled = useMemo(() => {
    const usernameUnchanged = username.trim() === (me?.username ?? '')
    const passwordMismatch = Boolean(password || passwordConfirm) && password !== passwordConfirm
    return saving || passwordMismatch || (usernameUnchanged && !password)
  }, [me?.username, password, passwordConfirm, saving, username])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (saveDisabled) return

    setSaving(true)
    setStatus(null)
    try {
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
    } catch {
      setStatus({ kind: 'err', msg: 'Xatolik yuz berdi' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active="menu"
        onNavigate={onNavigate}
        showUsers={showUsers}
        onSettings={() => onNavigate('settings')}
        onLogout={() => logout()}
      />

      <Box
        sx={{
          flex: 1,
          display: 'grid',
          minHeight: 0,
          gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
        }}
      >
        <Box
          sx={{
            borderRight: { md: '1px solid' },
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: '100%',
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: 'rgba(249, 115, 22, 0.12)',
              color: '#EA580C',
              fontWeight: 900,
            }}
          >
            Profil
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            p: { xs: 3, md: 4 },
          }}
        >
          <Stack component="form" spacing={2} onSubmit={save} sx={{ width: '100%', maxWidth: 520 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 22 }}>Profil</Typography>

            {status ? <Alert severity={status.kind === 'ok' ? 'success' : 'error'}>{status.msg}</Alert> : null}

            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />

            <TextField
              label="Confirm password"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPasswordConfirm((value) => !value)}>
                    {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />

            <Button type="submit" variant="contained" disabled={saveDisabled} sx={{ alignSelf: 'flex-start' }}>
              Submit
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
