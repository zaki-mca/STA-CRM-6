export interface ClientDailyLog {
  id: string
  date: Date
  clients: Array<{
    id: string
    clientId: string
    clientName: string
    clientEmail: string
    addedAt: Date
    notes?: string
  }>
  isClosed: boolean
  closedAt?: Date
  createdBy: string
  totalClients: number
}

export interface OrderDailyLog {
  id: string
  date: Date
  orders: Array<{
    id: string
    orderId: string
    orderNumber?: string
    clientName: string
    orderTotal: number
    addedAt: Date
    notes?: string
  }>
  isClosed: boolean
  closedAt?: Date
  createdBy: string
  totalOrders: number
  totalValue: number
}

export interface DailyLogsContextType {
  clientLogs: ClientDailyLog[]
  orderLogs: OrderDailyLog[]
  loading: boolean
  error: string | null
  createClientDailyLog: (date: Date, firstClientId: string) => Promise<string>
  addClientToLog: (logId: string, clientId: string, notes?: string) => Promise<ClientDailyLog>
  closeClientDailyLog: (logId: string) => Promise<ClientDailyLog>
  createOrderDailyLog: (date: Date, firstOrderId: string) => Promise<string>
  addOrderToLog: (logId: string, orderId: string, notes?: string) => Promise<OrderDailyLog>
  closeOrderDailyLog: (logId: string) => Promise<OrderDailyLog>
  getLogById?: (logId: string) => Promise<ClientDailyLog | null>
  getOrderLogById?: (logId: string) => Promise<OrderDailyLog | null>
  refreshOrderLogs?: () => Promise<OrderDailyLog[]>
  addMultipleOrdersToLog?: (logId: string, orderIds: string[], notes?: string[]) => Promise<OrderDailyLog | null>
}
