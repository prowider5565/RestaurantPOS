import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'

import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import { logout } from '../../../shared/auth'

type StatTab = 'uptime' | 'finance' | 'products'

const TABS: { value: StatTab; label: string }[] = [
  { value: 'uptime', label: 'Dastur faoliyati' },
  { value: 'finance', label: 'Moliyaviy analitika' },
  { value: 'products', label: 'Mahsulotlar analitikasi' },
]

const MOCK_DAILY_HOURS = [
  { day: 1, hours: 2 },
  { day: 2, hours: 7 },
  { day: 3, hours: 0 },
  { day: 4, hours: 111 },
  { day: 5, hours: 5 },
  { day: 6, hours: 9 },
  { day: 7, hours: 0 },
  { day: 8, hours: 14 },
  { day: 9, hours: 3 },
  { day: 10, hours: 8 },
  { day: 11, hours: 12 },
  { day: 12, hours: 1 },
  { day: 13, hours: 6 },
  { day: 14, hours: 0 },
  { day: 15, hours: 10 },
  { day: 16, hours: 4 },
  { day: 17, hours: 13 },
  { day: 18, hours: 7 },
  { day: 19, hours: 11 },
  { day: 20, hours: 0 },
  { day: 21, hours: 9 },
  { day: 22, hours: 5 },
  { day: 23, hours: 12 },
  { day: 24, hours: 2 },
  { day: 25, hours: 8 },
  { day: 26, hours: 10 },
  { day: 27, hours: 0 },
  { day: 28, hours: 6 },
  { day: 29, hours: 14 },
  { day: 30, hours: 3 },
]

const MOCK_UPTIME_WINDOWS: { start: number; end: number }[] = [
  { start: 10, end: 12 },
  { start: 13, end: 15 },
  { start: 15.5, end: 17 },
  { start: 18, end: 20 },
  { start: 21, end: 23 },
]

const MOCK_WINDOWS_BY_DAY: Record<number, { start: number; end: number }[]> = {
  1: [{ start: 14, end: 16 }],
  2: [{ start: 9, end: 11 }, { start: 13, end: 15 }],
  3: [],
  4: [{ start: 8, end: 10.5 }, { start: 11, end: 14 }, { start: 15, end: 17 }],
  5: [{ start: 10, end: 12 }, { start: 14, end: 15 }],
  6: [{ start: 9, end: 12 }, { start: 13, end: 14.5 }],
  7: [],
  8: [{ start: 7, end: 9.5 }, { start: 10, end: 12 }, { start: 13, end: 15.5 }, { start: 16, end: 18 }],
  9: [{ start: 12, end: 13 }, { start: 14, end: 15 }],
  10: [{ start: 9, end: 11 }, { start: 12, end: 14 }],
  11: [{ start: 8, end: 10 }, { start: 11, end: 13 }, { start: 14, end: 16 }],
  12: [{ start: 15, end: 16 }],
  13: [{ start: 10, end: 12 }, { start: 13, end: 14 }],
  14: [],
  15: [{ start: 9, end: 11 }, { start: 12, end: 14 }],
  16: [{ start: 11, end: 13 }],
  17: [{ start: 8, end: 10 }, { start: 11, end: 13.5 }, { start: 14, end: 16 }],
  18: [{ start: 9, end: 11 }, { start: 12, end: 13 }],
  19: [{ start: 8, end: 10 }, { start: 11, end: 13 }, { start: 14, end: 15 }],
  20: [],
  21: [{ start: 10, end: 12 }, { start: 13, end: 15 }],
  22: [{ start: 14, end: 16 }],
  23: [{ start: 8, end: 10 }, { start: 11, end: 13 }, { start: 14, end: 16 }],
  24: [{ start: 15, end: 16 }],
  25: [{ start: 9, end: 11 }, { start: 12, end: 14 }],
  26: [{ start: 10, end: 12 }, { start: 13, end: 15 }],
  27: [],
  28: [{ start: 11, end: 13 }],
  29: [{ start: 7, end: 9.5 }, { start: 10, end: 12 }, { start: 13, end: 15.5 }, { start: 16, end: 18.5 }],
  30: [{ start: 12, end: 13 }, { start: 14, end: 15 }],
}

