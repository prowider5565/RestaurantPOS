import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'
import {getAuthHeaders,  getCurrentUser } from '../../../shared/auth'
import { compressProductImage } from '../imageCompression'


import type {
  ApiCategory,
  ApiProduct,
  CartLine,
  Category,
  EditFoodForm,
  NewFoodForm,
  PaymentType,
  UiProduct,
} from '../types'
import { DEFAULT_CATEGORY_IMAGE_SRC, toCategoryImageSrc, toImageSrc } from '../utils'

type ProductMenuState = {
  product: UiProduct
  left: number
  top: number
} | null

export function usePosPage() {
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
  const [newFoodPreviewUrl, setNewFoodPreviewUrl] = useState('')
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
  const [editFoodPreviewUrl, setEditFoodPreviewUrl] = useState('')

  const [productMenu, setProductMenu] = useState<ProductMenuState>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)
  const cartItemsRef = useRef<HTMLDivElement | null>(null)

  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [discountDigits, setDiscountDigits] = useState('')
  const [discountedTotalOverride, setDiscountedTotalOverride] = useState<number | null>(null)
  const [isDebt, setIsDebt] = useState(false)
  const [debtPaidAmountDigits, setDebtPaidAmountDigits] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('Naqd')
  const [cashbackOpen, setCashbackOpen] = useState(false)
  const [cashbackTotalAmount, setCashbackTotalAmount] = useState(0)
  const [cashbackPaidValues, setCashbackPaidValues] = useState<number[]>([])

  const cashbackPaidAmount = useMemo(
    () => cashbackPaidValues.reduce((sum, value) => sum + value, 0),
    [cashbackPaidValues],
  )
  const cashbackAmount = useMemo(
    () => Math.max(0, cashbackPaidAmount - cashbackTotalAmount),
    [cashbackPaidAmount, cashbackTotalAmount],
  )

  const menuCategories: Category[] = useMemo(() => {
    const base: Category[] = [{ id: 'all', label: 'Barchasi', imageSrc: DEFAULT_CATEGORY_IMAGE_SRC }]

    return [
      ...base,
      ...apiCategories.map((category) => ({
        id: String(category.id),
        label: category.name,
        imageSrc: toCategoryImageSrc(category),
      })),
    ]
  }, [apiCategories])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return menuProducts.filter((product) => (!query ? true : product.name.toLowerCase().includes(query)))
  }, [menuProducts, search])

  const cartLines = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty, 0), [cartLines])
  const subtotal = useMemo(() => cartLines.reduce((sum, line) => sum + line.qty * line.product.price, 0), [cartLines])
  const subtotalInt = useMemo(() => Math.round(subtotal), [subtotal])
  const discountedSubtotal = useMemo(() => {
    const raw = discountedTotalOverride ?? subtotalInt
    if (!Number.isFinite(raw)) return subtotalInt
    return Math.min(Math.max(Math.round(raw), 0), subtotalInt)
  }, [discountedTotalOverride, subtotalInt])

  const discountedTotal = useMemo(() => {
    if (isEditingTotal) {
      const nextValue = discountDigits ? Number(discountDigits) : 0
      if (!Number.isFinite(nextValue)) return subtotalInt
      return Math.min(Math.max(Math.round(nextValue), 0), subtotalInt)
    }

    return discountedSubtotal
  }, [discountDigits, discountedSubtotal, isEditingTotal, subtotalInt])

  const debtPaidAmount = useMemo(() => {
    const parsed = Number(debtPaidAmountDigits || '0')
    if (!Number.isFinite(parsed)) return 0
    return Math.min(Math.max(Math.round(parsed), 0), discountedTotal)
  }, [debtPaidAmountDigits, discountedTotal])

  function toggleEditTotal() {
    if (cartCount === 0) return

    if (!isEditingTotal) {
      setDiscountDigits(String(discountedTotal))
      setIsEditingTotal(true)
      return
    }

    const nextValue = discountDigits ? Number(discountDigits) : 0
    const nextTotal = Number.isFinite(nextValue)
      ? Math.min(Math.max(Math.round(nextValue), 0), subtotalInt)
      : subtotalInt
    setDiscountedTotalOverride(nextTotal === subtotalInt ? null : nextTotal)
    setIsEditingTotal(false)
  }

  const addToCart = useCallback((product: UiProduct) => {
    setCart((prev) => {
      const existing = prev[String(product.id)]
      const nextQty = existing ? existing.qty + 1 : 1
      return { ...prev, [String(product.id)]: { product, qty: nextQty } }
    })
  }, [])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current == null) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  const beginLongPress = useCallback((product: UiProduct, left: number, top: number) => {
    clearLongPressTimer()
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setProductMenu({ product, left, top })
      clearLongPressTimer()
    }, 550)
  }, [clearLongPressTimer])

  const cancelLongPress = useCallback(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

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
    setIsDebt(false)
    setDebtPaidAmountDigits('')
  }

  async function placeOrder() {
    if (cartLines.length === 0 || isPlacingOrder) return

    setIsPlacingOrder(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const payload = {
        total: subtotalInt,
        discounted_total: discountedSubtotal,
        user_id: currentUser.id,
        payment_type: paymentType,
        is_debt: isDebt,
        paid_amount: isDebt ? debtPaidAmount : discountedTotal,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }
      await fetch(`${API_URL}/orders`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (paymentType === 'Naqd' && !isDebt) {
        setCashbackTotalAmount(discountedTotal)
        setCashbackPaidValues([])
        setCashbackOpen(true)
      }
      clearCart()
    } finally {
      setIsPlacingOrder(false)
    }
  }

  function closeCashbackDialog() {
    setCashbackOpen(false)
  }

  function addCashbackMoney(value: number) {
    setCashbackPaidValues((prev) => [...prev, value])
  }

  function resetCashbackMoney() {
    setCashbackPaidValues([])
  }

  function resetNewFood() {
    setNewFood({
      name: '',
      priceDigits: '',
      imageFile: null,
      categoryId: 'uncategorized',
      measure: 'unit',
    })
    setNewFoodPreviewUrl('')
  }

  function closeCreateFood() {
    setCreateOpen(false)
  }

  function closeEditFood() {
    setEditOpen(false)
  }

  function openCreateFood() {
    resetNewFood()
    setCreateOpen(true)
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
    const name = newCategoryName.trim()
    if (!name) return

    const response = await fetch(`${API_URL}/product-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) return

    const created = (await response.json()) as ApiCategory
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
    if (newFood.imageFile) {
      const compressedImage = await compressProductImage(newFood.imageFile)
      form.append('image', compressedImage)
    }

    const response = await fetch(`${API_URL}/products`, { method: 'POST', body: form })
    if (!response.ok) return
    const created = (await response.json()) as ApiProduct

    const imageSrc = newFoodPreviewUrl || toImageSrc(created)
    const createdCategoryId = created.category_id ? String(created.category_id) : 'uncategorized'

    setMenuProducts((prev) => {
      const nextProduct: UiProduct = {
        id: created.id,
        name: created.name,
        price: created.price,
        imageSrc,
        categoryId: createdCategoryId,
        measure: created.measure ?? newFood.measure,
      }
      if (selectedCategoryId !== 'all' && createdCategoryId !== selectedCategoryId) return prev
      return [nextProduct, ...prev]
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

    const response = await fetch(`${API_URL}/products/${editFood.id}`, { method: 'PUT', body: form })
    if (!response.ok) return
    const updated = (await response.json()) as ApiProduct

    const updatedCategoryId = updated.category_id ? String(updated.category_id) : 'uncategorized'
    const imageSrc = editFood.imageFile ? editFoodPreviewUrl : toImageSrc(updated)

    setMenuProducts((prev) => {
      const index = prev.findIndex((product) => product.id === updated.id)
      if (index === -1) return prev

      if (selectedCategoryId !== 'all' && updatedCategoryId !== selectedCategoryId) {
        const next = [...prev]
        next.splice(index, 1)
        return next
      }

      const next = [...prev]
      next[index] = {
        ...next[index],
        name: updated.name,
        price: updated.price,
        imageSrc,
        categoryId: updatedCategoryId,
        measure: updated.measure ?? next[index].measure,
      }
      return next
    })

    setEditOpen(false)
  }

  useEffect(() => {
    if (cartCount !== 0) return
    setIsEditingTotal(false)
    setDiscountDigits('')
    setDiscountedTotalOverride(null)
  }, [cartCount])

  useEffect(() => {
    const handler = () => openCreateFood()
    window.addEventListener('pos:createFood', handler)
    return () => window.removeEventListener('pos:createFood', handler)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      const response = await fetch(`${API_URL}/product-categories`)
      if (!response.ok) return
      const list = (await response.json()) as ApiCategory[]
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
      const response = await fetch(url)
      if (!response.ok) return
      const list = (await response.json()) as ApiProduct[]
      if (cancelled) return

      setMenuProducts(
        list.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageSrc: toImageSrc(product),
          categoryId: product.category_id ? String(product.category_id) : 'uncategorized',
          measure: product.measure ?? 'unit',
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

  return {
    search,
    setSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    cartLines,
    cartCount,
    cartItemsRef,
    visibleProducts,
    menuCategories,
    longPressFiredRef,
    beginLongPress,
    cancelLongPress,
    addToCart,
    setQty,
    clearCart,
    isEditingTotal,
    discountDigits,
    setDiscountDigits,
    discountedTotal,
    isDebt,
    debtPaidAmountDigits,
    paymentType,
    cashbackOpen,
    cashbackTotalAmount,
    cashbackPaidAmount,
    cashbackAmount,
    setIsDebt,
    setDebtPaidAmountDigits,
    setPaymentType,
    toggleEditTotal,
    isPlacingOrder,
    placeOrder,
    createOpen,
    openCreateFood,
    closeCreateFood,
    closeCashbackDialog,
    addCashbackMoney,
    resetCashbackMoney,
    newFood,
    setNewFood,
    newFoodPreviewUrl,
    onPickImage,
    createFood,
    createCategoryOpen,
    openCreateCategory,
    closeCreateCategory,
    newCategoryName,
    setNewCategoryName,
    createCategory,
    editOpen,
    closeEditFood,
    editFood,
    setEditFood,
    editFoodPreviewUrl,
    onPickEditImage,
    updateFood,
    productMenu,
    setProductMenu,
    openEditFood,
  }
}
