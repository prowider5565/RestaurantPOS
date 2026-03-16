import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import BarChartIcon from '@mui/icons-material/BarChart'
import {
  AppBar,
  Box,
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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders, logout } from '../../../shared/auth'

type ApiUserSummary = { id: number; username: string; position?: string | null }
type ApiOrderItemRef = { product_id: number; quantity: number }
type ApiOrderRow = {
  id: number
  total_price: number
  created_at: string
  user?: ApiUserSummary
  items: ApiOrderItemRef[]
}
type ApiPage<T> = { items: T[]; total: number; page: number; size: number; pages: number }
type ApiHistoryOverview = { total_orders: number; total_sum: number }
type ApiOrderHistoryResponse = { overview: ApiHistoryOverview; page: ApiPage<ApiOrderRow> }

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
}

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

export default function StatisticsPage() {
  const [stats, setStats] = useState<ApiOrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(12)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        const res = await fetch(`${API_URL}/orders/my-history?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) return
        const data = (await res.json()) as ApiOrderHistoryResponse
        if (cancelled) return
        setStats(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [page, size])

  const rows = useMemo(() => stats?.page.items ?? [], [stats])
  const pages = stats?.page.pages ?? 1
  const overview = stats?.overview ?? { total_orders: 0, total_sum: 0 }

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

          <Stack direction="row" alignItems="center" gap={1} sx={{ color: 'text.secondary' }}>
            <BarChartIcon />
            <Typography sx={{ fontWeight: 900 }}>Statistics</Typography>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Settings" placement="bottom">
              <IconButton
                aria-label="Settings"
                onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'settings' }))}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" placement="bottom">
              <IconButton aria-label="Logout" onClick={logout}>
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
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                    <TableCell sx={{ fontWeight: 900 }}>Order ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>#{o.id}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>
                        {formatMoney(o.total_price)}
                      </TableCell>
                      <TableCell>{formatCreated(o.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {loading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ py: 6, textAlign: 'center', color: 'text.secondary', fontWeight: 800 }}>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : null}
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
            <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
              <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Your Orders</Typography>
                <Typography sx={{ fontWeight: 1000, fontSize: 48, color: 'primary.main' }}>
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(overview.total_sum))}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>so'm total</Typography>
              </Box>

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" alignItems="stretch" divider={<Divider orientation="vertical" flexItem />}>
                  <Box sx={{ flex: 1, pr: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>Total Orders</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>{new Intl.NumberFormat('uz-UZ').format(overview.total_orders)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>Total Sum</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>{formatMoney(overview.total_sum)}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    p: 1.25,
                    textAlign: 'center',
                    bgcolor: 'rgba(255, 152, 0, 0.06)',
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: 'text.secondary', fontSize: 13 }}>
                    Orders shown are only the ones created by your account.
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