function HoursBarChart({ data, selectedDay, onDayClick }: { data: { day: number; hours: number }[]; selectedDay: number; onDayClick: (day: number) => void }) {
  const maxHours = 8
  const chartHeight = 180
  const labelHeight = 20

  return (
    <Box sx={{ px: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, height: chartHeight }}>
        {data.map((d) => (
          <Box
            key={d.day}
            onClick={() => onDayClick(d.day)}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 24,
                height: d.hours > 0 ? (d.hours / maxHours) * chartHeight : 0,
                bgcolor: d.day === selectedDay ? 'primary.main' : '#90CAF9',
                borderRadius: '3px 3px 0 0',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'primary.main' },
              }}
            />
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, height: labelHeight }}>
        {data.map((d) => (
          <Typography
            key={d.day}
            onClick={() => onDayClick(d.day)}
            sx={{ flex: 1, minWidth: 0, fontSize: 9, color: d.day === selectedDay ? 'primary.main' : 'text.secondary', fontWeight: d.day === selectedDay ? 700 : 400, textAlign: 'center', lineHeight: `${labelHeight}px`, cursor: 'pointer' }}
          >
            {d.day}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

function formatHour(h: number): string {
  const hour = Math.floor(h)
  const min = Math.round((h - hour) * 60)
  const period = hour < 12 ? 'AM' : 'PM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return min === 0 ? `${display} ${period}` : `${display}:${String(min).padStart(2, '0')} ${period}`
}

function UptimeTimeline({ windows }: { windows: { start: number; end: number }[] }) {
  const hours = Array.from({ length: 25 }, (_, i) => i)
  const rowHeight = 44
  const gap = 6

  return (
    <Box sx={{ position: 'relative', py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        {hours.filter((_, i) => i % 3 === 0).map((h) => (
          <Typography key={h} sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>
            {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: windows.length * rowHeight + Math.max(0, windows.length - 1) * gap,
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        {hours.map((h) => (
          <Box
            key={h}
            sx={{
              position: 'absolute',
              left: `${(h / 24) * 100}%`,
              top: 0,
              bottom: 0,
              width: '1px',
              bgcolor: 'grey.300',
            }}
          />
        ))}

        {windows.map((w, i) => (
          <Box
            key={i}
            title={`${formatHour(w.start)} — ${formatHour(w.end)}`}
            sx={{
              position: 'absolute',
              left: `${(w.start / 24) * 100}%`,
              width: `${((w.end - w.start) / 24) * 100}%`,
              top: i * (rowHeight + gap),
              height: rowHeight,
              bgcolor: 'primary.main',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
              overflow: 'hidden',
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'common.white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatHour(w.start)} — {formatHour(w.end)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function UptimeTab() {
  const [selectedDay, setSelectedDay] = useState(26)
  const windows = MOCK_WINDOWS_BY_DAY[selectedDay] ?? MOCK_UPTIME_WINDOWS

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, flex: '0 0 auto' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 2 }}>Dastur faoliyati</Typography>
        <HoursBarChart data={MOCK_DAILY_HOURS} selectedDay={selectedDay} onDayClick={setSelectedDay} />
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          {(['Oy', 'Hafta', 'Kun', 'Bugun'] as const).map((label) => (
            <Tab
              key={label}
              label={label}
              sx={{
                minHeight: 32,
                py: 0,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: 13,
                bgcolor: label === 'Bugun' ? 'primary.main' : 'grey.100',
                color: label === 'Bugun' ? 'common.white' : 'text.secondary',
                borderRadius: 1,
                '&:hover': { bgcolor: label === 'Bugun' ? 'primary.dark' : 'grey.200' },
              }}
            />
          ))}
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1 }}>{selectedDay} Iyun</Typography>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <UptimeTimeline windows={windows} />
        </Box>
      </Box>
    </Stack>
  )
}

export default function StatisticsPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const [activeTab, setActiveTab] = useState<StatTab>('uptime')

  return (
    <Box sx={{ height: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        onSettings={() => onNavigate('settings')}
        onLogout={logout}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: StatTab) => setActiveTab(value)}
          sx={{
            minHeight: 44,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 2,
            '& .MuiTabs-flexContainer': {
              justifyContent: 'space-between',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              flex: 1,
              minHeight: 44,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: 14,
              textAlign: 'center',
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
          {activeTab === 'uptime' && <UptimeTab />}
          {activeTab === 'finance' && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Moliyaviy analitika</Typography>
            </Box>
          )}
          {activeTab === 'products' && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Mahsulotlar analitikasi</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
