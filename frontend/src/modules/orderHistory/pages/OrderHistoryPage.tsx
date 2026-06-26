import { Box, Stack, Tab, Tabs } from '@mui/material'
import { useState } from 'react'

import { logout } from '../../../shared/auth'
import { useAuth } from '../../../shared/authContext'
import DateRangeFilterCard from '../../../shared/components/DateRangeFilterCard'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import DeleteOrderDialog from '../components/DeleteOrderDialog'
import OrderDetailsDialog from '../components/OrderDetailsDialog'
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
  const { me } = useAuth()
  const isAdmin = me?.is_admin === true || me?.is_admin === 1
  const historyPage = useOrderHistoryPage()

  return (
    <Box sx={{ height: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        searchValue={historyPage.search}
        onSearchChange={historyPage.setSearch}
        searchPlaceholder="Buyurtma qidirish..."
        onSettings={() => onNavigate('settings')}
        onLogout={() => logout()}
      />

      <Box
        sx={{
          p: 2,
          pb: 0,
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          gap: 2,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <DateRangeFilterCard
            preset={historyPage.preset}
            fromDate={historyPage.fromDate}
            toDate={historyPage.toDate}
            onPresetChange={historyPage.changePreset}
            onDateRangeChange={historyPage.changeDateRange}
          />
        </Stack>

        <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <OrderHistoryTable
            isAdmin={historyPage.isAdmin}
            loading={historyPage.loading}
            rows={historyPage.rows}
            hasMore={historyPage.hasMoreHistory}
            overview={historyPage.overview}
            onLoadMore={historyPage.loadNextPage}
            onOpenDetails={historyPage.setSelectedOrderId}
            onDelete={historyPage.requestDeleteOrder}
          />
        </Box>
      </Box>
      <OrderDetailsDialog
        open={Boolean(historyPage.selectedOrderId)}
        orderId={historyPage.selectedOrderId}
        onClose={() => historyPage.setSelectedOrderId(null)}
      />
      <DeleteOrderDialog
        open={isAdmin && historyPage.deleteOpen}
        orderId={historyPage.deleteTargetId}
        deleting={historyPage.deleting}
        error={historyPage.deleteError}
        password={historyPage.deletePassword}
        onPasswordChange={historyPage.setDeletePassword}
        onClose={historyPage.closeDelete}
        onConfirm={historyPage.confirmDelete}
      />
    </Box>
  )
}
