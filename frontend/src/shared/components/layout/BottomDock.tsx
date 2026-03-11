import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import { Button, Paper, Tooltip } from '@mui/material'

export type DockItemId = 'menu' | 'orders' | 'order_history' | 'settings'

export default function BottomDock({
  active,
  onChange,
}: {
  active: DockItemId
  onChange: (next: DockItemId) => void
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
      <Button
        color={active === 'orders' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<ReceiptLongIcon fontSize="large" />}
        onClick={() => onChange('orders')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Orders
      </Button>
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
        color={active === 'settings' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<SettingsIcon fontSize="large" />}
        onClick={() => onChange('settings')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Settings
      </Button>

      <Tooltip title="Add new food & Drinks" placement="top">
        <Button
          aria-label="Add new food & Drinks"
          onClick={() => window.dispatchEvent(new CustomEvent('pos:createFood'))}
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
    </Paper>
  )
}
