import HistoryIcon from '@mui/icons-material/History'
import { Box, Button, Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiOrderRow } from '../types'
import { formatCreated, getOrderTotals, getTableTextColor } from '../utils'

export function OrderHistoryTable({
  loading,
  rows,
  page,
  totalPages,
  onPageChange,
  onOpenDetails,
}: {
  loading: boolean
  rows: ApiOrderRow[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOpenDetails: (orderId: number) => void
}) {
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
    <>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, flex: 1, overflow: 'auto' }}>
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
              <TableCell sx={{ fontWeight: 900 }}>Lavozim</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Stol</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">
                Chegirma
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">
                Ofitsiant xizmati
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">
                Jami
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">
                Amallar
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((order) => {
              const totals = getOrderTotals(order)
              const username = order.user?.username ?? '-'
              const position = order.user?.position ?? '-'
              const table = order.order_table
              const finalTotal = totals.discountedTotal + order.waitress_wage

              return (
                <TableRow key={order.id} hover>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    {order.id}
                  </TableCell>
                  <TableCell>{username}</TableCell>
                  <TableCell>{position}</TableCell>
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
                    {formatMoney(totals.discountAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    {formatMoney(order.waitress_wage)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    {formatMoney(finalTotal)}
                  </TableCell>
                  <TableCell>{formatCreated(order.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" onClick={() => onOpenDetails(order.id)}>
                      Tafsilotlar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 ? (
        <Stack direction="row" justifyContent="flex-end">
          <Pagination
            color="primary"
            size="large"
            page={page}
            count={totalPages}
            onChange={(_, next) => onPageChange(next)}
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
    </>
  )
}

export default OrderHistoryTable
