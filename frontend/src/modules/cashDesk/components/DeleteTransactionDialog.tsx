import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography } from '@mui/material'

import type { ApiCashDeskTransaction } from '../types'
import { formatInteger } from '../utils'

export default function DeleteTransactionDialog({
  open,
  transaction,
  deleting,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean
  transaction: ApiCashDeskTransaction | null
  deleting: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 1000 }}>Tranzaksiyani o'chirish</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {transaction ? `#${transaction.id} tranzaksiyasini o'chirasizmi?` : "Ushbu tranzaksiyani o'chirasizmi?"}
          </Typography>
          {transaction ? (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography sx={{ fontWeight: 900 }}>Miqdor</Typography>
                <Typography sx={{ fontWeight: 1000 }}>
                  {(transaction.transaction_type === 'in' ? '+' : '-') + formatInteger(transaction.amount)}
                </Typography>
              </Stack>
            </Paper>
          ) : null}
          {error ? <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 13 }}>{error}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={deleting}>
          Bekor qilish
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={!transaction || deleting}>
          {deleting ? "O'chirilmoqda..." : "O'chirish"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
