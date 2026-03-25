import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

export default function DeleteOrderDialog({
  open,
  orderId,
  deleting,
  error,
  password,
  onPasswordChange,
  onClose,
  onConfirm,
}: {
  open: boolean
  orderId: number | null
  deleting: boolean
  error: string | null
  password: string
  onPasswordChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 1000 }}>Buyurtmani o'chirish</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {orderId ? `#${orderId} buyurtmasini o'chirasizmi?` : "Ushbu buyurtmani o'chirasizmi?"}
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Parol"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={deleting}
          />
          {error ? <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 13 }}>{error}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={deleting}>
          Bekor qilish
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={!orderId || deleting || !password.trim()}>
          {deleting ? "O'chirilmoqda..." : "O'chirish"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
