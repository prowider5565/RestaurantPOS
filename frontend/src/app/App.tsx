import { Box } from '@mui/material'
import { useState } from 'react'

import BottomDock, { type DockItemId } from '../shared/components/layout/BottomDock'
import InventoryPage from '../modules/inventory/pages/InventoryPage'
import OrderHistoryPage from '../modules/orderHistory/pages/OrderHistoryPage'
import OrdersPage from '../modules/orders/pages/OrdersPage'
import PosPage from '../modules/pos/pages/PosPage'

export default function App() {
  const [active, setActive] = useState<DockItemId>('menu')

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {active === 'menu' && <PosPage />}
      {active === 'orders' && <OrdersPage />}
      {active === 'order_history' && <OrderHistoryPage />}
      {active === 'inventory' && <InventoryPage />}
      {active === 'settings' && <Box sx={{ p: 3, pb: 12 }}>Settings (coming soon)</Box>}

      <BottomDock active={active} onChange={setActive} />
    </Box>
  )
}
