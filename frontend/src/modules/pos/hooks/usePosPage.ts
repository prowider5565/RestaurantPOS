import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getCurrentUser } from '../../../shared/auth'
import { compressProductImage } from '../imageCompression'
import { printReceipt } from '../receipt'
import type {
  ApiCategory,
  ApiOrderTable,
  ApiProduct,
  CartLine,
  Category,
  EditFoodForm,
  NewFoodForm,
  NewOrderTableForm,
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
  const [orderTables, setOrderTables] = useState<ApiOrderTable[]>([])
  const [selectedOrderTableId, setSelectedOrderTableId] = useState('')
  const [createTableOpen, setCreateTableOpen] = useState(false)
  const [newOrderTable, setNewOrderTable] = useState<NewOrderTableForm>({
    tableNumberDigits: '',
    tableColor: '#FFE5B4',
  })

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
  const [includeWaiterFee, setIncludeWaiterFee] = useState(true)

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
  const waitressWage = useMemo(() => (includeWaiterFee ? Math.round(subtotalInt * 0.1) : 0), [includeWaiterFee, subtotalInt])
  const totalWithWaitressWage = useMemo(() => subtotalInt + waitressWage, [subtotalInt, waitressWage])
  const discountedSubtotal = useMemo(() => {
    const raw = discountedTotalOverride ?? subtotalInt
    if (!Number.isFinite(raw)) return subtotalInt
    return Math.min(Math.max(Math.round(raw), 0), subtotalInt)
  }, [discountedTotalOverride, subtotalInt])

  const discountedTotal = useMemo(() => {
    if (isEditingTotal) {
      const nextValue = discountDigits ? Number(discountDigits) : 0
      if (!Number.isFinite(nextValue)) return totalWithWaitressWage
      return Math.min(Math.max(Math.round(nextValue), waitressWage), totalWithWaitressWage)
    }

    return discountedSubtotal + waitressWage
  }, [discountDigits, discountedSubtotal, isEditingTotal, totalWithWaitressWage, waitressWage])

  function toggleEditTotal() {
    if (cartCount === 0) return

    if (!isEditingTotal) {
      setDiscountDigits(String(discountedTotal))
      setIsEditingTotal(true)
      return
    }

    const nextValue = discountDigits ? Number(discountDigits) : 0
    const nextTotal = Number.isFinite(nextValue)
      ? Math.min(Math.max(Math.round(nextValue), waitressWage), totalWithWaitressWage)
      : totalWithWaitressWage
    const nextSubtotal = Math.min(Math.max(nextTotal - waitressWage, 0), subtotalInt)
    setDiscountedTotalOverride(nextSubtotal === subtotalInt ? null : nextSubtotal)
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
  }

  async function placeOrder() {
    if (cartLines.length === 0 || isPlacingOrder || !selectedOrderTableId) return

    setIsPlacingOrder(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      const payload = {
        total: subtotalInt,
        discounted_total: discountedSubtotal,
        user_id: currentUser.id,
        order_table_id: Number(selectedOrderTableId),
        waiter_fee: includeWaiterFee,
        items: cartLines.map((line) => ({ product: line.product.id, quantity: line.qty })),
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return

      const orderData = await response.json()
      const selectedOrderTable = orderTables.find((table) => String(table.id) === selectedOrderTableId)
      await printReceipt({
        ...orderData,
        order_table: selectedOrderTable
          ? {
              id: selectedOrderTable.id,
              table_number: selectedOrderTable.table_number,
              table_color: selectedOrderTable.table_color,
            }
          : orderData.order_table ?? null,
      })
      clearCart()
    } finally {
      setIsPlacingOrder(false)
    }
  }

  function openCreateTable() {
    setNewOrderTable({
      tableNumberDigits: '',
      tableColor: '#FFE5B4',
    })
    setCreateTableOpen(true)
  }

  function closeCreateTable() {
    setCreateTableOpen(false)
  }

  async function createOrderTable() {
    const tableNumber = Number(newOrderTable.tableNumberDigits)
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) return

    const response = await fetch(`${API_URL}/orders/tables/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_number: tableNumber,
        table_color: newOrderTable.tableColor,
      }),
    })
    if (!response.ok) return

    const created = (await response.json()) as ApiOrderTable
    setOrderTables((prev) => [...prev, created].sort((a, b) => a.table_number - b.table_number))
    setSelectedOrderTableId(String(created.id))
    setCreateTableOpen(false)
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

    async function loadOrderTables() {
      const response = await fetch(`${API_URL}/orders/tables`)
      if (!response.ok) return
      const list = (await response.json()) as ApiOrderTable[]
      if (cancelled) return
      setOrderTables(list)
      setSelectedOrderTableId((prev) => {
        if (prev && list.some((table) => String(table.id) === prev)) return prev
        return list[0] ? String(list[0].id) : ''
      })
    }

    loadOrderTables()
    return () => {
      cancelled = true
    }
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
    orderTables,
    selectedOrderTableId,
    setSelectedOrderTableId,
    createTableOpen,
    openCreateTable,
    closeCreateTable,
    newOrderTable,
    setNewOrderTable,
    createOrderTable,
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
    waitressWage,
    discountedTotal,
    includeWaiterFee,
    setIncludeWaiterFee,
    toggleEditTotal,
    isPlacingOrder,
    placeOrder,
    createOpen,
    openCreateFood,
    closeCreateFood,
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
