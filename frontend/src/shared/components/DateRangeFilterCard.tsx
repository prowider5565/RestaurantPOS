import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'

export type DateRangePreset = 'daily' | 'weekly' | 'monthly' | null

function toYmd(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getPresetRange(preset: Exclude<DateRangePreset, null>) {
  const end = new Date()
  const start = new Date()

  if (preset === 'weekly') start.setDate(end.getDate() - 6)
  if (preset === 'monthly') start.setDate(end.getDate() - 29)

  return {
    fromDate: toYmd(start),
    toDate: toYmd(end),
  }
}

export default function DateRangeFilterCard({
  preset,
  fromDate,
  toDate,
  onPresetChange,
  onDateRangeChange,
  compact = false,
}: {
  preset: DateRangePreset
  fromDate: string
  toDate: string
  onPresetChange: (next: DateRangePreset) => void
  onDateRangeChange: (fromDate: string, toDate: string) => void
  compact?: boolean
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={compact ? 0.75 : 1}
      flexWrap="wrap"
      justifyContent="flex-end"
      sx={[
        compact
          ? {
              '& .MuiToggleButton-root': {
                px: 1,
                py: 0.35,
                minHeight: 32,
                fontSize: 12,
              },
              '& .MuiTextField-root': {
                width: { xs: '100%', sm: 140 },
              },
              '& .MuiInputBase-root': {
                minHeight: 34,
                fontSize: 13,
              },
              '& .MuiInputBase-input': {
                py: 0.7,
              },
              '& .MuiInputLabel-root': {
                fontSize: 12,
              },
            }
          : {},
      ]}
    >
      <ToggleButtonGroup
        exclusive
        value={preset}
        onChange={(_, next: DateRangePreset) => {
          onPresetChange(next)
          if (!next) return
          const range = getPresetRange(next)
          onDateRangeChange(range.fromDate, range.toDate)
        }}
        size="small"
        aria-label="Sana oraliqlari"
      >
        <ToggleButton value="daily">Kunlik</ToggleButton>
        <ToggleButton value="weekly">Haftalik</ToggleButton>
        <ToggleButton value="monthly">Oylik</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        size="small"
        type="date"
        label="Boshlanish"
        value={fromDate}
        onChange={(e) => {
          onPresetChange(null)
          onDateRangeChange(e.target.value, toDate)
        }}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        size="small"
        type="date"
        label="Tugash"
        value={toDate}
        onChange={(e) => {
          onPresetChange(null)
          onDateRangeChange(fromDate, e.target.value)
        }}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  )
}
