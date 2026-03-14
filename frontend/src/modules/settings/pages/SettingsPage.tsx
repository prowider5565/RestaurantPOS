import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'

type Me = {
  id: number
  username: string
  position: string | null
  is_admin: boolean
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null)

  const [username, setUsername] = useState('')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' })
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
    if (saving) return true
    const next = username.trim()
    const usernameChanged = Boolean(me) && next !== me!.username

    const wantsPasswordChange = Boolean(password) || Boolean(passwordConfirm)
    if (wantsPasswordChange && (!password || !passwordConfirm)) return true
    if (wantsPasswordChange && password !== passwordConfirm) return true

    if (usernameChanged) return false
    if (wantsPasswordChange) return false
    return true
  }, [me, password, passwordConfirm, saving, username])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saveDisabled) return

    setSaving(true)
    setStatus(null)
    try {
      const nextUsername = username.trim()
      const usernameChanged = Boolean(me) && nextUsername !== me!.username

      if (usernameChanged) {
        const res = await fetch(`${API_URL}/users/update-username`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: nextUsername }),
        })
        if (!res.ok) {
          const msg = (await res.json().catch(() => null)) as { detail?: string } | null
          throw new Error(msg?.detail || 'Failed to update username')
        }
        setMe((prev) => (prev ? { ...prev, username: nextUsername } : prev))
      }

      const wantsPasswordChange = Boolean(password) || Boolean(passwordConfirm)
      if (wantsPasswordChange) {
        const res = await fetch(`${API_URL}/users/update-password`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!res.ok) {
          const msg = (await res.json().catch(() => null)) as { detail?: string } | null
          throw new Error(msg?.detail || 'Failed to update password')
        }
        setPassword('')
        setPasswordConfirm('')
      }

      setStatus({ kind: 'ok', msg: 'Saved' })
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box
      sx={{
        p: 3,
        pb: 12,
        minHeight: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 520,
          p: 2,
          borderRadius: 2,
        }}
      >
        <Stack spacing={1} component="form" onSubmit={save}>
          <Typography sx={{ fontWeight: 1100, fontSize: 24, textAlign: 'center' }}>Settings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Update your account details.
          </Typography>
          <Divider sx={{ my: 1 }} />

          {status ? <Alert severity={status.kind === 'ok' ? 'success' : 'error'}>{status.msg}</Alert> : null}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
          />

          <Divider sx={{ my: 1 }} />

          <TextField
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            error={Boolean(passwordConfirm) && password !== passwordConfirm}
            helperText={Boolean(passwordConfirm) && password !== passwordConfirm ? 'Passwords do not match' : ' '}
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

          <Button
            type="submit"
            color="success"
            variant="contained"
            disabled={saveDisabled}
            sx={{ py: 1.25, fontWeight: 900 }}
            fullWidth
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
