import CloseIcon from '@mui/icons-material/Close'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Box, Button, Dialog, IconButton, Stack, Typography } from '@mui/material'

import { formatMoney } from '../../../shared/utils/formatters'

const MONEY_VALUES = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000]

export default function PosCashbackDialog({
  open,
  totalAmount,
  paidAmount,
  cashback,
  onAddMoney,
  onReset,
  onClose,
}: {
  open: boolean
  totalAmount: number
  paidAmount: number
  cashback: number
  onAddMoney: (value: number) => void
  onReset: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 1000, fontSize: 24 }}>Qaytim</Typography>
          <IconButton aria-label="Yopish" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>Jami: {formatMoney(totalAmount)}</Typography>
          <Typography sx={{ fontWeight: 800 }}>Berildi: {formatMoney(paidAmount)}</Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
            gap: 1.25,
            mb: 2,
          }}
        >
          {MONEY_VALUES.map((value) => (
            <Box
              key={value}
              component="button"
              type="button"
              onClick={() => onAddMoney(value)}
              sx={{
                p: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.5,
                bgcolor: 'background.paper',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: 'warning.main',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.12)',
                },
              }}
            >
              <Box
                component="img"
                src={`/money-images/${value}.png`}
                alt={`${value} so'm`}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 98,
                  objectFit: 'cover',
                  bgcolor: 'background.default',
                }}
              />
            </Box>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 1000, fontSize: 28 }}>Qaytim: {formatMoney(cashback)}</Typography>
          <Button variant="outlined" color="warning" startIcon={<RestartAltIcon />} onClick={onReset}>
            Tozalash
          </Button>
        </Stack>

        <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          Agar qaytim berish kerak bo'lmasa ushbu oynani yopib qo'yishingiz mumkin
        </Typography>
      </Box>
    </Dialog>
  )
}
