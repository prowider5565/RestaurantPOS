import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'

import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import { logout } from '../../../shared/auth'

type StatTab = 'uptime' | 'finance' | 'products'

const TABS: { value: StatTab; label: string }[] = [
  { value: 'uptime', label: 'Dastur faoliyati' },
  { value: 'finance', label: 'Moliyaviy analitika' },
  { value: 'products', label: 'Mahsulotlar analitikasi' },
]

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
          {activeTab === 'uptime' && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Dastur faoliyati</Typography>
            </Box>
          )}
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
