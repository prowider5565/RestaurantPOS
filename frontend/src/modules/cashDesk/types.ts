export type ApiUser = {
  id: number
  username: string
  position?: string | null
}

export type ApiCashDeskTransaction = {
  id: number
  amount: number
  transaction_type: 'in' | 'out'
  user_id: number
  user: ApiUser
  created_at: string
}

export type ApiDeleteOut = {
  message: string
}

export type ApiPage<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type CashDeskSummary = {
  current_amount: number
  total_order_income: number
  total_misc_income: number
  total_expense: number
}
