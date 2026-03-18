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
}: {
  preset: DateRangePreset
  fromDate: string
  toDate: string
  onPresetChange: (next: DateRangePreset) => void
  onDateRangeChange: (fromDate: string, toDate: string) => void
}) {
  return (
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
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
