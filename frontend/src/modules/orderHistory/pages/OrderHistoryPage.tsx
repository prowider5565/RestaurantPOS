import CloseIcon from '@mui/icons-material/Close'
import FastfoodIcon from '@mui/icons-material/Fastfood'
import HistoryIcon from '@mui/icons-material/History'
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
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
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { logout } from '../../../shared/auth'

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type ApiOrderItemRef = { product_id: number; quantity: number }
type ApiProductSummary = {
  id: number
  name: string
  price: number
  image_path?: string | null
}
type ApiOrderItemDetail = { product: ApiProductSummary; quantity: number }
type ApiOrderRow = {
  id: number
  total_price: number
  status: 'Pending' | 'Completed'
  created_at: string
  items: ApiOrderItemRef[]
  user?: { id: number; username: string; position?: string | null }
}
type ApiOrderDetail = Omit<ApiOrderRow, 'items'> & { items: ApiOrderItemDetail[] }
type ApiPage<T> = { items: T[]; total: number; page: number; size: number; pages: number }
type ApiHistoryOverview = { total_orders: number; total_sum: number }
type ApiOrderHistoryResponse = { overview: ApiHistoryOverview; page: ApiPage<ApiOrderRow> }

function formatCreated(createdAtIso: string) {
  const d = new Date(createdAtIso)
  if (Number.isNaN(d.getTime())) return createdAtIso
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function countFoodTypes(items: ApiOrderItemRef[]) {
  return new Set(items.map((i) => i.product_id)).size
}

function PayTypeChip({ status }: { status: ApiOrderRow['status'] }) {
  if (status === 'Pending') return <Chip label="On hold" color="warning" size="small" />
  return <Chip label="Pay now" color="success" size="small" />
}

function toImageSrc(raw?: string | null) {
  if (!raw) return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'

  const trimmed = raw.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')

  const mediaMarker = '/media/'
  const mediaIdx = normalized.lastIndexOf(mediaMarker)
  if (mediaIdx !== -1) {
    const tail = normalized.slice(mediaIdx)
    return `${API_URL}${tail}`
  }

  const productsMarker = '/products/'
  const productsIdx = normalized.lastIndexOf(productsMarker)
  if (productsIdx !== -1) {
    const filename = normalized.slice(productsIdx + productsMarker.length)
    return `${API_URL}/media/products/${filename}`
  }

  const filename = normalized.split('/').filter(Boolean).at(-1)
  if (filename) return `${API_URL}/media/products/${filename}`

  return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'
}

function DetailsDialog({
  open,
  onClose,
  orderId,
}: {
  open: boolean
  onClose: () => void
  orderId: number | null
}) {
  const [order, setOrder] = useState<ApiOrderDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!open || !orderId) return
      setOrder(null)
      const res = await fetch(`${API_URL}/orders/${orderId}`)
      if (!res.ok) return
      const data = (await res.json()) as ApiOrderDetail
      if (cancelled) return
      setOrder(data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!open) return null

  const total = order?.total_price ?? 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 1000 }}>
            {order ? `Order #${order.id}` : 'Order'}
          </Typography>
          {order && (
            <Typography variant="body2" color="text.secondary">
              ID {order.id} • {formatCreated(order.created_at)}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          {order && <PayTypeChip status={order.status} />}
          <Typography sx={{ fontWeight: 1000 }}>Total: {formatMoney(total)}</Typography>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <List dense disablePadding>
            {(order?.items ?? []).map((i) => {
              const lineTotal = i.product.price * i.quantity
              return (
                <ListItem key={`${order?.id ?? 'o'}-${i.product.id}`} divider sx={{ py: 1.25 }}>
                  <Box
                    component="img"
                    src={toImageSrc(i.product.image_path ?? null)}
                    alt={i.product.name}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: 'divider',
                      objectFit: 'cover',
                      bgcolor: 'background.paper',
                      mr: 1.5,
                      flex: '0 0 auto',
                    }}
                  />
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 900 }}>{i.product.name}</Typography>}
                    secondary={`× ${i.quantity} • ${formatMoney(i.product.price)}`}
                  />
                  <Typography sx={{ fontWeight: 1000 }}>{formatMoney(lineTotal)}</Typography>
                </ListItem>
              )
            })}
          </List>
        </Paper>
      </DialogContent>
    </Dialog>
  )
}

export default function OrderHistoryPage() {
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [preset, setPreset] = useState<'daily' | 'weekly' | 'monthly' | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [size] = useState(12)
  const [history, setHistory] = useState<ApiOrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (fromDate) params.set('from_date', fromDate)
        if (toDate) params.set('to_date', toDate)

        const res = await fetch(`${API_URL}/orders/history?${params.toString()}`)
        if (!res.ok) return
        const data = (await res.json()) as ApiOrderHistoryResponse
        if (cancelled) return
        setHistory(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [fromDate, page, size, toDate])

  const rows = useMemo(() => {
    const items = history?.page.items ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((o) => String(o.id).includes(q))
  }, [history?.page.items, search])

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
    setPage(1)
  }

  function exportToExcelCsv() {
    const header = ['ID', 'Username', 'Position', 'Food Types', 'Drink Types', 'Pay Type', 'Total Price', 'Date Created']
    const lines = rows.map((o) => {
      const foodTypes = countFoodTypes(o.items)
      const drinkTypes = 0
      const payTypeLabel = o.status === 'Pending' ? 'On hold' : 'Pay now'
      const total = o.total_price
      const username = o.user?.username ?? '-'
      const position = o.user?.position ?? '-'
      return [
        o.id,
        username,
        position,
        foodTypes,
        drinkTypes,
        payTypeLabel,
        total.toFixed(2),
        formatCreated(o.created_at),
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
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={exportToExcelCsv} disabled={rows.length === 0}>
              Export to Excel
            </Button>
            <Chip
              label={`Orders: ${history?.overview.total_orders ?? 0}`}
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />
            <Chip
              label={`Sum: ${formatMoney(history?.overview.total_sum ?? 0)}`}
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />
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
                setPage(1)
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
                setPage(1)
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>

        {!loading && rows.length === 0 ? (
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
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Types</TableCell>
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
                  const total = o.total_price
                  const foodTypes = countFoodTypes(o.items)
                  const drinkTypes = 0
                  const username = o.user?.username ?? '-'
                  const position = o.user?.position ?? '-'
                  return (
                    <TableRow key={o.id} hover>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>
                        {o.id}
                      </TableCell>
                      <TableCell>{username}</TableCell>
                      <TableCell>{position}</TableCell>
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
                      <TableCell align="right" sx={{ fontWeight: 1000 }}>
                        {formatMoney(total)}
                      </TableCell>
                      <TableCell>{formatCreated(o.created_at)}</TableCell>
                      <TableCell align="right">
                        <Button variant="outlined" onClick={() => setSelectedOrderId(o.id)}>
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

        {history?.page.pages && history.page.pages > 1 && (
          <Stack direction="row" justifyContent="flex-end">
            <Pagination
              color="primary"
              size="large"
              page={page}
              count={history.page.pages}
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
        )}
      </Box>

      <DetailsDialog open={Boolean(selectedOrderId)} onClose={() => setSelectedOrderId(null)} orderId={selectedOrderId} />
    </Box>
  )
}
