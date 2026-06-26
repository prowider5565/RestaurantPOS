export type ApiOrderItemRef = {
  product_id: number
  quantity: number
}

export type ApiProductSummary = {
  id: number
  name: string
  price: number
  image_path?: string | null
}

export type ApiOrderItemDetail = {
  product: ApiProductSummary
  quantity: number
}

export type ApiOrderRow = {
  id: number
  total_price: number
  discount_amount?: number | null
  is_debt: boolean
  paid_amount?: number | null
  payment_type?: string | null
  created_at: string
  items: ApiOrderItemRef[]
  user?: { id: number; username: string; position?: string | null }
}

export type ApiOrderDetail = Omit<ApiOrderRow, 'items'> & {
  items: ApiOrderItemDetail[]
}

export type ApiPage<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type ApiHistoryOverview = {
  total_orders: number
  total_paid_sum: number
  total_net_sum: number
  total_discount_sum: number
}

export type ApiOrderHistoryResponse = {
  overview: ApiHistoryOverview
  page: ApiPage<ApiOrderRow>
}


