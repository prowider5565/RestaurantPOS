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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme()
  const compactLayout = useMediaQuery('(max-width: 1280px), (max-height: 800px)')
  const showDesktopSplit = useMediaQuery(theme.breakpoints.up('md'))
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
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={() => onNavigate('settings')}
                sx={{ width: 36, height: 36, borderRadius: 999, border: '1px solid', borderColor: 'divider' }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={logout}
                sx={{
                  width: 36,
                  height: 36,
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
          p: compactLayout ? 1.25 : 2,
          pb: compactLayout ? 3 : 12,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          flex: 1,
          minBlockSize: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
          height: { xs: 'auto', md: showDesktopSplit ? 'calc(100dvh - 64px)' : 'auto' },
          overflowX: 'hidden',
          overflowY: { xs: 'auto', md: showDesktopSplit ? 'hidden' : 'auto' },
        }}
      >
        <Box sx={{ mb: compactLayout ? 1.25 : 2 }}>
          <DateRangeFilterCard
            preset={preset}
            fromDate={fromDate}
            toDate={toDate}
            compact={compactLayout}
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
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: showDesktopSplit
              ? compactLayout
                ? 'minmax(0, 1fr) 360px'
                : 'minmax(0, 1fr) 570px'
              : '1fr',
            gap: compactLayout ? 1.25 : 2,
            alignItems: { xs: 'start', md: showDesktopSplit ? 'stretch' : 'start' },
            flex: { xs: '0 0 auto', md: showDesktopSplit ? 1 : '0 0 auto' },
            minHeight: 0,
            overflow: { xs: 'visible', md: showDesktopSplit ? 'hidden' : 'visible' },
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              height: { md: showDesktopSplit ? '100%' : 'auto' },
              overflow: { xs: 'visible', md: showDesktopSplit ? 'hidden' : 'visible' },
              display: 'flex',
              flexDirection: 'column',
              gap: compactLayout ? 1 : 2,
            }}
          >
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table
                size="small"
                stickyHeader
                sx={{
                  '& .MuiTableCell-root': {
                    fontSize: compactLayout ? '1em' : '1.3em',
                    py: compactLayout ? 0.8 : 1.1,
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
                  size={compactLayout ? 'medium' : 'large'}
                  page={page}
                  count={pages}
                  onChange={(_, next) => setPage(next)}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: compactLayout ? '1em' : '1.4em',
                      minWidth: compactLayout ? 34 : 45,
                      height: compactLayout ? 34 : 45,
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
              p: compactLayout ? 1.5 : 3,
              width: '100%',
              height: { xs: 'fit-content', md: showDesktopSplit ? '100%' : 'fit-content' },
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
              <Box sx={{ textAlign: 'center', pb: compactLayout ? 1.25 : 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: compactLayout ? 0.5 : 1, fontSize: compactLayout ? 13 : 16 }}>
                  Buyurtmalaringiz
                </Typography>
                <Typography sx={{ fontWeight: 1000, fontSize: compactLayout ? 24 : 48, color: 'primary.main', lineHeight: 1.1 }}>
                  {new Intl.NumberFormat('uz-UZ').format(Math.round(overview.total_sum))}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: compactLayout ? 0.5 : 1, fontSize: compactLayout ? 12 : 14 }}>
                  jami so'm
                </Typography>
              </Box>

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: compactLayout ? 1 : 1.5,
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" alignItems="stretch" divider={<Divider orientation="vertical" flexItem />}>
                  <Box sx={{ flex: 1, pr: compactLayout ? 1 : 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: compactLayout ? 11 : 14 }}>
                      Jami buyurtmalar
                    </Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: compactLayout ? 16 : 22 }}>
                      {new Intl.NumberFormat('uz-UZ').format(overview.total_orders)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: compactLayout ? 1 : 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: compactLayout ? 11 : 14 }}>
                      Jami summa
                    </Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: compactLayout ? 16 : 22 }}>
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
                    p: compactLayout ? 1 : 1.25,
                    textAlign: 'center',
                    bgcolor: 'rgba(255, 152, 0, 0.06)',
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: 'text.secondary', fontSize: compactLayout ? 11 : 13 }}>
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
