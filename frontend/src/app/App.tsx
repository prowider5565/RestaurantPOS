import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

import AuthGate from './AuthGate'
import { useAuth } from '../shared/authContext'
import OrderHistoryPage from '../modules/orderHistory/pages/OrderHistoryPage'
import PosPage from '../modules/pos/pages/PosPage'
import SettingsPage from '../modules/settings/pages/SettingsPage'
import UsersPage from '../modules/users/pages/UsersPage'
import CashDeskPage from '../modules/cashDesk/pages/CashDeskPage'
import StatisticsPage from '../modules/statistics/pages/StatisticsPage'
import { type NavItemId } from '../shared/components/Navbar'

type AppRoute = NavItemId | 'settings'

function AppShell() {
  const { me } = useAuth()
  const isAdmin = me?.is_admin === true || me?.is_admin === 1

  const [active, setActive] = useState<AppRoute>('menu')

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
      {active === 'menu' && <PosPage active="menu" onNavigate={setActive} showUsers={isAdmin} />}
      {active === 'order_history' && <OrderHistoryPage active="order_history" onNavigate={setActive} showUsers={isAdmin} />}
      {active === 'cash_desk' && <CashDeskPage active="cash_desk" onNavigate={setActive} showUsers={isAdmin} />}
      {active === 'statistics' && <StatisticsPage active="statistics" onNavigate={setActive} showUsers={isAdmin} />}
      {active === 'users' && isAdmin && <UsersPage active="users" onNavigate={setActive} showUsers={isAdmin} />}
      {active === 'settings' && <SettingsPage onNavigate={setActive} showUsers={isAdmin} />}
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
