import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'

import type { ApiCashDeskTransaction } from '../types'
import { formatInteger, formatTransactionDate } from '../utils'

function TransactionTypeBadge({ type }: { type: ApiCashDeskTransaction['transaction_type'] }) {
  const isIncome = type === 'in'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        bgcolor: isIncome ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
        color: isIncome ? 'success.main' : 'error.main',
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {isIncome ? 'KIRIM' : 'CHIQIM'}
    </Box>
  )
}

export default function CashDeskTransactionsTable({
  isAdmin,
  rows,
  loading,
  hasMore,
  onLoadMore,
  onDelete,
}: {
  isAdmin: boolean
  rows: ApiCashDeskTransaction[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDelete: (transaction: ApiCashDeskTransaction) => void
}) {
  return (
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
              onLoadMore()
            }
          }}
        >
          {!loading && rows.length === 0 ? (
            <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
              <Typography sx={{ fontWeight: 900, color: 'text.secondary' }}>Tranzaksiyalar yo'q</Typography>
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
                <TableCell sx={{ fontWeight: 900 }}>Foydalanuvchi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>
                  Miqdor
                </TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Turi</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
                {isAdmin ? (
                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    Amallar
                  </TableCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>{transaction.user?.username ?? '-'}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: transaction.transaction_type === 'in' ? 'success.main' : 'error.main',
                      fontWeight: 700,
                    }}
                  >
                    {(transaction.transaction_type === 'in' ? '+' : '-') + formatInteger(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <TransactionTypeBadge type={transaction.transaction_type} />
                  </TableCell>
                  <TableCell>{formatTransactionDate(transaction.created_at)}</TableCell>
                  {isAdmin ? (
                    <TableCell align="right">
                      <Tooltip title="O'chirish" placement="top">
                        <IconButton
                          aria-label="O'chirish"
                          onClick={() => onDelete(transaction)}
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
                  ) : null}
                </TableRow>
              ))}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 2 }}>
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
