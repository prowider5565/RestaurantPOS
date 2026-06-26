import {
  Box,
  Card,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  const [preset, setPreset] = useState<DateRangePreset>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const hasCompleteRange = preset !== null || (!!fromDate && !!toDate)
  const excludeDebtFromTotalSum = fromDate === today && toDate === today

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
        if (preset !== 'all') {
          if (fromDate) params.set('from_date', fromDate)
          if (toDate) params.set('to_date', toDate)
        }
        if (excludeDebtFromTotalSum) params.set('exclude_debt_from_total_sum', 'true')
        const res = await fetch(`${API_URL}/orders/my-history?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) return
        const data = (await res.json()) as ApiOrderHistoryResponse
        if (cancelled) return
        setStats((prev) => {
          if (page <= 1 || !prev) return data
          return {
            ...data,
            page: {
              ...data.page,
              items: [...prev.page.items, ...data.page.items],
            },
          }
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [excludeDebtFromTotalSum, fromDate, hasCompleteRange, page, preset, size, toDate])

  const rows = useMemo(() => stats?.page.items ?? [], [stats])
  const hasMore = stats ? stats.page.page < stats.page.pages : false
  const overview = stats?.overview ?? { total_orders: 0, total_sum: 0 }
  const loadNextPage = useCallback(() => {
    if (loading || !stats || stats.page.page >= stats.page.pages) return
    setPage(stats.page.page + 1)
  }, [loading, stats])

  return (
    <Box sx={{ height: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        onSettings={() => onNavigate('settings')}
        onLogout={logout}
      />

      <Box
        sx={{
          p: 2,
          pb: 0,
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          minHeight: 0,
          flex: 1,
          height: '100%',
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
              height: '100%',
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

            <Stack sx={{ flex: 1, minHeight: 0, height: '100%' }} spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  flex: 1,
                  height: '100%',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: '100%',
                    minHeight: 0,
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    width: '100%',
                  }}
                  onScroll={(e) => {
                    const node = e.currentTarget
                    const distanceToBottom = node.scrollHeight - node.scrollTop - node.clientHeight
                    if (distanceToBottom <= 280 && hasMore && !loading) {
                      loadNextPage()
                    }
                  }}
                >
                  {loading && rows.length === 0 ? (
                    <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
                      <Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>Yuklanmoqda...</Typography>
                    </Box>
                  ) : null}
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
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                            Yuklanmoqda...
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Stack>
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
