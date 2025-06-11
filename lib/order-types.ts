export interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    description: string
    sellPrice: number
  }
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  id: string
  orderNumber: string
  client: {
    id: string
    name: string
    email: string
    address: string
    phoneNumber: string
  }
  items: OrderItem[]
  subtotal: number
  total: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  orderDate: Date
  expectedDelivery: Date
  notes?: string
}

export interface OrderContextType {
  orders: Order[]
  loading: boolean
  error: string | null
  addOrder: (order: Omit<Order, "id" | "orderDate">) => Promise<Order>
  updateOrder: (id: string, order: Omit<Order, "id" | "orderDate">) => Promise<Order>
  deleteOrder: (id: string) => Promise<void>
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<Order>
}
