"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCRM } from "@/contexts/crm-context"
import { useOrders } from "@/contexts/order-context"
import type { Product } from "@/lib/types"
import { Package, DollarSign, TrendingUp, AlertTriangle, Calendar } from "lucide-react"

// Type-cast DialogTitle to fix type errors
const DialogTitle = RadixDialogTitle as any;

interface ProductDetailsModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  const { data } = useCRM()
  const { orders } = useOrders()

  if (!product) return null

  // Ensure price fields are numbers
  const buyPrice = typeof product.buyPrice === 'number' ? product.buyPrice : Number(product.buyPrice) || 0;
  const sellPrice = typeof product.sellPrice === 'number' ? product.sellPrice : Number(product.sellPrice) || 0;

  // Find orders that contain this product
  const productOrders = orders.filter((order) => order.items.some((item) => item.product.id === product.id))

  const totalSold = productOrders.reduce((sum, order) => {
    const productItem = order.items.find((item) => item.product.id === product.id)
    return sum + (productItem?.quantity || 0)
  }, 0)

  const totalRevenue = productOrders.reduce((sum, order) => {
    const productItem = order.items.find((item) => item.product.id === product.id)
    return sum + (productItem?.total || 0)
  }, 0)

  const margin = buyPrice > 0 && typeof buyPrice === 'number' && typeof sellPrice === 'number' 
    ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(1) 
    : '0.0';
  const isLowStock = (product.quantity || 0) < 10

  // Mock stock movements for demonstration
  const stockMovements = [
    { id: 1, date: new Date("2024-01-15"), type: "In", quantity: 50, reason: "Initial stock" },
    { id: 2, date: new Date("2024-02-01"), type: "Out", quantity: 20, reason: "Sale to ABC Corp" },
    { id: 3, date: new Date("2024-02-15"), type: "In", quantity: 30, reason: "Restock from supplier" },
    { id: 4, date: new Date("2024-03-01"), type: "Out", quantity: 15, reason: "Sale to XYZ Ltd" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Details: {product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Product Name</p>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reference</p>
                <p className="font-mono">{product.reference}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <Badge variant="secondary">{product.category?.name || 'Uncategorized'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Brand</p>
                <Badge variant="outline">{product.brand?.name || 'Unbranded'}</Badge>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p>{product.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{product.createdAt && typeof product.createdAt.toLocaleDateString === 'function' ? product.createdAt.toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{typeof buyPrice === 'number' ? buyPrice.toFixed(2) : '0.00'} DZD</p>
                    <p className="text-sm text-gray-500">Buy Price</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{typeof sellPrice === 'number' ? sellPrice.toFixed(2) : '0.00'} DZD</p>
                    <p className="text-sm text-gray-500">Sell Price</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p
                      className={`text-2xl font-bold ${Number.parseFloat(margin) > 20 ? "text-green-600" : "text-orange-600"}`}
                    >
                      {margin}%
                    </p>
                    <p className="text-sm text-gray-500">Profit Margin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`text-2xl font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                        {product.quantity}
                      </p>
                      {isLowStock && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-500">Current Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Performance */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{totalSold}</p>
                    <p className="text-sm text-gray-500">Total Units Sold</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} DZD</p>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Movement History */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.date && typeof movement.date.toLocaleDateString === 'function' ? movement.date.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={movement.type === "In" ? "default" : "secondary"}>{movement.type}</Badge>
                      </TableCell>
                      <TableCell className={movement.type === "In" ? "text-green-600" : "text-red-600"}>
                        {movement.type === "In" ? "+" : "-"}
                        {movement.quantity}
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Related Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Related Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {productOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productOrders.map((order) => {
                      const productItem = order.items.find((item) => item.product.id === product.id)
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber || order.id}</TableCell>
                          <TableCell>{order.client?.name || 'Unknown Client'}</TableCell>
                          <TableCell>{order.orderDate && typeof order.orderDate.toLocaleDateString === 'function' ? order.orderDate.toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{productItem?.quantity || 0}</TableCell>
                          <TableCell>{(productItem?.total || 0).toLocaleString()} DZD</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders found for this product</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
