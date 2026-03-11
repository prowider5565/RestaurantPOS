import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

import BottomDock, { type DockItemId } from '../shared/components/layout/BottomDock'
import OrderHistoryPage from '../modules/orderHistory/pages/OrderHistoryPage'
import OrdersPage from '../modules/orders/pages/OrdersPage'
import PosPage from '../modules/pos/pages/PosPage'

export default function App() {
  const [active, setActive] = useState<DockItemId | 'settings'>('menu')

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail as unknown
      if (detail === 'settings') setActive('settings')
      if (detail === 'menu') setActive('menu')
      if (detail === 'orders') setActive('orders')
      if (detail === 'order_history') setActive('order_history')
    }
    window.addEventListener('app:navigate', onNavigate as EventListener)
    return () => window.removeEventListener('app:navigate', onNavigate as EventListener)
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {active === 'menu' && <PosPage />}
      {active === 'orders' && <OrdersPage />}
      {active === 'order_history' && <OrderHistoryPage />}
      {active === 'settings' && <Box sx={{ p: 3, pb: 12 }}>Settings (coming soon)</Box>}

      {active !== 'settings' ? (
        <BottomDock active={active} onChange={setActive} />
      ) : (
        <BottomDock active="menu" onChange={setActive} />
      )}
    </Box>
  )
}
