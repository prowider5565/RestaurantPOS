import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box, IconButton, Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material'

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
  page,
  pages,
  onPageChange,
  onDelete,
}: {
  isAdmin: boolean
  rows: ApiCashDeskTransaction[]
  page: number
  pages: number
  onPageChange: (page: number) => void
  onDelete: (transaction: ApiCashDeskTransaction) => void
}) {
  return (
    <Stack sx={{ flex: 1, minHeight: 0 }} spacing={2}>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 1,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          width: '100%',
          '@media (min-width:900px) and (max-width:1199.95px) and (max-height:768px)': {
            maxHeight: 500,
          },
        }}
      >
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
    </Stack>
  )
}
