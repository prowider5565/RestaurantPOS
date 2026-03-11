export type OrderItem = {
  id: string
  name: string
  kind: 'food' | 'drink'
  qty: number
  unitPrice: number
}

export type OrderHistoryRow = {
  id: number
  orderNo: number
  createdAt: string
  payType: 'hold' | 'pay_now'
  items: OrderItem[]
}

export const orderHistory: OrderHistoryRow[] = [
  {
    id: 1,
    orderNo: 1204,
    createdAt: '2026-03-11 20:14',
    payType: 'pay_now',
    items: [
      { id: 'i1', name: 'Pepperoni Pizza', kind: 'food', qty: 1, unitPrice: 12.99 },
      { id: 'i2', name: 'Classic Burger', kind: 'food', qty: 2, unitPrice: 8.99 },
      { id: 'i3', name: 'Iced Coffee', kind: 'drink', qty: 2, unitPrice: 3.75 },
    ],
  },
  {
    id: 2,
    orderNo: 1205,
    createdAt: '2026-03-11 20:33',
    payType: 'hold',
    items: [
      { id: 'i4', name: 'Margherita Pizza', kind: 'food', qty: 1, unitPrice: 10.99 },
      { id: 'i5', name: 'French Fries', kind: 'food', qty: 1, unitPrice: 3.25 },
      { id: 'i6', name: 'Cappuccino', kind: 'drink', qty: 1, unitPrice: 3.5 },
    ],
  },
  {
    id: 3,
    orderNo: 1206,
    createdAt: '2026-03-11 21:02',
    payType: 'pay_now',
    items: [
      { id: 'i7', name: 'Cheesecake', kind: 'food', qty: 2, unitPrice: 4.95 },
      { id: 'i8', name: 'Hot Dog', kind: 'food', qty: 1, unitPrice: 5.25 },
      { id: 'i9', name: 'Iced Coffee', kind: 'drink', qty: 1, unitPrice: 3.75 },
    ],
  },
]
