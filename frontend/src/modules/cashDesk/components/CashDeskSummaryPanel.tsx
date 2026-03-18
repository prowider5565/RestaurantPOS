import { Box, Button, Card, Divider, Paper, Stack, TextField, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'
import type { CashDeskSummary } from '../types'
import { formatInteger } from '../utils'

export default function CashDeskSummaryPanel({
  summary,
  summaryLoading,
  summaryError,
  createAmount,
  creating,
  createAmountInt,
  createError,
  onCreateAmountChange,
  onCreateTransaction,
}: {
  summary: CashDeskSummary
  summaryLoading: boolean
  summaryError: string | null
  createAmount: string
  creating: boolean
  createAmountInt: number | null
  createError: string | null
  onCreateAmountChange: (value: string) => void
  onCreateTransaction: (type: 'in' | 'out') => void
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: { xs: 3, md: 2 },
        width: '100%',
        height: { xs: 'fit-content', md: '100%' },
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Joriy summa</Typography>
          <Typography sx={{ fontWeight: 1000, fontSize: 48, color: 'primary.main' }}>{formatInteger(summary.current_amount)}</Typography>
          <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>so'm</Typography>
          {summaryError ? (
            <Typography sx={{ mt: 1, fontSize: 12, color: 'error.main' }}>{summaryError}</Typography>
          ) : summaryLoading ? (
            <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>Yuklanmoqda...</Typography>
          ) : null}
        </Box>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, bgcolor: 'background.paper' }}>
          <Stack direction="row" alignItems="stretch" divider={<Divider orientation="vertical" flexItem />} sx={{ mb: 1.5 }}>
            <Box sx={{ flex: 1, pr: 2, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                Buyurtmalardan jami daromad
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                +{formatMoney(summary.total_order_income)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, pl: 2, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                Boshqa jami daromad
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                +{formatMoney(summary.total_misc_income)}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>Jami xarajatlar</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'error.main' }}>-{formatMoney(summary.total_expense)}</Typography>
          </Box>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2, p: 1.5, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 1000, fontSize: 24, lineHeight: 1.1 }}>{createAmount ? formatInteger(createAmount) : '0'}</Typography>
        <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, mt: 0.5 }}>Miqdor</Typography>
      </Paper>

      <TextField
        label="Summani kiriting"
        value={createAmount}
        onChange={(e) => onCreateAmountChange(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
        inputMode="numeric"
        fullWidth
      />

      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
          gap: 1,
        }}
      >
        <Button
          color="success"
          variant="contained"
          onClick={() => onCreateTransaction('in')}
          sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
          fullWidth
          disabled={creating || !createAmountInt}
        >
          + Daromad qo'shish
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onCreateTransaction('out')}
          sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
          fullWidth
          disabled={creating || !createAmountInt}
        >
          - Xarajat qo'shish
        </Button>
      </Box>

      {createError ? (
        <Paper variant="outlined" sx={{ borderRadius: 2, mt: 1.5, p: 1.25, borderColor: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.06)' }}>
          <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 13 }}>{createError}</Typography>
        </Paper>
      ) : null}
    </Card>
  )
}
