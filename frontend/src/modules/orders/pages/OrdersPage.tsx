import { Box, Paper, Stack, Typography } from '@mui/material'

type PublicOrder = { orderNo: number }

const pendingOrders: PublicOrder[] = [
  { orderNo: 1024 },
  { orderNo: 1025 },
  { orderNo: 1026 },
  { orderNo: 1027 },
  { orderNo: 1028 },
  { orderNo: 1029 },
]

const completedOrders: PublicOrder[] = [
  { orderNo: 1018 },
  { orderNo: 1019 },
  { orderNo: 1020 },
  { orderNo: 1021 },
  { orderNo: 1022 },
  { orderNo: 1023 },
]

function OrderCard({
  orderNo,
  variant,
}: {
  orderNo: number
  variant: 'pending' | 'completed'
}) {
  const isPending = variant === 'pending'
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        p: 2.5,
        bgcolor: isPending ? 'warning.light' : 'success.light',
        borderColor: isPending ? 'warning.main' : 'success.main',
      }}
    >
      <Typography sx={{ fontWeight: 1000, fontSize: 40, textAlign: 'center' }}>
        #{orderNo}
      </Typography>
    </Paper>
  )
}

export default function OrdersPage() {
  return (
    <Box sx={{ p: 2, pb: 12 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 1000, fontSize: 22, mb: 2 }}>
            Pending
          </Typography>
          <Stack spacing={2} sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto', pr: 1 }}>
            {pendingOrders.map((o) => (
              <OrderCard key={o.orderNo} orderNo={o.orderNo} variant="pending" />
            ))}
          </Stack>
        </Box>

        <Box sx={{ width: 1, bgcolor: 'divider', justifySelf: 'center', height: 'calc(100vh - 220px)' }} />

        <Box>
          <Typography sx={{ fontWeight: 1000, fontSize: 22, mb: 2 }}>
            Completed
          </Typography>
          <Stack spacing={2} sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto', pr: 1 }}>
            {completedOrders.map((o) => (
              <OrderCard key={o.orderNo} orderNo={o.orderNo} variant="completed" />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

