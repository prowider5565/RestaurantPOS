import CloseIcon from '@mui/icons-material/Close'
import FastfoodIcon from '@mui/icons-material/Fastfood'
import HistoryIcon from '@mui/icons-material/History'
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SearchIcon from '@mui/icons-material/Search'
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'

import { orderHistory, type OrderHistoryRow, type OrderItem } from '../mock'

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseCreatedDate(createdAt: string) {
  const ymd = createdAt.slice(0, 10)
  const time = createdAt.slice(11, 16)
  const [y, m, d] = ymd.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

function calcTotal(items: OrderItem[]) {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
}

function countTypes(items: OrderItem[], kind: 'food' | 'drink') {
  const names = new Set(items.filter((i) => i.kind === kind).map((i) => i.name))
  return names.size
}

function PayTypeChip({ payType }: { payType: OrderHistoryRow['payType'] }) {
  if (payType === 'hold') return <Chip label="On hold" color="warning" size="small" />
  return <Chip label="Pay now" color="success" size="small" />
}

function DetailsDialog({
  open,
  onClose,
  order,
}: {
  open: boolean
  onClose: () => void
  order: OrderHistoryRow | null
}) {
  if (!order) return null

  const total = calcTotal(order.items)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 1000 }}>Order #{order.orderNo}</Typography>
          <Typography variant="body2" color="text.secondary">
            ID {order.id} • {order.createdAt}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <PayTypeChip payType={order.payType} />
          <Typography sx={{ fontWeight: 1000 }}>Total: {formatMoney(total)}</Typography>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <List dense disablePadding>
            {order.items.map((i) => (
              <ListItem key={i.id} divider>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 900 }}>{i.name}</Typography>}
                  secondary={`${i.kind.toUpperCase()} • ${i.qty} × ${formatMoney(i.unitPrice)}`}
                />
                <Typography sx={{ fontWeight: 1000 }}>{formatMoney(i.qty * i.unitPrice)}</Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      </DialogContent>
    </Dialog>
  )
}

export default function OrderHistoryPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OrderHistoryRow | null>(null)
  const [preset, setPreset] = useState<'daily' | 'weekly' | 'monthly' | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orderHistory.filter((o) => {
      const created = parseCreatedDate(o.createdAt)
      if (fromDate) {
        const start = new Date(fromDate + 'T00:00:00')
        if (!created || created < start) return false
      }
      if (toDate) {
        const end = new Date(toDate + 'T23:59:59')
        if (!created || created > end) return false
      }
      if (!q) return true
      const orderNoMatch = String(o.orderNo).includes(q)
      const idMatch = String(o.id).includes(q)
      return idMatch || orderNoMatch
    })
  }, [fromDate, search, toDate])

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

  function exportToExcelCsv() {
    const header = ['ID', 'Order Number', 'Food Types', 'Drink Types', 'Pay Type', 'Total Price', 'Date Created']
    const lines = rows.map((o) => {
      const foodTypes = countTypes(o.items, 'food')
      const drinkTypes = countTypes(o.items, 'drink')
      const payTypeLabel = o.payType === 'hold' ? 'On hold' : 'Pay now'
      const total = calcTotal(o.items)
      return [
        o.id,
        o.orderNo,
        foodTypes,
        drinkTypes,
        payTypeLabel,
        total.toFixed(2),
        o.createdAt,
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(',')
    })

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-history-${toYmd(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Restaurant POS
            </Typography>
          </Stack>

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            placeholder="Search orders..."
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 2,
          pb: 12,
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={exportToExcelCsv}>
            Export to Excel
          </Button>

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

        {rows.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              flex: 1,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography sx={{ fontWeight: 1000 }}>No order history</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting the date range or search.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 3, flex: 1, overflow: 'auto' }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Types</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Pay type</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    Total
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Date created</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((o) => {
                  const total = calcTotal(o.items)
                  const foodTypes = countTypes(o.items, 'food')
                  const drinkTypes = countTypes(o.items, 'drink')
                  return (
                    <TableRow key={o.id} hover>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>
                        {o.id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>#{o.orderNo}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <FastfoodIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography sx={{ fontWeight: 1000 }}>{foodTypes}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <LocalCafeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography sx={{ fontWeight: 1000 }}>{drinkTypes}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <PayTypeChip payType={o.payType} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 1000 }}>
                        {formatMoney(total)}
                      </TableCell>
                      <TableCell>{o.createdAt}</TableCell>
                      <TableCell align="right">
                        <Button variant="outlined" onClick={() => setSelected(o)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <DetailsDialog open={Boolean(selected)} onClose={() => setSelected(null)} order={selected} />
    </Box>
  )
}
