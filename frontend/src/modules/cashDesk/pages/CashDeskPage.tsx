import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import {
  Box,
  Card,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'

type CashTransaction = {
  id: number
  username: string
  amount: number
  type: 'in' | 'out'
  date: string
  note: string
}

// Mock data - replace with API call when backend is ready
const mockTransactions: CashTransaction[] = [
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
]

export default function CashDeskPage() {
  const summary = useMemo(() => {
    const totalIncome = mockTransactions
      .filter((t) => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = mockTransactions
      .filter((t) => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0)

    const currentAmount = totalIncome - totalExpenses

    return { currentAmount, totalIncome, totalExpenses }
  }, [])

  function formatMoney(value: number) {
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2, pb: 12 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 2, alignItems: 'start' }}>
        {/* Table on the left */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small">
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
              {mockTransactions.map((transaction) => (
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

        {/* Summary card on the right */}
        <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: 'fit-content' }}>
          <Stack spacing={2}>
            {/* Current Amount */}
            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Current Amount</Typography>
              <Stack direction="row" alignItems="baseline" justifyContent="center" gap={1}>
                <AttachMoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography sx={{ fontWeight: 1000, fontSize: 32, color: 'primary.main' }}>
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(summary.currentAmount))}
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
                  +{formatMoney(summary.totalIncome)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                  Total Expenses
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'error.main' }}>
                  -{formatMoney(summary.totalExpenses)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Box>
  )
}
