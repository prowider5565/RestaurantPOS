import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

import type { NewOrderTableForm } from '../types'

const TABLE_COLORS = ['#FFE5B4', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#BDB2FF', '#FBCFE8', '#D6D3D1']

function getTableTextColor(color: string) {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return '#1F2937'

  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = red * 0.299 + green * 0.587 + blue * 0.114
  return brightness > 186 ? '#1F2937' : '#FFFFFF'
}

export default function PosTableDialog({
  open,
  value,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean
  value: NewOrderTableForm
  onClose: () => void
  onChange: (updater: (prev: NewOrderTableForm) => NewOrderTableForm) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 1000 }}>Stol yaratish</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Stol raqami"
            value={value.tableNumberDigits}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                tableNumberDigits: e.target.value.replaceAll(/[^\d]/g, '').slice(0, 4),
              }))
            }
            inputMode="numeric"
            fullWidth
          />

          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>Rang tanlang</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
              {TABLE_COLORS.map((color) => {
                const selected = value.tableColor === color
                return (
                  <Button
                    key={color}
                    type="button"
                    onClick={() => onChange((prev) => ({ ...prev, tableColor: color }))}
                    sx={{
                      minWidth: 0,
                      height: 44,
                      borderRadius: 2,
                      border: selected ? '2px solid #1F2937' : '1px solid rgba(0,0,0,0.08)',
                      bgcolor: color,
                      color: getTableTextColor(color),
                      '&:hover': {
                        bgcolor: color,
                        opacity: 0.92,
                      },
                    }}
                  >
                    {selected ? <CheckIcon fontSize="small" /> : null}
                  </Button>
                )
              })}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" variant="contained" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button color="success" variant="contained" onClick={onSubmit}>
          Yaratish
        </Button>
      </DialogActions>
    </Dialog>
  )
}
