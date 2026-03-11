import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
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
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { categories, type Product, products } from '../mock'

type CartLine = {
  product: Product
  qty: number
}

type NewFoodForm = {
  name: string
  price: string
  categoryId: string
  imageFile: File | null
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function onlyDigits(value: string) {
  return value.replaceAll(/[^\d]/g, '')
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

export default function PosPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [menuCategories, setMenuCategories] = useState(categories)
  const [menuProducts, setMenuProducts] = useState<Product[]>(products)
  const [createOpen, setCreateOpen] = useState(false)
  const [newFood, setNewFood] = useState<NewFoodForm>({
    name: '',
    price: '',
    categoryId: 'burger',
    imageFile: null,
  })
  const [newFoodPreviewUrl, setNewFoodPreviewUrl] = useState<string>('')
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines],
  )

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return menuProducts.filter((p) => {
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId
      const matchesSearch = !normalizedSearch || p.name.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [menuProducts, search, selectedCategoryId])

  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty * line.product.price, 0),
    [cartLines],
  )
  const total = subtotal

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id]
      const nextQty = existing ? existing.qty + 1 : 1
      return { ...prev, [product.id]: { product, qty: nextQty } }
    })
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      const existing = prev[productId]
      if (!existing) return prev
      return { ...prev, [productId]: { ...existing, qty } }
    })
  }

  function clearCart() {
    setCart({})
  }

  useEffect(() => {
    return () => {
      if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    }
  }, [newFoodPreviewUrl])

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
    setMenuCategories((prev) => [...prev, next])
    setNewFood((prev) => ({ ...prev, categoryId: id }))
    setCreateCategoryOpen(false)
  }

  function onPickImage(file: File | null) {
    setNewFood((prev) => ({ ...prev, imageFile: file }))
    if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    setNewFoodPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  function createFood() {
    const name = newFood.name.trim()
    const priceDigits = onlyDigits(newFood.price)
    const price = Number(priceDigits)
    if (!name || !Number.isFinite(price) || price <= 0) return

    const imageSrc = newFoodPreviewUrl || '/mock-images/photo_1_2026-03-11_22-51-02.jpg'
    const next: Product = {
      id: `local_${Date.now()}`,
      name,
      price,
      categoryId: newFood.categoryId,
      imageSrc,
    }

    setMenuProducts((prev) => [next, ...prev])
    setCreateOpen(false)
  }

  useEffect(() => {
    const handler = () => {
      setNewFood({ name: '', price: '', categoryId: 'burger', imageFile: null })
      setNewFoodPreviewUrl('')
      setCreateOpen(true)
    }
    window.addEventListener('pos:createFood', handler)
    return () => window.removeEventListener('pos:createFood', handler)
  }, [])

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
                <ListItem
                  key={line.product.id}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <IconButton
                        size="small"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(line.product.id, line.qty - 1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ width: 22, textAlign: 'center', fontWeight: 800 }}>
                        {line.qty}
                      </Typography>
                      <IconButton
                        size="small"
                        aria-label="Increase quantity"
                        onClick={() => setQty(line.product.id, line.qty + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Remove item"
                        onClick={() => setQty(line.product.id, 0)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
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
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        objectFit: 'cover',
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 800 }} noWrap>
                        {line.product.name}
                      </Typography>
                    }
                    secondary={formatMoney(line.product.price * line.qty)}
                  />
                </ListItem>
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

          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} gap={1}>
            <Button
              color="success"
              variant="contained"
              disabled={cartCount === 0}
              sx={{ py: 1.2 }}
            >
              Pay Now
            </Button>
            <Button color="warning" variant="contained" disabled={cartCount === 0} sx={{ py: 1.2 }}>
              Hold Order
            </Button>
            <Button color="error" variant="contained" disabled={cartCount === 0} sx={{ py: 1.2 }}>
              Cancel
            </Button>
          </Stack>
          </Paper>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={closeCreateFood} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>Create food</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Food name"
              value={newFood.name}
              onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Price"
                value={formatIntegerForInput(onlyDigits(newFood.price))}
                onChange={(e) => setNewFood((prev) => ({ ...prev, price: onlyDigits(e.target.value).slice(0, 18) }))}
                sx={{ flex: 1 }}
                inputMode="numeric"
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
