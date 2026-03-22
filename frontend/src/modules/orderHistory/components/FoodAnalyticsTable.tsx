import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import { Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiFoodAnalyticsRow } from '../types'

export default function FoodAnalyticsTable({
  loading,
  rows,
}: {
  loading: boolean
  rows: ApiFoodAnalyticsRow[]
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
          <RestaurantMenuIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography sx={{ fontWeight: 1000 }}>Ovqatlar savdo analitikasi yo&apos;q</Typography>
          <Typography variant="body2" color="text.secondary">
            Sana oralig&apos;ini o&apos;zgartirib ko&apos;ring.
          </Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 3,
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
            fontSize: '0.75em',
            py: 1.1,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 900 }} align="right">
              #
            </TableCell>
            <TableCell sx={{ fontWeight: 900 }}>Ovqat nomi</TableCell>
            <TableCell sx={{ fontWeight: 900 }} align="right">
              Umumiy sotilgan summa
            </TableCell>
            <TableCell sx={{ fontWeight: 900 }} align="right">
              Sotilgan soni
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.product_id} hover>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {index + 1}
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{row.food_name}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900 }}>
                {formatMoney(row.total_sold_price)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {row.times_sold}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
