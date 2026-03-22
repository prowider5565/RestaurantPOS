import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, IconButton, Stack, Tab, Tabs, Tooltip } from '@mui/material'
import { useState } from 'react'

import { logout } from '../../../shared/auth'
import DateRangeFilterCard from '../../../shared/components/DateRangeFilterCard'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import FoodAnalyticsTable from '../components/FoodAnalyticsTable'
import OrderDetailsDialog from '../components/OrderDetailsDialog'
import OrderHistorySummary from '../components/OrderHistorySummary'
import OrderHistoryTable from '../components/OrderHistoryTable'
import { useOrderHistoryPage } from '../hooks/useOrderHistoryPage'

export default function OrderHistoryPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const historyPage = useOrderHistoryPage()
  const [activeTab, setActiveTab] = useState<'orders' | 'food_analytics'>('orders')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        searchValue={historyPage.search}
        onSearchChange={historyPage.setSearch}
        searchPlaceholder={activeTab === 'orders' ? 'Buyurtma qidirish...' : 'Ovqat qidirish...'}
        settingsAction={
          <Tooltip title="Sozlamalar" placement="bottom">
            <IconButton
              aria-label="Sozlamalar"
              onClick={() => onNavigate('settings')}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        }
        rightActions={
          <Tooltip title="Chiqish" placement="bottom">
            <IconButton
              aria-label="Chiqish"
              onClick={() => logout()}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'error.main',
                  color: 'error.main',
                  bgcolor: 'rgba(211, 47, 47, 0.06)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        }
      />

      <Box
        sx={{
          p: 2,
          pb: { xs: 6, md: 2, lg: 6 },
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Tabs
            value={activeTab}
            onChange={(_, next: 'orders' | 'food_analytics') => setActiveTab(next)}
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                fontWeight: 900,
              },
            }}
          >
            <Tab value="orders" label="Buyurtmalarim" />
            <Tab value="food_analytics" label="Ovqatlar savdo analitikasi" />
          </Tabs>

          <DateRangeFilterCard
            preset={historyPage.preset}
            fromDate={historyPage.fromDate}
            toDate={historyPage.toDate}
            onPresetChange={historyPage.changePreset}
            onDateRangeChange={historyPage.changeDateRange}
          />
        </Stack>

        {activeTab === 'orders' ? (
          <Box sx={{ flex: '0 0 auto' }}>
            <OrderHistorySummary overview={historyPage.history?.overview} />
          </Box>
        ) : null}

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'orders' ? (
            <OrderHistoryTable
              loading={historyPage.loading}
              rows={historyPage.rows}
              page={historyPage.page}
              totalPages={historyPage.history?.page.pages ?? 0}
              onPageChange={historyPage.setPage}
              onOpenDetails={historyPage.setSelectedOrderId}
            />
          ) : (
            <FoodAnalyticsTable loading={historyPage.analyticsLoading} rows={historyPage.foodAnalyticsRows} />
          )}
        </Box>
      </Box>

      {activeTab === 'orders' ? (
        <OrderDetailsDialog
          open={Boolean(historyPage.selectedOrderId)}
          orderId={historyPage.selectedOrderId}
          onClose={() => historyPage.setSelectedOrderId(null)}
        />
      ) : null}
    </Box>
  )
}
