import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import RemoveIcon from '@mui/icons-material/Remove'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'

type ApiProduct = {
  id: number
  name: string
  price: number
  image_path?: string | null
}

type UiProduct = {
  id: number
  name: string
  price: number
  imageSrc: string
  categoryId: string
}

type CartLine = {
  product: UiProduct
  qty: number
}

type Category = {
  id: string
  label: string
}

type NewFoodForm = {
  name: string
  priceDigits: string
  imageFile: File | null
  categoryId: string
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
}

function formatIntegerForInput(digits: string) {
  if (!digits) return ''
  try {
    return new Intl.NumberFormat('uz-UZ').format(BigInt(digits))
  } catch {
    const n = Number(digits)
    if (!Number.isFinite(n)) return digits
    return new Intl.NumberFormat('uz-UZ').format(n)
  }
}

function toImageSrc(apiProduct: ApiProduct) {
  const raw = apiProduct.image_path
  if (!raw) return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'

  const normalized = raw.replaceAll('\\', '/')
  const marker = '/products/'
  const idx = normalized.lastIndexOf(marker)
  if (idx === -1) return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'
  const filename = normalized.slice(idx + marker.length)
  return `${API_URL}/media/products/${filename}`
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', label: 'All' },
  { id: 'uncategorized', label: 'Uncategorized' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'burger', label: 'Burgers' },
  { id: 'salad', label: 'Salads' },
  { id: 'drink', label: 'Drinks' },
  { id: 'dessert', label: 'Desserts' },
]

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export default function PosPage() {
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [menuProducts, setMenuProducts] = useState<UiProduct[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [menuCategories, setMenuCategories] = useState<Category[]>(() =>
    loadJson<Category[]>('pos.categories', DEFAULT_CATEGORIES),
  )
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>('pos.productCategories', {}),
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [newFood, setNewFood] = useState<NewFoodForm>({
    name: '',
    priceDigits: '',
    imageFile: null,
    categoryId: 'uncategorized',
  })
  const [newFoodPreviewUrl, setNewFoodPreviewUrl] = useState<string>('')
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty, 0), [cartLines])

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return menuProducts.filter((p) => {
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId
      const matchesSearch = !q || p.name.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [menuProducts, search, selectedCategoryId])

  const total = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty * line.product.price, 0),
    [cartLines],
  )

  function addToCart(product: UiProduct) {
    setCart((prev) => {
      const existing = prev[String(product.id)]
      const nextQty = existing ? existing.qty + 1 : 1
      return { ...prev, [String(product.id)]: { product, qty: nextQty } }
    })
  }

  function setQty(productId: number, qty: number) {
    setCart((prev) => {
      const key = String(productId)
      if (qty <= 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, qty } }
    })
  }

  function clearCart() {
    setCart({})
  }

  function SwipeToDeleteRow({
    children,
    onDelete,
  }: {
    children: ReactNode
    onDelete: () => void
  }) {
    const [translateX, setTranslateX] = useState(0)
    const [dragging, setDragging] = useState(false)
    const startXRef = useRef(0)
    const lastXRef = useRef(0)
    const hasMovedRef = useRef(false)

    const threshold = 110
    const clamp = (v: number) => Math.max(-160, Math.min(160, v))
    const progress = Math.min(1, Math.abs(translateX) / threshold)
    const leftActive = translateX > 0
    const rightActive = translateX < 0

    function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
      const target = e.target as HTMLElement
      if (target.closest('button, [role="button"], input, textarea, select, a')) return

      startXRef.current = e.clientX
      lastXRef.current = e.clientX
      hasMovedRef.current = false
      setDragging(true)
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (!dragging) return
      const dx = e.clientX - startXRef.current
      const step = e.clientX - lastXRef.current
      lastXRef.current = e.clientX
      if (!hasMovedRef.current && Math.abs(dx) > 8) hasMovedRef.current = true
      if (hasMovedRef.current && Math.abs(step) > 0) e.preventDefault()
      setTranslateX(clamp(dx))
    }

    function finish() {
      const shouldDelete = Math.abs(translateX) >= threshold
      setDragging(false)
      if (shouldDelete) {
        setTranslateX(0)
        onDelete()
      } else {
        setTranslateX(0)
      }
    }

    function onPointerUp() {
      finish()
    }

    function onPointerCancel() {
      setDragging(false)
      setTranslateX(0)
    }

    return (
      <Box
        sx={{
          position: 'relative',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'error.main',
            opacity: translateX === 0 ? 0 : 1,
            transition: 'opacity 180ms ease',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pointerEvents: 'none',
            color: 'common.white',
          }}
        >
          <Box
            sx={{
              opacity: leftActive ? progress : 0,
              transform: `scale(${0.85 + progress * 0.25})`,
              transition: dragging ? 'none' : 'opacity 180ms ease, transform 180ms ease',
            }}
          >
            <DeleteOutlineIcon />
          </Box>
          <Box
            sx={{
              opacity: rightActive ? progress : 0,
              transform: `scale(${0.85 + progress * 0.25})`,
              transition: dragging ? 'none' : 'opacity 180ms ease, transform 180ms ease',
            }}
          >
            <DeleteOutlineIcon />
          </Box>
        </Box>
        <Box
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          sx={{
            transform: `translateX(${translateX}px)`,
            transition: dragging ? 'none' : 'transform 180ms ease',
            touchAction: 'pan-y',
            bgcolor: 'background.paper',
            borderRadius: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    )
  }

  async function placeOrder(status: 'Pending' | 'Completed') {
    if (cartLines.length === 0 || isPlacingOrder) return

    setIsPlacingOrder(true)
    try {
      const payload = {
        total,
        status,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return

      clearCart()
    } finally {
      setIsPlacingOrder(false)
    }
  }

  function closeCreateFood() {
    setCreateOpen(false)
  }

  function openCreateCategory() {
    setNewCategoryName('')
    setCreateCategoryOpen(true)
  }

  function closeCreateCategory() {
    setCreateCategoryOpen(false)
  }

  function createCategory() {
    const label = newCategoryName.trim()
    if (!label) return

    const baseId = label
      .toLowerCase()
      .replaceAll('&', 'and')
      .replaceAll(/[^a-z0-9]+/g, '_')
      .replaceAll(/^_+|_+$/g, '')

    const idExists = (id: string) => menuCategories.some((c) => c.id === id)
    let id = baseId || `cat_${Date.now()}`
    if (idExists(id)) id = `${id}_${Date.now()}`

    const next = { id, label }
    const updated = [...menuCategories, next]
    setMenuCategories(updated)
    saveJson('pos.categories', updated)

    setNewFood((prev) => ({ ...prev, categoryId: id }))
    setCreateCategoryOpen(false)
  }

  function onPickImage(file: File | null) {
    setNewFood((prev) => ({ ...prev, imageFile: file }))
    if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    setNewFoodPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  async function createFood() {
    const name = newFood.name.trim()
    const price = Number(newFood.priceDigits)
    if (!name || !Number.isFinite(price) || price <= 0) return

    const form = new FormData()
    form.append('name', name)
    form.append('price', newFood.priceDigits)
    if (newFood.imageFile) form.append('image', newFood.imageFile)

    const res = await fetch(`${API_URL}/products`, { method: 'POST', body: form })
    if (!res.ok) return
    const created = (await res.json()) as ApiProduct

    const imageSrc = newFoodPreviewUrl || toImageSrc(created)
    const nextCategoryMap = { ...productCategoryMap, [String(created.id)]: newFood.categoryId }
    setProductCategoryMap(nextCategoryMap)
    saveJson('pos.productCategories', nextCategoryMap)

    setMenuProducts((prev) => [
      { id: created.id, name: created.name, price: created.price, imageSrc, categoryId: newFood.categoryId },
      ...prev,
    ])
    setCreateOpen(false)
  }

  useEffect(() => {
    const handler = () => {
      setNewFood({ name: '', priceDigits: '', imageFile: null, categoryId: 'uncategorized' })
      setNewFoodPreviewUrl('')
      setCreateOpen(true)
    }
    window.addEventListener('pos:createFood', handler)
    return () => window.removeEventListener('pos:createFood', handler)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      const res = await fetch(`${API_URL}/products`)
      if (!res.ok) return
      const list = (await res.json()) as ApiProduct[]
      if (cancelled) return
      const map = loadJson<Record<string, string>>('pos.productCategories', {})
      setProductCategoryMap(map)
      setMenuProducts(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageSrc: toImageSrc(p),
          categoryId: map[String(p.id)] ?? 'uncategorized',
        })),
      )
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    }
  }, [newFoodPreviewUrl])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Restaurant POS
            </Typography>
          </Stack>

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            placeholder="Search items..."
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Settings" placement="bottom">
              <IconButton
                aria-label="Settings"
                onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'settings' }))}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Logout" placement="bottom">
              <IconButton
                aria-label="Logout"
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'error.main',
                    color: 'error.main',
                    bgcolor: 'rgba(211, 47, 47, 0.06)',
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 2,
          pb: 12,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
        }}
      >
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {menuCategories.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              clickable
              color={c.id === selectedCategoryId ? 'primary' : 'default'}
              variant={c.id === selectedCategoryId ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategoryId(c.id)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
            gap: 2,
            alignItems: { xs: 'start', lg: 'stretch' },
            flex: 1,
            minHeight: 0,
            height: { xs: 'auto', lg: '100%' },
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
          <Box sx={{ minHeight: 0, height: { lg: '100%' }, overflow: { xs: 'visible', lg: 'auto' }, pr: { lg: 1 } }}>
            {visibleProducts.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  height: { lg: '100%' },
                  minHeight: { xs: 320, lg: '100%' },
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  color: 'text.secondary',
                  p: 4,
                  bgcolor: 'background.paper',
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <RestaurantMenuIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 1000, color: 'text.primary', fontSize: 20 }}>
                    No products yet
                  </Typography>
                  <Typography variant="body2">
                    Use the <b>+</b> button in the bottom bar to add food & drinks.
                  </Typography>
                </Stack>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {visibleProducts.map((p) => (
                  <Card key={p.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <CardActionArea onClick={() => addToCart(p)} sx={{ height: '100%' }}>
                      <Box
                        sx={{
                          position: 'relative',
                          height: 150,
                          backgroundImage: `url("${p.imageSrc}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                        role="img"
                        aria-label={p.name}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)',
                          }}
                        />

                        <Box sx={{ position: 'absolute', left: 12, right: 12, bottom: 12, color: 'common.white' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: 24, lineHeight: 1.1 }} noWrap>
                            {p.name}
                          </Typography>
                          <Typography sx={{ opacity: 0.95, fontWeight: 800, fontSize: 21, lineHeight: 1.2 }}>
                            {formatMoney(p.price)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 2,
              height: { xs: 'fit-content', md: '100%' },
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>Current Order</Typography>
                <Typography variant="body2" color="text.secondary">
                  Table 4 • Dine in
                </Typography>
              </Box>
              <IconButton aria-label="Clear order" onClick={clearCart} disabled={cartCount === 0}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <List dense disablePadding sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              {cartLines.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography sx={{ fontWeight: 700 }}>No items yet</Typography>
                  <Typography variant="body2">Tap a product to add it to the order.</Typography>
                </Box>
              ) : (
                cartLines.map((line) => (
                  <SwipeToDeleteRow key={line.product.id} onDelete={() => setQty(line.product.id, 0)}>
                    <ListItem
                      disableGutters
                      sx={{
                        px: 0,
                        '&.MuiListItem-secondaryAction': { pr: 0 },
                        '& .MuiListItemSecondaryAction-root': { right: 0 },
                      }}
                      secondaryAction={
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <IconButton
                            size="small"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(line.product.id, line.qty - 1)}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 999,
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography sx={{ width: 22, textAlign: 'center', fontWeight: 800 }}>
                            {line.qty}
                          </Typography>
                          <IconButton
                            size="small"
                            aria-label="Increase quantity"
                            onClick={() => setQty(line.product.id, line.qty + 1)}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 999,
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemAvatar>
                        <Box
                          component="img"
                          src={line.product.imageSrc}
                          alt={line.product.name}
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            objectFit: 'cover',
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ pr: 10 }}
                        primary={
                          <Typography sx={{ fontWeight: 800 }} noWrap>
                            {line.product.name}
                          </Typography>
                        }
                        secondary={formatMoney(line.product.price * line.qty)}
                      />
                    </ListItem>
                  </SwipeToDeleteRow>
                ))
              )}
            </List>

            <Divider sx={{ my: 1.5 }} />

            <Stack sx={{ mb: 2, mt: 'auto' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>Total</Typography>
                <Typography sx={{ fontWeight: 1100, fontSize: 28 }}>{formatMoney(total)}</Typography>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
                gap: 1,
              }}
            >
              <Button
                color="success"
                variant="contained"
                disabled={cartCount === 0 || isPlacingOrder}
                onClick={() => placeOrder('Completed')}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                fullWidth
              >
                Pay Now
              </Button>
              <Button
                color="error"
                variant="contained"
                disabled={cartCount === 0 || isPlacingOrder}
                onClick={clearCart}
                startIcon={<CloseIcon />}
                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreateFood} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>Create product</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={newFood.name}
              onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Price"
                value={formatIntegerForInput(newFood.priceDigits)}
                onChange={(e) =>
                  setNewFood((prev) => ({
                    ...prev,
                    priceDigits: e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18),
                  }))
                }
                inputMode="numeric"
                sx={{ flex: 1 }}
              />

              <Stack direction="row" gap={1} sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id="new-food-category-label">Category</InputLabel>
                  <Select
                    labelId="new-food-category-label"
                    label="Category"
                    value={newFood.categoryId}
                    onChange={(e) => setNewFood((prev) => ({ ...prev, categoryId: String(e.target.value) }))}
                  >
                    {menuCategories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Tooltip title="Add category" placement="top">
                  <IconButton
                    aria-label="Add category"
                    onClick={openCreateCategory}
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      flex: '0 0 auto',
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, display: 'grid', gap: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>Image upload</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a photo for the menu card background.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}>
                <Button component="label" variant="outlined">
                  Choose image
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {newFood.imageFile ? newFood.imageFile.name : 'No file selected'}
                </Typography>
              </Stack>

              <Box
                sx={{
                  mt: 1,
                  height: 160,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundImage: newFoodPreviewUrl ? `url("${newFoodPreviewUrl}")` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!newFoodPreviewUrl && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Image preview
                  </Typography>
                )}
              </Box>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" variant="contained" onClick={closeCreateFood}>
            Cancel
          </Button>
          <Button color="success" variant="contained" onClick={createFood}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createCategoryOpen} onClose={closeCreateCategory} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>Create category</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" variant="contained" onClick={closeCreateCategory}>
            Cancel
          </Button>
          <Button color="success" variant="contained" onClick={createCategory}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
