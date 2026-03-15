import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  AppBar,
  Box,
  Card,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'

import { logout } from '../../../shared/auth'

type CashTransaction = {
  id: number
  username: string
  amount: number
  type: 'in' | 'out'
  date: string
  note: string
}

type CashDeskSummary = {
  current_amount: number
  total_income: number
  total_order_income: number
  total_misc_income: number
  total_expenses: number
}

type CashDeskResponse = {
  summary: CashDeskSummary
  transactions: CashTransaction[]
}

// Placeholder shape that matches backend response. Replace with API data wiring when ready.
const mockCashDesk: CashDeskResponse = {
  summary: {
    current_amount: 800000,
    total_income: 900000,
    total_order_income: 650000,
    total_misc_income: 250000,
    total_expenses: 100000,
  },
  transactions: [
    {
      id: 1,
      username: 'Admin',
      amount: 500000,
      type: 'in',
      date: '2026-03-15 10:30',
      note: 'Initial cash',
    },
    {
      id: 2,
      username: 'Checkout',
      amount: 250000,
      type: 'in',
      date: '2026-03-15 11:45',
      note: 'Order #1001',
    },
    {
      id: 3,
      username: 'Manager',
      amount: 100000,
      type: 'out',
      date: '2026-03-15 12:00',
      note: 'Supplies expense',
    },
    {
      id: 4,
      username: 'Checkout',
      amount: 150000,
      type: 'in',
      date: '2026-03-15 13:20',
      note: 'Order #1002',
    },
  ],
}

export default function CashDeskPage() {
  const { summary, transactions } = mockCashDesk

  function formatMoney(value: number) {
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Restaurant POS
            </Typography>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Settings" placement="bottom">
              <IconButton
                aria-label="Settings"
                onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'settings' }))}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Logout" placement="bottom">
              <IconButton
                aria-label="Logout"
                onClick={() => logout()}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'error.main',
                    color: 'error.main',
                    bgcolor: 'rgba(211, 47, 47, 0.06)',
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 2,
          pb: 12,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          flex: 1,
          height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
            gap: 2,
            alignItems: { xs: 'start', lg: 'stretch' },
            flex: 1,
            minHeight: 0,
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
          {/* Table on the left */}
          <Box sx={{ minHeight: 0, height: { lg: '100%' }, overflow: 'hidden' }}>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 3, height: '100%', minHeight: 0, overflow: 'auto' }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 900 }}>Username</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{transaction.username}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: transaction.type === 'in' ? 'success.main' : 'error.main',
                          fontWeight: 700,
                        }}
                      >
                        {(transaction.type === 'in' ? '+' : '-') +
                          new Intl.NumberFormat('uz-UZ').format(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: transaction.type === 'in' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            color: transaction.type === 'in' ? 'success.main' : 'error.main',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {transaction.type === 'in' ? 'IN' : 'OUT'}
                        </Box>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Summary card on the right */}
          <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: 'fit-content' }}>
            <Stack spacing={2}>
              {/* Current Amount */}
              <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Current Amount</Typography>
                <Stack direction="row" alignItems="baseline" justifyContent="center" gap={1}>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 1000, fontSize: 32, color: 'primary.main' }}>
                    {new Intl.NumberFormat('uz-UZ').format(Math.round(summary.current_amount))}
                  </Typography>
                </Stack>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>so'm</Typography>
              </Box>

              {/* Income and Expenses */}
              <Box>
                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                    Total Income
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'success.main' }}>
                    +{formatMoney(summary.total_income)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                    Total Order Income
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                    +{formatMoney(summary.total_order_income)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                    Total Misc Income
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                    +{formatMoney(summary.total_misc_income)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                    Total Expenses
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'error.main' }}>
                    -{formatMoney(summary.total_expenses)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
