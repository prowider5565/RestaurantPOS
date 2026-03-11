import { createTheme } from '@mui/material/styles'

const ORANGE = '#F57C00'
const ORANGE_DARK = '#EF6C00'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: ORANGE, dark: ORANGE_DARK },
    background: { default: '#F6F7FB', paper: '#FFFFFF' },
    success: { main: '#2E7D32' },
    error: { main: '#D32F2F' },
    warning: { main: '#FBC02D' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})

