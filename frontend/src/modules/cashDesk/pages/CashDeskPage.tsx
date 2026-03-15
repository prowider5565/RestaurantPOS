import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  AppBar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'

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

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CashDeskPage() {
  const { summary, transactions } = mockCashDesk

  const [preset, setPreset] = useState<'daily' | 'weekly' | 'monthly' | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [createAmount, setCreateAmount] = useState<string>('')
  const [page, setPage] = useState(1)
  const [size] = useState(10)

  function formatMoney(value: number) {
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
  }

  function applyPreset(next: 'daily' | 'weekly' | 'monthly' | null) {
    setPreset(next)
    if (!next) return
    const end = new Date()
    const start = new Date()
    if (next === 'daily') start.setDate(end.getDate())
    if (next === 'weekly') start.setDate(end.getDate() - 6)
    if (next === 'monthly') start.setDate(end.getDate() - 29)
    setFromDate(toYmd(start))
    setToDate(toYmd(end))
  }

  function exportSnapshot() {
    // Backend-driven export will be wired here.
  }

  function addIncome() {
    // Backend-driven create will be wired here.
    console.log('add income', createAmount)
    setCreateAmount('')
  }

  function addExpense() {
    // Backend-driven create will be wired here.
    console.log('add expense', createAmount)
    setCreateAmount('')
  }

  function deleteTransactionRow(id: number) {
    // Backend-driven delete will be wired here.
    console.log('delete cash transaction', id)
  }

  function addNumpadDigit(digit: string) {
    setCreateAmount((prev) => {
      const next = (prev + digit).replace(/^0+(?=\d)/, '')
      return next
    })
  }

  function numpadBackspace() {
    setCreateAmount((prev) => prev.slice(0, -1))
  }

  function numpadClear() {
    setCreateAmount('')
  }

  const pages = Math.max(1, Math.ceil(transactions.length / size))
  const pagedTransactions = transactions.slice((page - 1) * size, (page - 1) * size + size)

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
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 570px' },
            gap: 2,
            alignItems: { xs: 'start', lg: 'stretch' },
            flex: 1,
            minHeight: 0,
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
          {/* Table on the left */}
          <Box
            sx={{
              minHeight: 0,
              height: { lg: '100%' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={exportSnapshot}>
                  Export snapshot
                </Button>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
                <ToggleButtonGroup
                  exclusive
                  value={preset}
                  onChange={(_, next) => applyPreset(next)}
                  size="small"
                  aria-label="Date presets"
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={fromDate}
                  onChange={(e) => {
                    setPreset(null)
                    setFromDate(e.target.value)
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={toDate}
                  onChange={(e) => {
                    setPreset(null)
                    setToDate(e.target.value)
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Stack>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 3, flex: 1, minHeight: 0, overflow: 'auto' }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  '& .MuiTableCell-root': {
                    fontSize: '1.3em',
                    py: 1.1,
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 900 }}>Username</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedTransactions.map((transaction) => (
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
                      <TableCell align="right">
                        <Tooltip title="Delete" placement="top">
                          <IconButton
                            aria-label="Delete"
                            onClick={() => deleteTransactionRow(transaction.id)}
                            sx={{
                              color: 'error.main',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              width: 52,
                              height: 52,
                              '& .MuiSvgIcon-root': { fontSize: 32 },
                            }}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {pages > 1 ? (
              <Stack direction="row" justifyContent="flex-end">
                <Pagination
                  color="primary"
                  size="large"
                  page={page}
                  count={pages}
                  onChange={(_, next) => setPage(next)}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: '1.4em',
                      minWidth: 45,
                      height: 45,
                    },
                  }}
                />
              </Stack>
            ) : null}
          </Box>

          {/* Summary card on the right */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 3,
              width: '100%',
              height: { xs: 'fit-content', lg: '100%' },
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Stack spacing={2}>
              {/* Current Amount */}
              <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Current Amount</Typography>
                <Typography sx={{ fontWeight: 1000, fontSize: 48, color: 'primary.main' }}>
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(summary.current_amount))}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>so'm</Typography>
              </Box>

              {/* Income and Expenses */}
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: 'background.paper',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="stretch"
                  divider={<Divider orientation="vertical" flexItem />}
                  sx={{ mb: 1.5 }}
                >
                  <Box sx={{ flex: 1, pr: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                      Total Order Income
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                      +{formatMoney(summary.total_order_income)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                      Total Misc Income
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                      +{formatMoney(summary.total_misc_income)}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                    Total Expenses
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'error.main' }}>
                    -{formatMoney(summary.total_expenses)}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                mt: 2,
                borderRadius: 2,
                p: 1.5,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 1000, fontSize: 24, lineHeight: 1.1 }}>
                {createAmount ? new Intl.NumberFormat('uz-UZ').format(Number(createAmount)) : '0'}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, mt: 0.5 }}>Amount</Typography>
            </Paper>

            <Box
              sx={{
                pt: 2,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              <Button variant="outlined" onClick={() => addNumpadDigit('1')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                1
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('2')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                2
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('3')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                3
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('4')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                4
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('5')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                5
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('6')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                6
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('7')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                7
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('8')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                8
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('9')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                9
              </Button>
              <Button variant="outlined" onClick={numpadClear} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                C
              </Button>
              <Button variant="outlined" onClick={() => addNumpadDigit('0')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                0
              </Button>
              <Button variant="outlined" onClick={numpadBackspace} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
                Del
              </Button>
            </Box>

            <Box
              sx={{
                mt: 'auto',
                pt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
                gap: 1,
              }}
            >
              <Button
                color="success"
                variant="contained"
                onClick={addIncome}
                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                fullWidth
              >
                + Add income
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={addExpense}
                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                fullWidth
              >
                - Add expense
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
