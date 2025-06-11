"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { SearchableSelect } from "@/components/searchable-select"
import { ClientForm } from "@/components/client-form"
import { OrderDetailsModal } from "@/components/order-details-modal"
import { useCRM } from "@/contexts/crm-context"
import { useOrders } from "@/contexts/order-context"
import type { OrderItem } from "@/lib/order-types"
import { Plus, Search, Eye, Edit, Trash2, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import * as React from "react"

export default function OrdersPage() {
  const { data, addClient, addProfessionalDomain } = useCRM()
  const { orders, addOrder, updateOrder, deleteOrder, updateOrderStatus } = useOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [newOrder, setNewOrder] = useState({
    clientId: "",
    items: [] as any[],
    expectedDelivery: "",
    notes: "",
  })

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.client.name}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedOrders.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + pageSize)

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  // Enhanced product options with category, brand, and description for better search
  const productOptions = data.products.map((product) => ({
    value: product.id,
    label: product.name,
    price: product.sellPrice,
    category: product.category?.name || 'Uncategorized',
    brand: product.brand?.name || 'Unbranded',
    description: product.description,
  }))

  // Enhanced client options for searchable select
  const clientOptions = data.clients.map((client) => ({
    value: client.id,
    label: `${client.gender} ${client.firstName} ${client.lastName}`,
    email: client.email,
    domain: client.professionalDomain,
  }))

  const addItemToOrder = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productId: "", quantity: 1, unitPrice: 0 }],
    })
  }

  const removeItemFromOrder = (index: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((_, i) => i !== index),
    })
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newOrder.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = data.products.find((p) => p.id === value)
      if (product) {
        updatedItems[index].unitPrice = product.sellPrice
      }
    }

    setNewOrder({ ...newOrder, items: updatedItems })
  }

  const handleAddClient = (clientData: any) => {
    addClient(clientData)
    // Set the newly created client as selected
    const newClientId = Date.now().toString()
    setNewOrder({ ...newOrder, clientId: newClientId })
  }

  // Wrapper for addProfessionalDomain to match the expected signature in ClientForm
  const handleAddProfessionalDomain = (name: string) => {
    addProfessionalDomain({ name })
  }

  const createOrder = () => {
    const client = data.clients.find((c) => c.id === newOrder.clientId)
    if (!client || newOrder.items.length === 0) return

    const orderItems: OrderItem[] = newOrder.items.map((item, index) => {
      const product = data.products.find((p) => p.id === item.productId)!
      return {
        id: index.toString(),
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          sellPrice: product.sellPrice,
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal // Remove tax calculation

    const order = {
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        address: client.address,
        phoneNumber: client.phoneNumber,
      },
      items: orderItems,
      subtotal,
      total,
      status: "pending" as const,
      order_date: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(newOrder.expectedDelivery),
      notes: newOrder.notes,
      orderNumber: `ORD-${Date.now().toString().substring(0, 8)}`
    }

    if (editingOrder) {
      updateOrder(editingOrder.id, order)
    } else {
      addOrder(order)
    }

    setNewOrder({ clientId: "", items: [], expectedDelivery: "", notes: "" })
    setShowCreateForm(false)
    setShowEditForm(false)
    setEditingOrder(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Package className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const OrderForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Client</Label>
          <div className="flex space-x-2">
            <SearchableSelect
              value={newOrder.clientId}
              onValueChange={(value) => setNewOrder({ ...newOrder, clientId: value })}
              options={clientOptions}
              placeholder="Select client"
              searchPlaceholder="Search clients by name, email, or domain..."
              className="flex-1"
            />
            <ClientForm
              professionalDomains={data.professionalDomains}
              onSubmit={handleAddClient}
              onAddProfessionalDomain={handleAddProfessionalDomain}
              trigger={
                <Button type="button" variant="outline">
                  Add New
                </Button>
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Expected Delivery</Label>
          <Input
            type="date"
            value={newOrder.expectedDelivery}
            onChange={(e) => setNewOrder({ ...newOrder, expectedDelivery: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Order Notes</Label>
        <Textarea
          placeholder="Add any special instructions or notes..."
          value={newOrder.notes}
          onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Order Items</h3>
          <Button onClick={addItemToOrder} variant="outline">
            Add Product
          </Button>
        </div>

        {newOrder.items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Product</Label>
              <SearchableSelect
                value={item.productId}
                onValueChange={(value) => updateOrderItem(index, "productId", value)}
                options={productOptions}
                placeholder="Select product"
                searchPlaceholder="Search by name, brand, or category..."
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateOrderItem(index, "quantity", Number.parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateOrderItem(index, "unitPrice", Number.parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium">{(item.quantity * item.unitPrice).toFixed(2)} DZD</span>
                <Button variant="outline" size="sm" onClick={() => removeItemFromOrder(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {newOrder.items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-end space-y-2">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {newOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)} DZD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>
                    {newOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)} DZD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setShowEditForm(false)
              setEditingOrder(null)
            } else {
              setShowCreateForm(false)
            }
            setNewOrder({ clientId: "", items: [], expectedDelivery: "", notes: "" })
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? createOrder : createOrder}
          disabled={!newOrder.clientId || newOrder.items.length === 0}
        >
          {isEdit ? "Update Order" : "Create Order"}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-gray-600">Manage customer orders and sales</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Orders</CardTitle>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild {...({} as any)}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle {...({} as any)}>Create New Order</DialogTitle>
                </DialogHeader>
                <OrderForm />
              </DialogContent>
            </Dialog>
            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle {...({} as any)}>Edit Order: {editingOrder?.orderNumber}</DialogTitle>
                </DialogHeader>
                <OrderForm isEdit={true} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader sortKey="orderNumber" currentSort={sortConfig} onSort={handleSort}>
                  Order Number
                </SortableTableHeader>
                <SortableTableHeader sortKey="client.name" currentSort={sortConfig} onSort={handleSort}>
                  Client
                </SortableTableHeader>
                <TableHead>Items</TableHead>
                <SortableTableHeader sortKey="total" currentSort={sortConfig} onSort={handleSort}>
                  Total
                </SortableTableHeader>
                <TableHead>Status</TableHead>
                <SortableTableHeader sortKey="orderDate" currentSort={sortConfig} onSort={handleSort}>
                  Order Date
                </SortableTableHeader>
                <SortableTableHeader sortKey="expectedDelivery" currentSort={sortConfig} onSort={handleSort}>
                  Expected Delivery
                </SortableTableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.client.name}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell>{order.total.toFixed(2)} DZD</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select value={order.status} onValueChange={(value: any) => updateOrderStatus(order.id, value)}>
                        <SelectTrigger className="w-32" {...({} as any)}>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent {...({} as any)}>
                          <SelectItem value="pending" {...({} as any)}>Pending</SelectItem>
                          <SelectItem value="processing" {...({} as any)}>Processing</SelectItem>
                          <SelectItem value="shipped" {...({} as any)}>Shipped</SelectItem>
                          <SelectItem value="delivered" {...({} as any)}>Delivered</SelectItem>
                          <SelectItem value="cancelled" {...({} as any)}>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{order.orderDate.toLocaleDateString()}</TableCell>
                  <TableCell>{order.expectedDelivery.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOrder(order)
                          setNewOrder({
                            clientId: order.client.id,
                            items: order.items.map((item) => ({
                              productId: item.product.id,
                              quantity: item.quantity,
                              unitPrice: item.unitPrice,
                            })),
                            expectedDelivery: order.expectedDelivery.toISOString().split("T")[0],
                            notes: order.notes || "",
                          })
                          setShowEditForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteOrder(order.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedOrders.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <OrderDetailsModal order={selectedOrder} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
    </div>
  )
}
