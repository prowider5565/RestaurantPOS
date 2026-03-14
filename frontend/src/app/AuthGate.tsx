import { Box, CircularProgress } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import { API_URL } from '../config/env'
import LoginPage from '../modules/auth/pages/LoginPage'

type Status = 'checking' | 'authed' | 'guest'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')

  const checkMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' })
      setStatus(res.ok ? 'authed' : 'guest')
    } catch {
      setStatus('guest')
    }
  }, [])

  useEffect(() => {
    checkMe()
  }, [checkMe])

  useEffect(() => {
    const onAuthChanged = () => checkMe()
    window.addEventListener('auth:changed', onAuthChanged)
    return () => window.removeEventListener('auth:changed', onAuthChanged)
  }, [checkMe])

  if (status === 'checking') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (status === 'guest') {
    return <LoginPage onSuccess={checkMe} />
  }

  return <>{children}</>
}
