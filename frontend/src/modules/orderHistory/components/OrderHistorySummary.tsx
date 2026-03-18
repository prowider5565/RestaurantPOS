import { Paper, Stack, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiHistoryOverview } from '../types'

export default function OrderHistorySummary({ overview }: { overview: ApiHistoryOverview | null | undefined }) {
  return (
    <Stack
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 1.5,
      }}
    >
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <Typography sx={{ fontWeight: 900, color: 'text.secondary', fontSize: 13 }}>Jami buyurtmalar</Typography>
        <Typography sx={{ fontWeight: 1100, fontSize: 28, mt: 0.25 }}>{overview?.total_orders ?? 0}</Typography>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <Typography sx={{ fontWeight: 900, color: 'text.secondary', fontSize: 13 }}>Jami daromad</Typography>
        <Stack spacing={0} sx={{ mt: 0.25, lineHeight: 1.1 }}>
          <Typography sx={{ fontWeight: 900, textDecoration: 'line-through', color: 'text.secondary' }}>
            {formatMoney(overview?.total_sum ?? 0)}
          </Typography>
          <Typography sx={{ fontWeight: 1100, fontSize: 24 }}>{formatMoney(overview?.total_net_sum ?? 0)}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <Typography sx={{ fontWeight: 900, color: 'text.secondary', fontSize: 13 }}>Jami chegirma</Typography>
        <Typography sx={{ fontWeight: 1100, fontSize: 28, mt: 0.25 }}>{formatMoney(overview?.total_discount_sum ?? 0)}</Typography>
      </Paper>
    </Stack>
  )
}
