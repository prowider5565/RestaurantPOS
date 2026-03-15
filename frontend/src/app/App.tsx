import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

import AuthGate from './AuthGate'
import { useAuth } from '../shared/authContext'
import BottomDock, { type DockItemId } from '../shared/components/layout/BottomDock'
import OrderHistoryPage from '../modules/orderHistory/pages/OrderHistoryPage'
import PosPage from '../modules/pos/pages/PosPage'
import SettingsPage from '../modules/settings/pages/SettingsPage'
import UsersPage from '../modules/users/pages/UsersPage'
import CashDeskPage from '../modules/cashDesk/pages/CashDeskPage'
import StatisticsPage from '../modules/statistics/pages/StatisticsPage'

function AppShell() {
  const { me } = useAuth()
  const isAdmin = me?.is_admin === true || me?.is_admin === 1

  const [active, setActive] = useState<DockItemId | 'settings'>('menu')

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail as unknown
      if (detail === 'settings') setActive('settings')
      if (detail === 'menu') setActive('menu')
      if (detail === 'order_history') setActive('order_history')
      if (detail === 'users') setActive('users')
      if (detail === 'cash_desk') setActive('cash_desk')
      if (detail === 'statistics') setActive('statistics')
    }
    window.addEventListener('app:navigate', onNavigate as EventListener)
    return () => window.removeEventListener('app:navigate', onNavigate as EventListener)
  }, [])

  useEffect(() => {
    if (!isAdmin && active === 'users') setActive('menu')
  }, [active, isAdmin])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {active === 'menu' && <PosPage />}
      {active === 'order_history' && <OrderHistoryPage />}
      {active === 'cash_desk' && <CashDeskPage />}
      {active === 'statistics' && <StatisticsPage />}
      {active === 'users' && isAdmin && <UsersPage />}
      {active === 'settings' && <SettingsPage />}

      {active !== 'settings' ? (
        <BottomDock active={active} onChange={setActive} showUsers={isAdmin} />
      ) : (
        <BottomDock active="menu" onChange={setActive} showUsers={isAdmin} />
      )}
    </Box>
  )
}

export default function App() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  )
}
