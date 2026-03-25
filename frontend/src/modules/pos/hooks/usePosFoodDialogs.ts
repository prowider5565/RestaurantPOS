import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import { API_URL } from '../../../config/env'
import { compressProductImage } from '../imageCompression'
import type { ApiCategory, ApiProduct, EditFoodForm, NewFoodForm, UiProduct } from '../types'
import { toImageSrc } from '../utils'

type UsePosFoodDialogsOptions = {
  selectedCategoryId: string
  setApiCategories: Dispatch<SetStateAction<ApiCategory[]>>
  setMenuProducts: Dispatch<SetStateAction<UiProduct[]>>
}

export function usePosFoodDialogs({
  selectedCategoryId,
  setApiCategories,
  setMenuProducts,
}: UsePosFoodDialogsOptions) {
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
    openEditFood,
  }
}
