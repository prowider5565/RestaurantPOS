import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

import { API_URL } from '../../../config/env'

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
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

