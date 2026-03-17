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
  Menu,
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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Slide,
} from '@mui/material'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

import { API_URL } from '../../../config/env'
import { getCurrentUser, logout } from '../../../shared/auth'
import Numpad from '../../../shared/components/ui/Numpad'

type ApiProduct = {
  id: number
  name: string
  price: number
  image_path?: string | null
  category_id?: number | null
  measure?: 'unit' | 'gram' | 'portion' | null
}

type ApiCategory = {
  id: number
  name: string
  image_path?: string | null
}

type UiProduct = {
  id: number
  name: string
  price: number
  imageSrc: string
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
}

type CartLine = {
  product: UiProduct
  qty: number
}

type Category = {
  id: string
  label: string
  imageSrc: string
}

type NewFoodForm = {
  name: string
  priceDigits: string
  imageFile: File | null
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
}

type EditFoodForm = {
  id: number
  name: string
  priceDigits: string
  imageFile: File | null
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
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

  const trimmed = raw.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')

  const mediaMarker = '/media/'
  const mediaIdx = normalized.lastIndexOf(mediaMarker)
  if (mediaIdx !== -1) {
    const tail = normalized.slice(mediaIdx)
    return `${API_URL}${tail}`
  }

  const productsMarker = '/products/'
  const productsIdx = normalized.lastIndexOf(productsMarker)
  if (productsIdx !== -1) {
    const filename = normalized.slice(productsIdx + productsMarker.length)
    return `${API_URL}/media/products/${filename}`
  }

  const filename = normalized.split('/').filter(Boolean).at(-1)
  if (filename) return `${API_URL}/media/products/${filename}`

  return '/mock-images/photo_1_2026-03-11_22-51-02.jpg'
}

const DEFAULT_CATEGORY_IMAGE_SRC = '/category-default.svg'

function toCategoryImageSrc(apiCategory: ApiCategory) {
  const raw = apiCategory.image_path
  if (!raw) return DEFAULT_CATEGORY_IMAGE_SRC

  const trimmed = raw.trim()
  if (!trimmed) return DEFAULT_CATEGORY_IMAGE_SRC
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalized = trimmed.replaceAll('\\', '/')
  if (normalized.startsWith('/')) return `${API_URL}${normalized}`
  return `${API_URL}/${normalized}`
}

export default function PosPage() {
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [menuProducts, setMenuProducts] = useState<UiProduct[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [createKeyboardInput, setCreateKeyboardInput] = useState<'name' | 'priceDigits'>('name')
  const [createKeyboardLayout, setCreateKeyboardLayout] = useState<'default' | 'shift'>('default')
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
  const [editKeyboardInput, setEditKeyboardInput] = useState<'name' | 'priceDigits'>('name')
  const [editKeyboardLayout, setEditKeyboardLayout] = useState<'default' | 'shift'>('default')
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

  function addDiscountDigit(digit: string) {
    setDiscountDigits((prev) => (prev + digit).replace(/^0+(?=\d)/, ''))
  }

  function discountBackspace() {
    setDiscountDigits((prev) => prev.slice(0, -1))
  }

  function discountClear() {
    setDiscountDigits('')
  }

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
      window.setTimeout(() => {
        hasMovedRef.current = false
      }, 0)
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
          onClickCapture={(e) => {
            if (!hasMovedRef.current) return
            e.preventDefault()
            e.stopPropagation()
          }}
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

  function wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines.length === 0 ? [''] : lines
  }

  function centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length)
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
  }

