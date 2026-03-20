import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import {
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
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders, logout } from '../../../shared/auth'
import DateRangeFilterCard, { type DateRangePreset } from '../../../shared/components/DateRangeFilterCard'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import { formatMoney } from '../../../shared/utils/formatters'

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

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

export default function StatisticsPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const today = useMemo(() => toYmd(new Date()), [])
  const [stats, setStats] = useState<ApiOrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(12)
  const [preset, setPreset] = useState<DateRangePreset>('daily')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const hasCompleteRange = preset !== null || (!!fromDate && !!toDate)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!hasCompleteRange) {
        setStats(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('size', String(size))
        if (fromDate) params.set('from_date', fromDate)
        if (toDate) params.set('to_date', toDate)
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
  }, [fromDate, hasCompleteRange, page, size, toDate])

  const rows = useMemo(() => stats?.page.items ?? [], [stats])
  const pages = stats?.page.pages ?? 1
  const overview = stats?.overview ?? { total_orders: 0, total_sum: 0 }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        rightActions={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={() => onNavigate('settings')}
                sx={{ width: 48, height: 48, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={logout}
                sx={{
                  width: 48,
                  height: 48,
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
        }
      />

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
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 360px', lg: 'minmax(0, 1fr) 400px' },
            gap: 2,
            alignItems: { xs: 'start', sm: 'stretch' },
            flex: 1,
            minHeight: 0,
            overflow: { xs: 'visible', sm: 'hidden' },
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              height: { sm: '100%' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" />

              <DateRangeFilterCard
                preset={preset}
                fromDate={fromDate}
                toDate={toDate}
                compact
                onPresetChange={(next) => {
                  setPreset(next)
                  setPage(1)
                }}
                onDateRangeChange={(nextFromDate, nextToDate) => {
                  setFromDate(nextFromDate)
                  setToDate(nextToDate)
                  setPage(1)
                }}
              />
            </Stack>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table
                size="small"
                stickyHeader
                sx={{
                  '& .MuiTableCell-root': {
                    fontSize: '0.9em',
                    py: 1.1,
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 900 }}>Buyurtma ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Jami
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
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
                        Yuklanmoqda...
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
              p: { xs: 3, sm: 2 },
              width: '100%',
              height: { xs: 'fit-content', sm: '100%' },
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Stack spacing={2} sx={{ flex: '0 0 auto' }}>
              <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Buyurtmalaringiz</Typography>
                <Typography sx={{ fontWeight: 1000, fontSize: 48, color: 'primary.main' }}>
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(overview.total_sum))}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>jami so'm</Typography>
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
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                      Jami buyurtmalar
                    </Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>
                      {new Intl.NumberFormat('uz-UZ').format(overview.total_orders)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                      Jami summa
                    </Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>
                      {formatMoney(overview.total_sum)}
                    </Typography>
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
                    Bu yerda faqat sizning hisobingiz yaratgan buyurtmalar ko'rsatiladi.
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
