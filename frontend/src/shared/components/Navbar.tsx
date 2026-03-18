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
  { id: 'users', label: 'Xodimlar', icon: <PeopleIcon /> },
  { id: 'order_history', label: "Tarix", icon: <HistoryIcon /> },
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
      <Toolbar
        sx={{
          gap: 1.4,
          minHeight: { xs: 43, sm: 51 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        {title ? (
          <Typography sx={{ fontWeight: 900, whiteSpace: 'nowrap', fontSize: { xs: 24 / 1.4, sm: 28 / 1.4 } }}>
            {title}
          </Typography>
        ) : null}

        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, overflowX: 'auto' }}>
          {itemsBeforeStats.map((item) => (
            <Button
              key={item.id}
              color={item.id === active ? 'primary' : 'inherit'}
              startIcon={item.icon}
              onClick={() => onNavigate(item.id)}
              sx={{
                fontWeight: 900,
                fontSize: 14,
                borderRadius: 2,
                minWidth: 0,
                px: { xs: 0.9, sm: 1.4 },
                py: 0.7,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                bgcolor: item.id === active ? 'primary.main' : 'transparent',
                color: item.id === active ? 'common.white' : 'inherit',
                '&:hover': {
                  bgcolor: item.id === active ? 'primary.dark' : 'action.hover',
                },
                '& .MuiButton-startIcon': {
                  mr: 0.6,
                  color: item.id === active ? 'common.white' : 'inherit',
                  '& > *:first-of-type': {
                    fontSize: 18,
                  },
                },
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
                fontSize: 14 / 1.4,
                borderRadius: 2,
                minWidth: 0,
                px: { xs: 0.9, sm: 1.4 },
                py: 0.7,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                bgcolor: statisticsItem.id === active ? 'primary.main' : 'transparent',
                color: statisticsItem.id === active ? 'common.white' : 'inherit',
                '&:hover': {
                  bgcolor: statisticsItem.id === active ? 'primary.dark' : 'action.hover',
                },
                '& .MuiButton-startIcon': {
                  mr: 0.6,
                  color: statisticsItem.id === active ? 'common.white' : 'inherit',
                  '& > *:first-of-type': {
                    fontSize: 18,
                  },
                },
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
              sx={{
                minWidth: 150,
                flex: 1,
                '& .MuiInputBase-root': {
                  minHeight: { xs: 30, sm: 34 },
                  fontSize: 14 / 1.4,
                },
                '& .MuiInputBase-input': {
                  py: { xs: 0.55, sm: 0.7 },
                },
              }}
            />
          ) : null}

          {settingsAction}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            '& .MuiIconButton-root': {
              width: 36,
              height: 36,
              p: 0.75,
            },
            '& .MuiSvgIcon-root': {
              fontSize: 20,
            },
          }}
        >
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
