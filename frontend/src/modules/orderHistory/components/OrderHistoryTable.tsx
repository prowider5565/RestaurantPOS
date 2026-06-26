import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import HistoryIcon from '@mui/icons-material/History'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiHistoryOverview, ApiOrderRow } from '../types'
import { formatCreated, getOrderTotals } from '../utils'

const LOAD_MORE_OFFSET = 280

function formatMoneyValue(value: number) {
  return formatMoney(value).replace(/\s*so'm$/, '')
}

export function OrderHistoryTable({
  isAdmin,
  loading,
  rows,
  hasMore,
  overview,
  onLoadMore,
  onOpenDetails,
  onDelete,
}: {
  isAdmin: boolean
  loading: boolean
  rows: ApiOrderRow[]
  hasMore: boolean
  overview: ApiHistoryOverview | null
  onLoadMore: () => void
  onOpenDetails: (orderId: number) => void
  onDelete: (orderId: number) => void
}) {

  if (!loading && rows.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          flex: 1,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography sx={{ fontWeight: 1000 }}>Buyurtmalar tarixi yo'q</Typography>
          <Typography variant="body2" color="text.secondary">
            Sana oralig'ini o'zgartiring yoki qidirib ko'ring.
          </Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack sx={{ flex: 1, minHeight: 0, height: '100%' }} spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
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
            if (distanceToBottom <= LOAD_MORE_OFFSET && hasMore && !loading) {
              onLoadMore()
            }
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              '& .MuiTableCell-root': {
                fontSize: '0.7em',
                py: 1.1,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  ID <Typography component="span" sx={{ color: 'info.main', fontWeight: 900, fontSize: 'inherit' }}>({overview?.total_orders ?? 0})</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Xodim</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  To'langan <Typography component="span" sx={{ color: 'success.main', fontWeight: 900, fontSize: 'inherit' }}>({formatMoneyValue(overview?.total_paid_sum ?? 0)})</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Chegirma <Typography component="span" sx={{ color: 'error.main', fontWeight: 900, fontSize: 'inherit' }}>({formatMoneyValue(overview?.total_discount_sum ?? 0)})</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Jami <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 900, fontSize: 'inherit' }}>({formatMoneyValue(overview?.total_net_sum ?? 0)})</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  {isAdmin ? 'Amallar' : 'Tafsilotlar'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((order) => {
                const totals = getOrderTotals(order)
                const username = order.user?.username ?? '-'

                return (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      bgcolor: order.is_debt ? 'rgba(255, 244, 179, 0.45)' : undefined,
                      '&:hover': {
                        bgcolor: order.is_debt ? 'rgba(255, 244, 179, 0.62)' : undefined,
                      },
                    }}
                  >
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {order.id}
                    </TableCell>
                    <TableCell>{username}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatMoneyValue(order.paid_amount ?? 0)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      {formatMoneyValue(totals.discountAmount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatMoneyValue(totals.discountedTotal)}
                    </TableCell>
                    <TableCell>{formatCreated(order.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Tafsilotlar" placement="top">
                          <IconButton
                            aria-label="Tafsilotlar"
                            onClick={() => onOpenDetails(order.id)}
                            sx={{
                              color: 'rgba(0, 0, 0, 0.68)',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 999,
                              width: 40,
                              height: 40,
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {isAdmin ? (
                          <Tooltip title="O'chirish" placement="top">
                            <IconButton
                              aria-label="O'chirish"
                              onClick={() => onDelete(order.id)}
                              sx={{
                                color: 'error.main',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                width: 40,
                                height: 40,
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  )
}

export default OrderHistoryTable
