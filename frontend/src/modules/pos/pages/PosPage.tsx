import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'

import { categories, type Product, products } from '../mock'

type CartLine = {
  product: Product
  qty: number
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export default function PosPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, CartLine>>({})

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines],
  )

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId
      const matchesSearch = !normalizedSearch || p.name.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategoryId])

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 2,
          p: 2,
          pb: 12,
        }}
      >
        <Box>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {categories.map((c) => (
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
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

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, height: 'fit-content' }}>
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

          <List dense disablePadding sx={{ maxHeight: { xs: 220, lg: 420 }, overflow: 'auto' }}>
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

          <Stack gap={1} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography sx={{ fontWeight: 800 }}>{formatMoney(subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontWeight: 900 }}>Total</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatMoney(total)}</Typography>
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
  )
}
