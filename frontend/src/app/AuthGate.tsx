import { Box, CircularProgress } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import LoginPage from '../modules/auth/pages/LoginPage'
import { AuthProvider, type Me } from '../shared/authContext'
import { getCurrentUser } from '../shared/auth'

type Status = 'checking' | 'authed' | 'guest'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [me, setMe] = useState<Me | null>(null)

  const checkMe = useCallback(async (): Promise<void> => {
    try {
      const data = (await getCurrentUser()) as Me | null
      if (!data) {
        setMe(null)
        setStatus('guest')
        return
      }
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
