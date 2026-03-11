import HistoryIcon from '@mui/icons-material/History'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import { Button, Paper } from '@mui/material'

export type DockItemId = 'menu' | 'orders' | 'order_history' | 'inventory' | 'settings'

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
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        borderRadius: 999,
        px: 1,
        py: 1,
        minHeight: 72,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 1,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
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
        color={active === 'inventory' ? 'primary' : 'inherit'}
        size="large"
        startIcon={<Inventory2Icon fontSize="large" />}
        onClick={() => onChange('inventory')}
        sx={{ fontWeight: 900, borderRadius: 999, px: 2, py: 1.25, fontSize: 18 }}
      >
        Inventory
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
    </Paper>
  )
}

