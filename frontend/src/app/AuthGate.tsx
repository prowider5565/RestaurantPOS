import { Box, CircularProgress } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import { API_URL } from '../config/env'
import LoginPage from '../modules/auth/pages/LoginPage'
import { AuthProvider, type Me } from '../shared/authContext'

type Status = 'checking' | 'authed' | 'guest'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [me, setMe] = useState<Me | null>(null)

  const checkMe = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' })
      if (!res.ok) {
        setMe(null)
        setStatus('guest')
        return
      }
      const data = (await res.json()) as Me
      setMe(data)
      setStatus('authed')
    } catch {
      setMe(null)
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

  return (
    <AuthProvider value={{ me, refreshMe: checkMe }}>
      {children}
    </AuthProvider>
  )
}
