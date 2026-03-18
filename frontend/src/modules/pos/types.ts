export type ApiProduct = {
  id: number
  name: string
  price: number
  image_path?: string | null
  category_id?: number | null
  measure?: 'unit' | 'gram' | 'portion' | null
}

export type ApiCategory = {
  id: number
  name: string
  image_path?: string | null
}

export type UiProduct = {
  id: number
  name: string
  price: number
  imageSrc: string
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
}

export type CartLine = {
  product: UiProduct
  qty: number
}

export type Category = {
  id: string
  label: string
  imageSrc: string
}

export type NewFoodForm = {
  name: string
  priceDigits: string
  imageFile: File | null
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
}

export type EditFoodForm = {
  id: number
  name: string
  priceDigits: string
  imageFile: File | null
  categoryId: string
  measure: 'unit' | 'gram' | 'portion'
}

export type ReceiptOrderData = {
  id: number
  total_price: number
  discount_amount?: number | null
  created_at: string
  user: { id: number; username: string; position: string | null }
  items: Array<{
    product: { id: number; name: string; price: number }
    quantity: number
  }>
}
