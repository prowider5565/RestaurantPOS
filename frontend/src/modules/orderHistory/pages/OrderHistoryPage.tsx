import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Box, Button, IconButton, Stack, Tooltip } from '@mui/material'

import { logout } from '../../../shared/auth'
import DateRangeFilterCard from '../../../shared/components/DateRangeFilterCard'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        searchValue={historyPage.search}
        onSearchChange={historyPage.setSearch}
        searchPlaceholder="Buyurtma qidirish..."
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
          pb: 6,
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
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={historyPage.exportToExcelCsv}
              disabled={historyPage.rows.length === 0}
            >
              Excelga eksport qilish
            </Button>
          </Stack>

          <DateRangeFilterCard
            preset={historyPage.preset}
            fromDate={historyPage.fromDate}
            toDate={historyPage.toDate}
            onPresetChange={historyPage.changePreset}
            onDateRangeChange={historyPage.changeDateRange}
          />
        </Stack>

        <Box sx={{ flex: '0 0 auto' }}>
          <OrderHistorySummary overview={historyPage.history?.overview} />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <OrderHistoryTable
            loading={historyPage.loading}
            rows={historyPage.rows}
            page={historyPage.page}
            totalPages={historyPage.history?.page.pages ?? 0}
            onPageChange={historyPage.setPage}
            onOpenDetails={historyPage.setSelectedOrderId}
          />
        </Box>
      </Box>

      <OrderDetailsDialog
        open={Boolean(historyPage.selectedOrderId)}
        orderId={historyPage.selectedOrderId}
        onClose={() => historyPage.setSelectedOrderId(null)}
      />
    </Box>
  )
}
