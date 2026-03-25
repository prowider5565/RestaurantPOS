import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'

import { clearAccessToken } from '../../../shared/auth'
import DateRangeFilterCard from '../../../shared/components/DateRangeFilterCard'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import CashDeskSummaryPanel from '../components/CashDeskSummaryPanel'
import CashDeskTransactionsTable from '../components/CashDeskTransactionsTable'
import DeleteTransactionDialog from '../components/DeleteTransactionDialog'
import { useCashDeskPage } from '../hooks/useCashDeskPage'
import { getSafeSummary } from '../utils'

export default function CashDeskPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const cashDesk = useCashDeskPage()
  const safeSummary = getSafeSummary(cashDesk.summary)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        rightActions={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={() => onNavigate('settings')}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={() => clearAccessToken()}
                sx={{
                  width: 48,
                  height: 48,
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
          </Stack>
        }
      />

      <Box
        sx={{
          p: 2,
          pb: { xs: 12, md: 2, lg: 12 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          flex: 1,
          height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px', lg: 'minmax(0, 1fr) 400px' },
            gap: 2,
            alignItems: { xs: 'start', md: 'stretch' },
            flex: 1,
            minHeight: 0,
            overflow: { xs: 'visible', md: 'hidden' },
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              height: { md: '100%' },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <DateRangeFilterCard
                preset={cashDesk.preset}
                fromDate={cashDesk.fromDate}
                toDate={cashDesk.toDate}
                onPresetChange={cashDesk.changePreset}
                onDateRangeChange={cashDesk.changeDateRange}
              />
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <CashDeskTransactionsTable
                isAdmin={cashDesk.isAdmin}
                rows={cashDesk.pagedTransactions}
                page={cashDesk.page}
                pages={cashDesk.pages}
                onPageChange={cashDesk.setPage}
                onDelete={cashDesk.requestDeleteTransaction}
              />
            </Box>
          </Box>

          <CashDeskSummaryPanel
            summary={safeSummary}
            summaryLoading={cashDesk.summaryLoading}
            summaryError={cashDesk.summaryError}
            createAmount={cashDesk.createAmount}
            creating={cashDesk.creating}
            createAmountInt={cashDesk.createAmountInt}
            createError={cashDesk.createError}
            onCreateAmountChange={cashDesk.setCreateAmount}
            onCreateTransaction={cashDesk.createTransaction}
          />
        </Box>
      </Box>

      {cashDesk.isAdmin ? (
        <DeleteTransactionDialog
          open={cashDesk.deleteOpen}
          transaction={cashDesk.deleteTarget}
          deleting={cashDesk.deleting}
          error={cashDesk.deleteError}
          password={cashDesk.deletePassword}
          onPasswordChange={cashDesk.setDeletePassword}
          onClose={cashDesk.closeDelete}
          onConfirm={cashDesk.confirmDelete}
        />
      ) : null}
    </Box>
  )
}
