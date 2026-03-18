import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  Box,
  Button,
  Menu,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getCurrentUser, logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import PosCartPanel from '../components/PosCartPanel'
import PosCategoryStrip from '../components/PosCategoryStrip'
import PosProductsGrid from '../components/PosProductsGrid'
import { generateReceipt, printReceipt } from '../receipt'
import type { ApiCategory, ApiProduct, Category, EditFoodForm, NewFoodForm, UiProduct, CartLine } from '../types'
import { DEFAULT_CATEGORY_IMAGE_SRC, formatIntegerForInput, toCategoryImageSrc, toImageSrc } from '../utils'

export default function PosPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [menuProducts, setMenuProducts] = useState<UiProduct[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [newFood, setNewFood] = useState<NewFoodForm>({
    name: '',
    priceDigits: '',
    imageFile: null,
    categoryId: 'uncategorized',
    measure: 'unit',
  })
  const [newFoodPreviewUrl, setNewFoodPreviewUrl] = useState<string>('')
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editFood, setEditFood] = useState<EditFoodForm>({
    id: 0,
    name: '',
    priceDigits: '',
    imageFile: null,
    categoryId: 'uncategorized',
    measure: 'unit',
  })
  const [editFoodPreviewUrl, setEditFoodPreviewUrl] = useState<string>('')

  const [productMenu, setProductMenu] = useState<{ product: UiProduct; left: number; top: number } | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

  const cartItemsRef = useRef<HTMLDivElement | null>(null)

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty, 0), [cartLines])

  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [discountDigits, setDiscountDigits] = useState('')
  const [discountedTotalOverride, setDiscountedTotalOverride] = useState<number | null>(null)

  const menuCategories: Category[] = useMemo(() => {
    const base: Category[] = [{ id: 'all', label: 'Barchasi', imageSrc: DEFAULT_CATEGORY_IMAGE_SRC }]

    const next = apiCategories.map((c) => ({
      id: String(c.id),
      label: c.name,
      imageSrc: toCategoryImageSrc(c),
    }))

    return [...base, ...next]
  }, [apiCategories])

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return menuProducts.filter((p) => (!q ? true : p.name.toLowerCase().includes(q)))
  }, [menuProducts, search])

  const total = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty * line.product.price, 0),
    [cartLines],
  )
  const totalInt = useMemo(() => Math.round(total), [total])

  const discountedTotal = useMemo(() => {
    if (isEditingTotal) {
      const n = discountDigits ? Number(discountDigits) : 0
      if (!Number.isFinite(n)) return totalInt
      return Math.min(Math.max(Math.round(n), 0), totalInt)
    }

    const raw = discountedTotalOverride ?? totalInt
    if (!Number.isFinite(raw)) return totalInt
    return Math.min(Math.max(Math.round(raw), 0), totalInt)
  }, [discountDigits, discountedTotalOverride, isEditingTotal, totalInt])

  function toggleEditTotal() {
    if (cartCount === 0) return
    if (!isEditingTotal) {
      setDiscountDigits(String(discountedTotal))
      setIsEditingTotal(true)
      return
    }

    const n = discountDigits ? Number(discountDigits) : 0
    const next = Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), totalInt) : totalInt
    setDiscountedTotalOverride(next === totalInt ? null : next)
    setIsEditingTotal(false)
  }

  function addToCart(product: UiProduct) {
    setCart((prev) => {
      const existing = prev[String(product.id)]
      const nextQty = existing ? existing.qty + 1 : 1
      return { ...prev, [String(product.id)]: { product, qty: nextQty } }
    })
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current == null) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  function beginLongPress(product: UiProduct, left: number, top: number) {
    clearLongPressTimer()
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setProductMenu({ product, left, top })
      clearLongPressTimer()
    }, 550)
  }

  function cancelLongPress() {
    clearLongPressTimer()
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

  useEffect(() => {
    if (cartCount !== 0) return
    setIsEditingTotal(false)
    setDiscountDigits('')
    setDiscountedTotalOverride(null)
  }, [cartCount])

  async function placeOrder() {
    if (cartLines.length === 0 || isPlacingOrder) return

    setIsPlacingOrder(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const payload = {
        total: totalInt,
        discounted_total: discountedTotal,
        user_id: currentUser.id,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return

      const orderData = await res.json()
      const receiptContent = await generateReceipt(orderData)
      await printReceipt(receiptContent)

      clearCart()
    } finally {
      setIsPlacingOrder(false)
    }
  }

  function closeCreateFood() {
    setCreateOpen(false)
  }

  function closeEditFood() {
    setEditOpen(false)
  }

  function openEditFood(product: UiProduct) {
    setEditFood({
      id: product.id,
      name: product.name,
      priceDigits: String(Math.round(product.price)),
      imageFile: null,
      categoryId: product.categoryId,
      measure: product.measure,
    })
    if (editFoodPreviewUrl) URL.revokeObjectURL(editFoodPreviewUrl)
    setEditFoodPreviewUrl(product.imageSrc)
    setEditOpen(true)
  }

  function openCreateCategory() {
    setNewCategoryName('')
    setCreateCategoryOpen(true)
  }

  function closeCreateCategory() {
    setCreateCategoryOpen(false)
  }

  async function createCategory() {
    const label = newCategoryName.trim()
    if (!label) return

    const res = await fetch(`${API_URL}/product-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: label }),
    })
    if (!res.ok) return
    const created = (await res.json()) as ApiCategory

    setApiCategories((prev) => [...prev, created].sort((a, b) => a.id - b.id))
    setNewFood((prev) => ({ ...prev, categoryId: String(created.id) }))
    setCreateCategoryOpen(false)
  }

  function onPickImage(file: File | null) {
    setNewFood((prev) => ({ ...prev, imageFile: file }))
    if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    setNewFoodPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  function onPickEditImage(file: File | null) {
    setEditFood((prev) => ({ ...prev, imageFile: file }))
    if (editFoodPreviewUrl) URL.revokeObjectURL(editFoodPreviewUrl)
    setEditFoodPreviewUrl(file ? URL.createObjectURL(file) : editFoodPreviewUrl)
  }

  async function createFood() {
    const name = newFood.name.trim()
    const price = Number(newFood.priceDigits)
    if (!name || !Number.isFinite(price) || price <= 0) return

    const categoryId = newFood.categoryId === 'uncategorized' ? 0 : Number(newFood.categoryId)
    if (newFood.categoryId !== 'uncategorized' && !Number.isFinite(categoryId)) return

    const form = new FormData()
    form.append('name', name)
    form.append('price', newFood.priceDigits)
    form.append('category_id', String(categoryId))
    form.append('measure', newFood.measure)
    if (newFood.imageFile) form.append('image', newFood.imageFile)

    const res = await fetch(`${API_URL}/products`, { method: 'POST', body: form })
    if (!res.ok) return
    const created = (await res.json()) as ApiProduct

    const imageSrc = newFoodPreviewUrl || toImageSrc(created)
    const createdCategoryId = created.category_id ? String(created.category_id) : 'uncategorized'
    setMenuProducts((prev) => {
      const next: UiProduct = {
        id: created.id,
        name: created.name,
        price: created.price,
        imageSrc,
        categoryId: createdCategoryId,
        measure: created.measure ?? newFood.measure,
      }
      if (selectedCategoryId !== 'all' && createdCategoryId !== selectedCategoryId) return prev
      return [next, ...prev]
    })
    setCreateOpen(false)
  }

  async function updateFood() {
    const name = editFood.name.trim()
    const price = Number(editFood.priceDigits)
    if (!name || !Number.isFinite(price) || price <= 0) return

    const categoryId = editFood.categoryId === 'uncategorized' ? 0 : Number(editFood.categoryId)
    if (editFood.categoryId !== 'uncategorized' && !Number.isFinite(categoryId)) return

    const form = new FormData()
    form.append('name', name)
    form.append('price', editFood.priceDigits)
    form.append('category_id', String(categoryId))
    form.append('measure', editFood.measure)
    if (editFood.imageFile) form.append('image', editFood.imageFile)

    const res = await fetch(`${API_URL}/products/${editFood.id}`, { method: 'PUT', body: form })
    if (!res.ok) return
    const updated = (await res.json()) as ApiProduct

    const updatedCategoryId = updated.category_id ? String(updated.category_id) : 'uncategorized'
    const imageSrc = editFood.imageFile ? editFoodPreviewUrl : toImageSrc(updated)

    setMenuProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id)
      if (idx === -1) return prev

      if (selectedCategoryId !== 'all' && updatedCategoryId !== selectedCategoryId) {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      }

      const next = [...prev]
      next[idx] = {
        ...next[idx],
        name: updated.name,
        price: updated.price,
        imageSrc,
        categoryId: updatedCategoryId,
        measure: updated.measure ?? next[idx].measure,
      }
      return next
    })

    setEditOpen(false)
  }

  useEffect(() => {
    const handler = () => {
      setNewFood({ name: '', priceDigits: '', imageFile: null, categoryId: 'uncategorized', measure: 'unit' })
      setNewFoodPreviewUrl('')
      setCreateOpen(true)
    }
    window.addEventListener('pos:createFood', handler)
    return () => window.removeEventListener('pos:createFood', handler)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      const res = await fetch(`${API_URL}/product-categories`)
      if (!res.ok) return
      const list = (await res.json()) as ApiCategory[]
      if (cancelled) return
      setApiCategories(list)
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      const params = new URLSearchParams()
      if (selectedCategoryId === 'uncategorized') params.set('category_id', '0')
      else if (selectedCategoryId !== 'all') params.set('category_id', selectedCategoryId)

      const url = params.size ? `${API_URL}/products?${params.toString()}` : `${API_URL}/products`
      const res = await fetch(url)
      if (!res.ok) return
      const list = (await res.json()) as ApiProduct[]
      if (cancelled) return
      setMenuProducts(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageSrc: toImageSrc(p),
          categoryId: p.category_id ? String(p.category_id) : 'uncategorized',
          measure: p.measure ?? 'unit',
        })),
      )
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [selectedCategoryId])

  useEffect(() => {
    return () => {
      if (newFoodPreviewUrl) URL.revokeObjectURL(newFoodPreviewUrl)
    }
  }, [newFoodPreviewUrl])

  useEffect(() => {
    return () => {
      if (editFoodPreviewUrl) URL.revokeObjectURL(editFoodPreviewUrl)
    }
  }, [editFoodPreviewUrl])

  return (
    <Box
      sx={{
        height: '100dvh',
        bgcolor: 'background.default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <Navbar
          active={active}
          onNavigate={onNavigate}
          showUsers={showUsers}
          onAdd={() => setCreateOpen(true)}
          rightActions={
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={() => logout()}
                sx={{
                  width: 36,
                  height: 36,
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
          }
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Mahsulot qidirish..."
          settingsAction={
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={() => onNavigate('settings')}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          }
        />

        <Box
          sx={{
            pl: 2,
            pr: { xs: 2, md: 0 },
            pt: 0,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 276px', lg: 'minmax(0, 1fr) 292px' },
              gap: 2,
              alignItems: 'stretch',
              flex: 1,
              minHeight: 0,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                minHeight: 0,
                height: '100%',
                overflow: { xs: 'visible', md: 'hidden' },
                pr: { md: 1 },
                pt: 2,
                pb: { xs: 12, md: 0 },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <PosCategoryStrip
                categories={menuCategories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />

              <Box sx={{ minHeight: 0, flex: 1, overflow: { xs: 'visible', md: 'auto' } }}>
                <PosProductsGrid
                  visibleProducts={visibleProducts}
                  onAddToCart={addToCart}
                  onBeginLongPress={beginLongPress}
                  onCancelLongPress={cancelLongPress}
                  longPressFiredRef={longPressFiredRef}
                />
              </Box>
            </Box>

            <PosCartPanel
              cartCount={cartCount}
              cartLines={cartLines}
              cartItemsRef={cartItemsRef}
              isEditingTotal={isEditingTotal}
              discountDigits={discountDigits}
              discountedTotal={discountedTotal}
              isPlacingOrder={isPlacingOrder}
              onClearCart={clearCart}
              onSetQty={setQty}
              onToggleEditTotal={toggleEditTotal}
              onDiscountDigitsChange={setDiscountDigits}
              onPlaceOrder={placeOrder}
            />
          </Box>
        </Box>

      <Dialog
        open={createOpen}
        onClose={closeCreateFood}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: '780px' },
            height: { xs: 'calc(100dvh - 32px)', sm: '90dvh' },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: 920 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>Mahsulot yaratish</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 2 }}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Nomi"
                value={newFood.name}
                onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Narxi"
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

                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id="new-food-measure-label">O'lchov</InputLabel>
                  <Select
                    labelId="new-food-measure-label"
                    label="O'lchov"
                    value={newFood.measure}
                    onChange={(e) =>
                      setNewFood((prev) => ({
                        ...prev,
                        measure: e.target.value as NewFoodForm['measure'],
                      }))
                    }
                  >
                    <MenuItem value="unit">Dona</MenuItem>
                    <MenuItem value="gram">Gram</MenuItem>
                    <MenuItem value="portion">Porsiya</MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" gap={1} sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel id="new-food-category-label">Kategoriya</InputLabel>
                    <Select
                      labelId="new-food-category-label"
                      label="Kategoriya"
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
                  <Tooltip title="Kategoriya qo'shish" placement="top">
                    <IconButton
                      aria-label="Kategoriya qo'shish"
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
                <Typography sx={{ fontWeight: 900 }}>Rasm yuklash</Typography>
                <Typography variant="body2" color="text.secondary">
                  Menyu kartasi foni uchun rasm yuklang.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}>
                  <Button component="label" variant="outlined">
                    Rasm tanlash
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                    />
                  </Button>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {newFood.imageFile ? newFood.imageFile.name : 'Fayl tanlanmagan'}
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
                      Rasm ko'rinishi
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Box>

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={closeCreateFood}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
          >
            Bekor qilish
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={createFood}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
          >
            Yaratish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={closeEditFood}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: '780px' },
            height: { xs: 'calc(100dvh - 32px)', sm: '90dvh' },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: 920 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>Mahsulotni tahrirlash</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 2 }}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Nomi"
                value={editFood.name}
                onChange={(e) => setEditFood((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Narxi"
                  value={formatIntegerForInput(editFood.priceDigits)}
                  onChange={(e) =>
                    setEditFood((prev) => ({
                      ...prev,
                      priceDigits: e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18),
                    }))
                  }
                  inputMode="numeric"
                  sx={{ flex: 1 }}
                />

                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id="edit-food-measure-label">O'lchov</InputLabel>
                  <Select
                    labelId="edit-food-measure-label"
                    label="O'lchov"
                    value={editFood.measure}
                    onChange={(e) =>
                      setEditFood((prev) => ({
                        ...prev,
                        measure: e.target.value as EditFoodForm['measure'],
                      }))
                    }
                  >
                    <MenuItem value="unit">Dona</MenuItem>
                    <MenuItem value="gram">Gram</MenuItem>
                    <MenuItem value="portion">Porsiya</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id="edit-food-category-label">Kategoriya</InputLabel>
                  <Select
                    labelId="edit-food-category-label"
                    label="Kategoriya"
                    value={editFood.categoryId}
                    onChange={(e) => setEditFood((prev) => ({ ...prev, categoryId: String(e.target.value) }))}
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
              </Stack>

              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, display: 'grid', gap: 1 }}>
                <Typography sx={{ fontWeight: 900 }}>Rasm yuklash</Typography>
                <Typography variant="body2" color="text.secondary">
                  Menyu kartasi foni uchun rasm yuklang.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}>
                  <Button component="label" variant="outlined">
                    Rasm tanlash
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickEditImage(e.target.files?.[0] ?? null)}
                    />
                  </Button>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {editFood.imageFile ? editFood.imageFile.name : 'Fayl tanlanmagan'}
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
                    backgroundImage: editFoodPreviewUrl ? `url("${editFoodPreviewUrl}")` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!editFoodPreviewUrl && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Rasm ko'rinishi
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Box>

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={closeEditFood}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
          >
            Bekor qilish
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={updateFood}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createCategoryOpen} onClose={closeCreateCategory} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>Kategoriya yaratish</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" variant="contained" onClick={closeCreateCategory}>
            Bekor qilish
          </Button>
          <Button color="success" variant="contained" onClick={createCategory}>
            Yaratish
          </Button>
        </DialogActions>
      </Dialog>

        <Menu
          open={!!productMenu}
          onClose={() => setProductMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={productMenu ? { left: productMenu.left, top: productMenu.top } : undefined}
        >
          <MenuItem
            onClick={() => {
              if (!productMenu) return
              const target = productMenu.product
              setProductMenu(null)
              openEditFood(target)
            }}
          >
            Tahrirlash
          </MenuItem>
          <MenuItem onClick={() => setProductMenu(null)}>Bekor qilish</MenuItem>
        </Menu>

      </Box>
    </Box>
  )
}

