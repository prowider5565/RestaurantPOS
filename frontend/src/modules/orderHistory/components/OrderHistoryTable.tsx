import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import HistoryIcon from '@mui/icons-material/History'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiOrderRow } from '../types'
import { formatCreated, getOrderTotals, getTableTextColor } from '../utils'

const LOAD_MORE_OFFSET = 280

function formatMoneyValue(value: number) {
  return formatMoney(value).replace(/\s*so'm$/, '')
}

export function OrderHistoryTable({
  isAdmin,
  loading,
  rows,
  hasMore,
  onLoadMore,
  onOpenDetails,
  onDelete,
}: {
  isAdmin: boolean
  loading: boolean
  rows: ApiOrderRow[]
  hasMore: boolean
  onLoadMore: () => void
  onOpenDetails: (orderId: number) => void
  onDelete: (orderId: number) => void
}) {
  const totals = rows.reduce(
    (acc, order) => {
      const orderTotals = getOrderTotals(order)
      acc.discountAmount += orderTotals.discountAmount
      acc.waiterFee += order.waiter_fee ? order.waitress_wage : 0
      acc.paidAmount += order.paid_amount ?? 0
      return acc
    },
    { discountAmount: 0, waiterFee: 0, paidAmount: 0 },
  )

  if (!loading && rows.length === 0) {
    return (
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
          borderRadius: 3,
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
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Xodim</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>To'lov turi</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Stol</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Chegirma
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Ofitsiant xizmati
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  To'langan
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Jami
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  {isAdmin ? 'Amallar' : 'Tafsilotlar'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? (
                <TableRow
                  sx={{
                    bgcolor: 'rgba(249, 115, 22, 0.08)',
                    '& .MuiTableCell-root': {
                      fontWeight: 1000,
                    },
                  }}
                >
                  <TableCell colSpan={4}>Jami</TableCell>
                  <TableCell align="right">{formatMoneyValue(totals.discountAmount)}</TableCell>
                  <TableCell align="right">{formatMoneyValue(totals.waiterFee)}</TableCell>
                  <TableCell align="right">{formatMoneyValue(totals.paidAmount)}</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">-</TableCell>
                </TableRow>
              ) : null}
              {rows.map((order) => {
                const totals = getOrderTotals(order)
                const username = order.user?.username ?? '-'
                const paymentType = order.payment_type ?? '-'
                const table = order.order_table
                const finalTotal = totals.discountedTotal + (order.waiter_fee ? order.waitress_wage : 0)

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
                    <TableCell>{paymentType}</TableCell>
                    <TableCell>
                      {table ? (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 1.5,
                            bgcolor: table.table_color,
                            color: getTableTextColor(table.table_color),
                            fontWeight: 1000,
                            minWidth: 76,
                            justifyContent: 'center',
                          }}
                        >
                          Stol {table.table_number}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      {formatMoneyValue(totals.discountAmount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      {order.waiter_fee ? formatMoney(order.waitress_wage) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatMoneyValue(order.paid_amount ?? 0)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      {formatMoneyValue(finalTotal)}
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
                  <TableCell colSpan={10} align="center" sx={{ py: 2 }}>
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
