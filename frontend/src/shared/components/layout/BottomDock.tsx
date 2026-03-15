import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import PeopleIcon from '@mui/icons-material/People'
import BarChartIcon from '@mui/icons-material/BarChart'
import { Button, Paper, Tooltip } from '@mui/material'

export type DockItemId = 'menu' | 'order_history' | 'users' | 'cash_desk' | 'statistics'

export default function BottomDock({
  active,
  onChange,
  showUsers,
}: {
  active: DockItemId
  onChange: (next: DockItemId) => void
  showUsers?: boolean
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        left: 16,
        right: 16,
        bottom: 16,
        borderRadius: 999,
        px: 1,
        pr: 11,
        py: 1,
        minHeight: 72,
        bgcolor: 'background.paper',
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: (t) => t.zIndex.appBar,
        overflow: 'visible',
      }}
    >
      {/* Reserve space for the add button so spacing stays even */}
      <Button
        color={active === 'menu' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<RestaurantMenuIcon fontSize="large" />}
        onClick={() => onChange('menu')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Menu
      </Button>
      {showUsers ? (
        <Button
          color={active === 'users' ? 'primary' : 'inherit'}
          size="large"
          startIcon={<PeopleIcon fontSize="large" />}
          onClick={() => onChange('users')}
          sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
        >
          Users
        </Button>
      ) : null}
      <Button
        color={active === 'order_history' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<HistoryIcon fontSize="large" />}
        onClick={() => onChange('order_history')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Order history
      </Button>

      <Button
        color={active === 'cash_desk' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<AttachMoneyIcon fontSize="large" />}
        onClick={() => onChange('cash_desk')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Cash desk
      </Button>

      <Button
        color={active === 'statistics' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<BarChartIcon fontSize="large" />}
        onClick={() => onChange('statistics')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Statistics
      </Button>

      {active === 'menu' || active === 'users' ? (
        <Tooltip title={active === 'users' ? 'Add new user' : 'Add new food & Drinks'} placement="top">
          <Button
            aria-label={active === 'users' ? 'Add new user' : 'Add new food & Drinks'}
            onClick={() => {
              if (active === 'menu') window.dispatchEvent(new CustomEvent('pos:createFood'))
              if (active === 'users') window.dispatchEvent(new CustomEvent('users:createUser'))
            }}
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 0,
              width: 56,
              height: 56,
              borderRadius: 999,
              bgcolor: 'primary.main',
              color: 'common.white',
              border: '1px solid',
              borderColor: 'primary.dark',
              boxShadow: 3,
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 6 },
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Button>
        </Tooltip>
      ) : null}
    </Paper>
  )
}
