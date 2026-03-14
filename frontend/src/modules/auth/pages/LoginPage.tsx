import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { API_URL } from '../../../config/env'

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submitDisabled = loading || !username.trim() || !password

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitDisabled) return

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ username, password })
      const res = await fetch(`${API_URL}/users/login?${params.toString()}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { detail?: string } | null
        throw new Error(msg?.detail || 'Login failed')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 3,
          backdropFilter: 'blur(6px)',
          bgcolor: 'rgba(255,255,255,0.9)',
        }}
      >
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Box sx={{ display: 'grid', placeItems: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(245, 124, 0, 0.12)',
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <RestaurantMenuIcon sx={{ color: 'primary.main', fontSize: 30 }} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 900, textAlign: 'center' }}>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Sign in to continue.
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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

          <Button
            type="submit"
            color="success"
            variant="contained"
            disabled={submitDisabled}
            sx={{ py: 1.25, fontWeight: 900 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
