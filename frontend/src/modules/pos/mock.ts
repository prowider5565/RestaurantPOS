export type Category = {
  id: string
  label: string
}

export type Product = {
  id: string
  name: string
  price: number
  categoryId: string
  imageSrc: string
}

const mockImages = [
  '/mock-images/photo_1_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_2_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_3_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_4_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_5_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_6_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_7_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_8_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_9_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_10_2026-03-11_22-51-02.jpg',
  '/mock-images/photo_11_2026-03-11_22-51-02.jpg',
]

const imgAt = (index: number) => mockImages[index % mockImages.length]

export const categories: Category[] = [
  { id: 'all', label: 'All' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'burger', label: 'Burgers' },
  { id: 'salad', label: 'Salads' },
  { id: 'drink', label: 'Drinks' },
  { id: 'dessert', label: 'Desserts' },
]

export const products: Product[] = [
  { id: 'p1', name: 'Pepperoni Pizza', price: 12.99, categoryId: 'pizza', imageSrc: imgAt(0) },
  { id: 'p2', name: 'Margherita Pizza', price: 10.99, categoryId: 'pizza', imageSrc: imgAt(1) },
  { id: 'p3', name: 'Classic Burger', price: 8.99, categoryId: 'burger', imageSrc: imgAt(2) },
  { id: 'p4', name: 'Cheese Burger', price: 9.49, categoryId: 'burger', imageSrc: imgAt(3) },
  { id: 'p5', name: 'Greek Salad', price: 7.25, categoryId: 'salad', imageSrc: imgAt(4) },
  { id: 'p6', name: 'Caesar Salad', price: 7.75, categoryId: 'salad', imageSrc: imgAt(5) },
  { id: 'p7', name: 'Cappuccino', price: 3.5, categoryId: 'drink', imageSrc: imgAt(6) },
  { id: 'p8', name: 'Iced Coffee', price: 3.75, categoryId: 'drink', imageSrc: imgAt(7) },
  { id: 'p9', name: 'Chocolate Cake', price: 4.5, categoryId: 'dessert', imageSrc: imgAt(8) },
  { id: 'p10', name: 'Cheesecake', price: 4.95, categoryId: 'dessert', imageSrc: imgAt(9) },
  { id: 'p11', name: 'French Fries', price: 3.25, categoryId: 'burger', imageSrc: imgAt(10) },
  { id: 'p12', name: 'Hot Dog', price: 5.25, categoryId: 'burger', imageSrc: imgAt(0) },
]