async function generateReceipt(orderData: {
  id: number
  total_price: number
  discount_amount?: number | null
  created_at: string
  user: { id: number; username: string; position: string | null }
  items: Array<{
    product: { id: number; name: string; price: number }
    quantity: number
  }>
}): Promise<string> {
  const tableWidth = 48

  // STRICT widths (must match tableWidth)
  const idWidth = 3
  const nameWidth = 20
  const qtyWidth = 4
  const priceWidth = 8
  const subtotalWidth = 7

  const programName =
    (localStorage.getItem('programName') || 'Restoran Cheki').trim() ||
    'Restoran Cheki'

  let requisites: any = null
  try {
    const res = await fetch(`${API_URL}/cheque/requisites`)
    if (res.ok) requisites = await res.json()
  } catch {}

  const lines: string[] = []

  function buildRow(cols: string[]) {
    return (
      "|" +
      cols[0].padEnd(idWidth) + "|" +
      cols[1].padEnd(nameWidth) + "|" +
      cols[2].padEnd(qtyWidth) + "|" +
      cols[3].padEnd(priceWidth) + "|" +
      cols[4].padEnd(subtotalWidth) +
      "|"
    )
  }
  function formatNumberPlain(n: number): string {
    return String(Math.round(n))
  }
  function separator() {
    return "-".repeat(tableWidth)
  }

  function safeLine(text: string) {
    return text.length > tableWidth
      ? text.slice(0, tableWidth)
      : text.padEnd(tableWidth)
  }

  function pushRight(label: string, value: string) {
    if (!value) return
    const combined = `${label} ${value}`
    if (combined.length <= tableWidth) {
      lines.push(label.padEnd(tableWidth - value.length) + value)
    } else {
      const wrapped = wrapText(combined, tableWidth)
      for (const l of wrapped) lines.push(l)
    }
  }

  const today = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const username = orderData.user.username
  const position = orderData.user.position || '-'

  lines.push(safeLine('Sana: '.padEnd(tableWidth - today.length) + today))
  lines.push(safeLine('Ism: '.padEnd(tableWidth - username.length) + username))
  lines.push(safeLine('Lavozimi: '.padEnd(tableWidth - position.length) + position))
  lines.push('')

  // Header
  lines.push(separator())
  lines.push('|' + centerText(programName, tableWidth - 2) + '|')
  lines.push(separator())

  // Datetime
  const dt = new Date(orderData.created_at)
  if (!isNaN(dt.getTime())) {
    const dateStr = dt.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    lines.push('|' + centerText(dateStr, tableWidth - 2) + '|')
    lines.push(separator())
  }

  // Table
  lines.push(buildRow(['ID', 'Nomi', 'Soni', 'Narx', 'Jami']))
  lines.push(separator())

  let totalAmount = 0

  for (const item of orderData.items) {
    const id = String(item.product.id)
    const nameLines = wrapText(item.product.name, nameWidth)
    const qty = String(item.quantity)
    const price = formatNumberPlain(item.product.price)
    const subtotal = formatNumberPlain(item.quantity * item.product.price)

    totalAmount += item.quantity * item.product.price

    lines.push(buildRow([id, nameLines[0], qty, price, subtotal]))

    for (let i = 1; i < nameLines.length; i++) {
      lines.push(buildRow(['', nameLines[i], '', '', '']))
    }
  }

  lines.push(separator())

  const originalTotal = Math.round(orderData.total_price ?? totalAmount)
  const discountAmount = Math.max(0, Number(orderData.discount_amount ?? 0) || 0)
  const discountedTotal = Math.max(0, originalTotal - discountAmount)

  const totalLine = `Umumiy Summa: ${formatNumberPlain(originalTotal)} so'm`
  lines.push('|' + totalLine.padEnd(tableWidth - 2) + '|')

  const discountLine = `Chegirmali Summa: ${formatNumberPlain(discountedTotal)} so'm`
  lines.push('|' + discountLine.padEnd(tableWidth - 2) + '|')

  lines.push(separator())

  // ===== REQUISITES =====
  const req = requisites || {}

  const companyName = req.company_name?.trim() || ''
  const address = req.address?.trim() || ''
  const phone = req.phone_number?.trim() || ''
  const stir = (req.STIR ?? req.stir ?? '').toString().trim()
  const registry = (req.registry_number ?? '').toString().trim()

  if (companyName) {
    for (const l of wrapText(companyName, tableWidth)) {
      lines.push(l.padStart(tableWidth))
    }
  }

  pushRight('STIR:', stir)
  pushRight('Telefon:', phone)
  pushRight('Reestr Raqami:', registry)

  if (address) {
    for (const l of wrapText(address, tableWidth)) {
      lines.push(l)
    }
  }

  // Footer
  lines.push('')
  lines.push('')
  lines.push(centerText('Tashrifingizdan mamnunmiz!', tableWidth))

  return lines.join('\n')
}

  async function printReceipt(receiptContent: string) {
    try {
      const response = await fetch(
        `${API_URL}/cheque/print?content=${encodeURIComponent(receiptContent)}`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Error printing receipt:', error)
    }
  }

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
    setEditKeyboardInput('name')
    setEditKeyboardLayout('default')
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
            <RestaurantMenuIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Parhez Plyus
            </Typography>
          </Stack>

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            placeholder="Mahsulot qidirish..."
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
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
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

            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={() => logout()}
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
        <Box
          sx={{
            mb: 2,
            overflowX: 'auto',
            pb: 0.5,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {menuCategories.map((c) => {
            const selected = c.id === selectedCategoryId
            return (
              <Box
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  flex: '0 0 auto',
                  width: 92,
                  textAlign: 'center',
                }}
              >
                <Box
                  component="img"
                  alt={c.label}
                  src={c.imageSrc}
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith(DEFAULT_CATEGORY_IMAGE_SRC)) return
                    e.currentTarget.src = DEFAULT_CATEGORY_IMAGE_SRC
                  }}
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    borderRadius: 999,
                    objectFit: 'cover',
                    border: '3px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    boxShadow: selected ? 2 : 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, fontWeight: selected ? 1000 : 800, lineHeight: 1.1 }}
                  noWrap
                >
                  {c.label}
                </Typography>
              </Box>
            )
          })}
        </Box>

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
                    Hali mahsulot yo'q
                  </Typography>
                  <Typography variant="body2">
                    Pastki paneldagi <b>+</b> tugmasi orqali taom va ichimlik qo'shing.
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
                    lg: 'repeat(4, 1fr)',
                    xl: 'repeat(5, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {visibleProducts.map((p) => (
                  <Card key={p.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <CardActionArea
                      onClick={(e) => {
                        if (longPressFiredRef.current) {
                          longPressFiredRef.current = false
                          e.preventDefault()
                          e.stopPropagation()
                          return
                        }
                        addToCart(p)
                      }}
                      onMouseDown={(e) => beginLongPress(p, e.clientX, e.clientY)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={(e) => {
                        const t = e.touches[0]
                        if (!t) return
                        beginLongPress(p, t.clientX, t.clientY)
                      }}
                      onTouchEnd={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      sx={{ height: '100%' }}
                    >
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
                          <Typography sx={{ opacity: 0.95, fontWeight: 900, fontSize: 42, lineHeight: 1.05 }}>
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
              position: 'relative',
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
              <Typography sx={{ fontWeight: 900 }}>Savat</Typography>
              <IconButton aria-label="Buyurtmani tozalash" onClick={clearCart} disabled={cartCount === 0}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Box ref={cartItemsRef} sx={{ flex: 1, minHeight: 0, overflow: 'visible', position: 'relative' }}>
              <Slide
                in={isEditingTotal}
                direction="up"
                container={cartItemsRef.current}
                mountOnEnter
                unmountOnExit
                timeout={180}
              >
                <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      mb: 1.25,
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: '0 14px 30px rgba(0,0,0,0.08)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Typography sx={{ fontWeight: 1000, fontSize: 24, lineHeight: 1.1, textAlign: 'center' }}>
                      {formatIntegerForInput(discountDigits) || '0'}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, mt: 0.5, textAlign: 'center' }}>
                      Chegirmali summa
                    </Typography>
                    <TextField
                      value={discountDigits}
                      onChange={(e) => setDiscountDigits(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
                      inputMode="numeric"
                      fullWidth
                      size="small"
                      sx={{ mt: 1 }}
                    />
                    <Numpad onDigit={addDiscountDigit} onClear={discountClear} onBackspace={discountBackspace} />
                  </Paper>
                </Box>
              </Slide>
              <List dense disablePadding sx={{ height: '100%', overflow: 'auto' }}>
                {cartLines.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography sx={{ fontWeight: 700 }}>Hali mahsulot yo'q</Typography>
                    <Typography variant="body2">Buyurtmaga qo'shish uchun mahsulotni bosing.</Typography>
                  </Box>
                ) : (
                  cartLines.map((line) => (
                    <SwipeToDeleteRow key={line.product.id} onDelete={() => setQty(line.product.id, 0)}>
                      <Box
                        sx={{
                          px: 0,
                          py: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                        }}
                      >
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
                            flex: '0 0 auto',
                          }}
                        />

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Typography sx={{ fontWeight: 800 }} noWrap>
                            {line.product.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 800 }} noWrap>
                            {formatMoney(line.product.price * line.qty)}
                          </Typography>
                        </Box>

                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: '0 0 auto' }}>
                          <IconButton
                            size="small"
                            aria-label="Miqdorni kamaytirish"
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
                            aria-label="Miqdorni oshirish"
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
                      </Box>
                    </SwipeToDeleteRow>
                  ))
                )}
              </List>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Stack sx={{ mb: 2, mt: 'auto' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>Jami</Typography>
                <Typography
                  onClick={toggleEditTotal}
                  sx={{
                    fontWeight: 1100,
                    fontSize: 28,
                    cursor: cartCount === 0 ? 'default' : 'pointer',
                    userSelect: 'none',
                    transition: 'color 140ms ease',
                    ...(cartCount === 0
                      ? {}
                      : {
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }),
                  }}
                >
                  {formatMoney(discountedTotal)}
                </Typography>
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
                onClick={() => placeOrder()}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                fullWidth
              >
                Hozir to'lash
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
                Bekor qilish
              </Button>
            </Box>
          </Paper>
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
                onFocus={() => setCreateKeyboardInput('name')}
                onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Narxi"
                  value={formatIntegerForInput(newFood.priceDigits)}
                  onFocus={() => setCreateKeyboardInput('priceDigits')}
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

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 1.5,
              overflowX: 'auto',
              '& .simple-keyboard': {
                transform: 'scale(1.4)',
                transformOrigin: 'top left',
                width: 'calc(100% / 1.4)',
              },
            }}
          >
            <Keyboard
              input={{ name: newFood.name, priceDigits: newFood.priceDigits }}
              inputName={createKeyboardInput}
              layoutName={createKeyboardLayout}
              onChange={(value) => {
                if (createKeyboardInput === 'name') {
                  setNewFood((prev) => ({ ...prev, name: value }))
                  return
                }
                setNewFood((prev) => ({ ...prev, priceDigits: value.replaceAll(/[^\d]/g, '').slice(0, 18) }))
              }}
              onKeyPress={(btn) => {
                if (btn === '{shift}' || btn === '{lock}') {
                  setCreateKeyboardLayout((prev) => (prev === 'default' ? 'shift' : 'default'))
                }
              }}
            />
          </Paper>
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
                onFocus={() => setEditKeyboardInput('name')}
                onChange={(e) => setEditFood((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Narxi"
                  value={formatIntegerForInput(editFood.priceDigits)}
                  onFocus={() => setEditKeyboardInput('priceDigits')}
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

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 1.5,
              overflowX: 'auto',
              '& .simple-keyboard': {
                transform: 'scale(1.4)',
                transformOrigin: 'top left',
                width: 'calc(100% / 1.4)',
              },
            }}
          >
            <Keyboard
              input={{ name: editFood.name, priceDigits: editFood.priceDigits }}
              inputName={editKeyboardInput}
              layoutName={editKeyboardLayout}
              onChange={(value) => {
                if (editKeyboardInput === 'name') {
                  setEditFood((prev) => ({ ...prev, name: value }))
                  return
                }
                setEditFood((prev) => ({ ...prev, priceDigits: value.replaceAll(/[^\d]/g, '').slice(0, 18) }))
              }}
              onKeyPress={(btn) => {
                if (btn === '{shift}' || btn === '{lock}') {
                  setEditKeyboardLayout((prev) => (prev === 'default' ? 'shift' : 'default'))
                }
              }}
            />
          </Paper>
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
  )
}
