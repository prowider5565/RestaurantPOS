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
import { getAuthHeaders } from '../../../shared/auth'

type Me = {
  id: number
  username: string
  position: string | null
  is_admin: boolean
}

const PROGRAM_NAME_STORAGE_KEY = 'programName'
const DEFAULT_PROGRAM_NAME = 'Restoran Cheki'

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null)

  const [username, setUsername] = useState('')

  const [programName, setProgramName] = useState(DEFAULT_PROGRAM_NAME)
  const [savedProgramName, setSavedProgramName] = useState(DEFAULT_PROGRAM_NAME)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)

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
    if (saving) return true

    const next = username.trim()
    const usernameChanged = Boolean(me) && next !== me!.username

    const wantsPasswordChange = Boolean(password) || Boolean(passwordConfirm)
    if (wantsPasswordChange && (!password || !passwordConfirm)) return true
    if (wantsPasswordChange && password !== passwordConfirm) return true

    const nextProgramName = programName.trim() || DEFAULT_PROGRAM_NAME
    const programNameChanged = nextProgramName !== savedProgramName

    if (programNameChanged) return false
    if (usernameChanged) return false
    if (wantsPasswordChange) return false
    return true
  }, [me, password, passwordConfirm, programName, savedProgramName, saving, username])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saveDisabled) return

    setSaving(true)
    setStatus(null)
    try {
      const nextProgramName = programName.trim() || DEFAULT_PROGRAM_NAME
      const programNameChanged = nextProgramName !== savedProgramName
      if (programNameChanged) {
        localStorage.setItem(PROGRAM_NAME_STORAGE_KEY, nextProgramName)
        setSavedProgramName(nextProgramName)
      }

      const nextUsername = username.trim()
      const usernameChanged = Boolean(me) && nextUsername !== me!.username

      if (usernameChanged) {
        const res = await fetch(`${API_URL}/users/update-username`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: nextUsername }),
        })
        if (!res.ok) {
          const msg = (await res.json().catch(() => null)) as { detail?: string } | null
          throw new Error(msg?.detail || "Foydalanuvchi nomini yangilab bo'lmadi")
        }
        setMe((prev) => (prev ? { ...prev, username: nextUsername } : prev))
      }

      const wantsPasswordChange = Boolean(password) || Boolean(passwordConfirm)
      if (wantsPasswordChange) {
        const res = await fetch(`${API_URL}/users/update-password`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!res.ok) {
          const msg = (await res.json().catch(() => null)) as { detail?: string } | null
          throw new Error(msg?.detail || "Parolni yangilab bo'lmadi")
        }
        setPassword('')
        setPasswordConfirm('')
      }

      setStatus({ kind: 'ok', msg: 'Saqlandi' })
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : "Saqlab bo'lmadi" })
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
          <Typography sx={{ fontWeight: 1100, fontSize: 24, textAlign: 'center' }}>Sozlamalar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Brend va hisob ma'lumotlarini yangilang.
          </Typography>
          <Divider sx={{ my: 1 }} />

          {status ? <Alert severity={status.kind === 'ok' ? 'success' : 'error'}>{status.msg}</Alert> : null}

          <Typography sx={{ fontWeight: 900, mt: 0.5 }}>Brend</Typography>

          <TextField
            label="Dastur nomi"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            helperText="Bu nom cheklarda chop etiladi."
            fullWidth
          />

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button component="label" variant="outlined">
              Logotip yuklash
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFileName(e.target.files?.[0]?.name ?? null)}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {logoFileName ? `Tanlangan: ${logoFileName}` : 'Logotip tanlanmagan'}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Logotip yuklash faqat UI uchun (hali saqlanmaydi).
          </Typography>

          <TextField
            label="Foydalanuvchi nomi"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
          />

          <Divider sx={{ my: 1 }} />

          <TextField
            label="Yangi parol"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            error={Boolean(passwordConfirm) && password !== passwordConfirm}
            helperText={Boolean(passwordConfirm) && password !== passwordConfirm ? 'Parollar mos emas' : ' '}
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

          <Button
            type="submit"
            color="success"
            variant="contained"
            disabled={saveDisabled}
            sx={{ py: 1.25, fontWeight: 900 }}
            fullWidth
          >
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
