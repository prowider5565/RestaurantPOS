import AddIcon from '@mui/icons-material/Add'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BarChartIcon from '@mui/icons-material/BarChart'
import HistoryIcon from '@mui/icons-material/History'
import PeopleIcon from '@mui/icons-material/People'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import { AppBar, Button, IconButton, Stack, TextField, Toolbar, Tooltip, Typography } from '@mui/material'
import { type ReactNode } from 'react'

export type NavItemId = 'menu' | 'order_history' | 'users' | 'cash_desk' | 'statistics'

type NavItem = {
  id: NavItemId
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'menu', label: 'Menyu', icon: <RestaurantMenuIcon /> },
  { id: 'users', label: 'Foydalanuvchilar', icon: <PeopleIcon /> },
  { id: 'order_history', label: "Buyurtmalar tarixi", icon: <HistoryIcon /> },
  { id: 'cash_desk', label: 'Kassa', icon: <AttachMoneyIcon /> },
  { id: 'statistics', label: 'Statistika', icon: <BarChartIcon /> },
]

export default function Navbar({
  title,
  active,
  onNavigate,
  onAdd,
  showUsers = true,
  settingsAction,
  rightActions,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: {
  title?: string
  active: NavItemId
  onNavigate: (next: NavItemId) => void
  onAdd?: (active: NavItemId) => void
  showUsers?: boolean
  settingsAction?: ReactNode
  rightActions?: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}) {
  const itemsBeforeStats = NAV_ITEMS.filter((item) => item.id !== 'statistics' && (showUsers || item.id !== 'users'))
  const statisticsItem = NAV_ITEMS.find((item) => item.id === 'statistics')

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 60, sm: 72 } }}>
        {title ? (
          <Typography variant="h6" sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>
            {title}
          </Typography>
        ) : null}

        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, overflowX: 'auto' }}>
          {itemsBeforeStats.map((item) => (
            <Button
              key={item.id}
              color={item.id === active ? 'primary' : 'inherit'}
              startIcon={item.icon}
              onClick={() => onNavigate(item.id)}
              sx={{
                fontWeight: 900,
                borderRadius: 3,
                px: { xs: 1.25, sm: 2 },
                py: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Button>
          ))}

          {statisticsItem ? (
            <Button
              key={statisticsItem.id}
              color={statisticsItem.id === active ? 'primary' : 'inherit'}
              startIcon={statisticsItem.icon}
              onClick={() => onNavigate(statisticsItem.id)}
              sx={{
                fontWeight: 900,
                borderRadius: 3,
                px: { xs: 1.25, sm: 2 },
                py: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {statisticsItem.label}
            </Button>
          ) : null}

          {onSearchChange ? (
            <TextField
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
              placeholder={searchPlaceholder ?? 'Qidirish...'}
              fullWidth
              sx={{ minWidth: 180, flex: 1 }}
            />
          ) : null}

          {settingsAction}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {onAdd && (active === 'menu' || active === 'users') ? (
            <Tooltip
              title={active === 'users' ? "Yangi foydalanuvchi qo'shish" : "Yangi taom va ichimlik qo'shish"}
              placement="bottom"
            >
              <IconButton
                color="primary"
                onClick={() => onAdd(active)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
                aria-label={active === 'users' ? "Yangi foydalanuvchi qo'shish" : "Yangi taom va ichimlik qo'shish"}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {rightActions}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
