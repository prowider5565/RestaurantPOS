import AddIcon from '@mui/icons-material/Add'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BarChartIcon from '@mui/icons-material/BarChart'
import HistoryIcon from '@mui/icons-material/History'
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined'
import PeopleIcon from '@mui/icons-material/People'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import { AppBar, Box, Button, IconButton, Stack, TextField, Toolbar, Tooltip, Typography } from '@mui/material'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { API_URL } from '../../config/env'

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

const ACTION_BUTTON_SIZE = 36

export default function Navbar({
  title,
  active,
  onNavigate,
  onAdd,
  showUsers = true,
  onSettings,
  onLogout,
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
  onSettings?: () => void
  onLogout?: () => void
  settingsAction?: ReactNode
  rightActions?: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}) {
  const [openingDrawer, setOpeningDrawer] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const prevStyleRef = useRef<{ left: number; width: number }>({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const activeEl = itemRefs.current.get(active)
    const container = containerRef.current
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      const next = {
        left: itemRect.left - containerRect.left + container.scrollLeft,
        width: itemRect.width,
      }
      if (next.left !== prevStyleRef.current.left || next.width !== prevStyleRef.current.width) {
        prevStyleRef.current = next
        setIndicatorStyle(next)
      }
    }
  }, [active])

  useEffect(() => {
    function onResize() {
      const activeEl = itemRefs.current.get(active)
      const container = containerRef.current
      if (activeEl && container) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = activeEl.getBoundingClientRect()
        const next = {
          left: itemRect.left - containerRect.left + container.scrollLeft,
          width: itemRect.width,
        }
        prevStyleRef.current = next
        setIndicatorStyle(next)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active])

  const measureItem = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(id, el)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  const itemsBeforeStats = NAV_ITEMS.filter((item) => (showUsers || item.id !== 'users'))

  async function openDrawer() {
    if (openingDrawer) return

    setOpeningDrawer(true)
    try {
      await fetch(`${API_URL}/cheque/open-drawer`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error opening drawer:', error)
    } finally {
      setOpeningDrawer(false)
    }
  }

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
          minHeight: { xs: 43, sm: 60 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        {title ? (
          <Typography sx={{ fontWeight: 900, whiteSpace: 'nowrap', fontSize: { xs: 24 / 1.4, sm: 28 / 1.4 } }}>
            {title}
          </Typography>
        ) : null}

        <Stack ref={containerRef} direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
          {itemsBeforeStats.map((item) => (
            <Button
              key={item.id}
              ref={(el) => measureItem(item.id, el)}
              color={item.id === active ? 'primary' : 'inherit'}
              startIcon={item.icon}
              onClick={() => onNavigate(item.id)}
              sx={{
                fontWeight: 900,
                fontSize: 14,
                borderRadius: 0.5,
                minWidth: 0,
                px: { xs: 0.9, sm: 1.4 },
                py: 0.7,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                bgcolor: 'transparent',
                color: item.id === active ? 'primary.main' : 'inherit',
                position: 'relative',
                zIndex: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '& .MuiButton-startIcon': {
                  mr: 0.6,
                  color: item.id === active ? 'primary.main' : 'inherit',
                  '& > *:first-of-type': {
                    fontSize: 18,
                  },
                },
              }}
            >
              {item.label}
            </Button>
          ))}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: 'primary.main',
              transition: 'left 0.25s ease, width 0.25s ease',
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />


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
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            '& .MuiIconButton-root': {
              width: ACTION_BUTTON_SIZE,
              height: ACTION_BUTTON_SIZE,
              p: 0.75,
            },
            '& .MuiSvgIcon-root': {
              fontSize: 20,
            },
          }}
        >
          {onSettings ? (
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={onSettings}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 999,
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(249, 115, 22, 0.08)',
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {settingsAction}
          {onAdd && (active === 'menu' || active === 'users') ? (
            <Tooltip
              title={active === 'users' ? "Yangi foydalanuvchi qo'shish" : "Yangi taom va ichimlik qo'shish"}
              placement="bottom"
            >
              <IconButton
                color="primary"
                onClick={() => onAdd(active)}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 999,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(249, 115, 22, 0.08)',
                  },
                }}
                aria-label={active === 'users' ? "Yangi foydalanuvchi qo'shish" : "Yangi taom va ichimlik qo'shish"}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          <Tooltip title="Tortmani ochish" placement="bottom">
            <span>
              <IconButton
                onClick={openDrawer}
                disabled={openingDrawer}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 999,
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(249, 115, 22, 0.08)',
                  },
                }}
                aria-label="Tortmani ochish"
              >
                <MoveToInboxOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
          {rightActions}
          {onLogout ? (
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={onLogout}
                sx={{
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 999,
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.main',
                    color: 'error.main',
                    bgcolor: 'rgba(211, 47, 47, 0.06)',
                  },
                }}
              >
                <PowerSettingsNewIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
