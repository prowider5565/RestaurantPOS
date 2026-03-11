import { CssBaseline, ThemeProvider } from '@mui/material'
import type { ReactNode } from 'react'

import '../styles/global.css'
import { theme } from '../theme/theme'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

