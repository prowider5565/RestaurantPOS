import { Box, Button, Card, Divider, Paper, Stack, TextField, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { CashDeskSummary } from '../types'
import { formatInteger } from '../utils'

function formatAmountInput(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function CashDeskSummaryPanel({
  summary,
  summaryLoading,
  summaryError,
  createAmount,
  creating,
  createAmountInt,
  createError,
  cashingOut,
  onCreateAmountChange,
  onCreateTransaction,
  onCashOut,
}: {
  summary: CashDeskSummary
  summaryLoading: boolean
  summaryError: string | null
  createAmount: string
  creating: boolean
  createAmountInt: number | null
  createError: string | null
  cashingOut: boolean
  onCreateAmountChange: (value: string) => void
  onCreateTransaction: (type: 'in' | 'out') => void
  onCashOut: () => void
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 1.5 },
        width: '100%',
        height: { xs: 'fit-content', md: '100%' },
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1.25} sx={{ flex: '0 0 auto' }}>
        <Box sx={{ textAlign: 'center', pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Naqd</Typography>
              <Typography sx={{ fontWeight: 1000, fontSize: 20, color: 'primary.main', lineHeight: 1.2 }}>
                {formatInteger(summary.current_cash_amount)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Kartada</Typography>
              <Typography sx={{ fontWeight: 1000, fontSize: 20, color: 'primary.main', lineHeight: 1.2 }}>
                {formatInteger(summary.current_card_amount)}
              </Typography>
            </Box>
          </Stack>
          {summaryError ? (
            <Typography sx={{ mt: 1, fontSize: 12, color: 'error.main' }}>{summaryError}</Typography>
          ) : summaryLoading ? (
            <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>Yuklanmoqda...</Typography>
          ) : null}
        </Box>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, bgcolor: 'background.paper' }}>
          <Stack direction="row" alignItems="stretch" divider={<Divider orientation="vertical" flexItem />} sx={{ mb: 1 }}>
            <Box sx={{ flex: 1, pr: 1, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 12 }}>
                Bugungi daromad
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 14, color: 'success.main' }}>
                +{formatMoney(summary.total_order_income)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, pl: 1, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 12 }}>
                Bugungi Kirim
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 14, color: 'success.main' }}>
                +{formatMoney(summary.total_misc_income)}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 12 }}>Bugungi xarajatlar</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'error.main' }}>-{formatMoney(summary.total_expense)}</Typography>
          </Box>
        </Box>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 1.25,
        }}
      >
        <TextField
          label="Summani kiriting"
          value={formatAmountInput(createAmount)}
          onChange={(e) => onCreateAmountChange(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
          inputMode="numeric"
          fullWidth
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
            gap: 0.75,
          }}
        >
          <Button
            color="success"
            variant="contained"
            onClick={() => onCreateTransaction('in')}
            sx={{ py: 1.4, borderRadius: 2, fontSize: 14 }}
            fullWidth
            disabled={creating || !createAmountInt}
          >
            + Daromad qo'shish
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => onCreateTransaction('out')}
            sx={{ py: 1.4, borderRadius: 2, fontSize: 14 }}
            fullWidth
            disabled={creating || !createAmountInt}
          >
            - Xarajat qo'shish
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={onCashOut}
            sx={{ py: 1.4, borderRadius: 2, fontSize: 14, gridColumn: { xs: 'auto', sm: '1 / -1' } }}
            fullWidth
            disabled={cashingOut}
          >
            {cashingOut ? 'Ochilmoqda...' : 'Pulni olish'}
          </Button>
        </Box>

        {createError ? (
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 1, borderColor: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.06)' }}>
            <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 12 }}>{createError}</Typography>
          </Paper>
        ) : null}
      </Box>
    </Card>
  )
}
