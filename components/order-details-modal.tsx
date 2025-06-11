"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Order } from "@/lib/order-types"
import { Package, User, Calendar, MapPin, Phone, Mail, FileText } from "lucide-react"

// Helper functions for safe formatting
const formatCurrency = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.00"
  }
  return value.toFixed(2)
}

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "N/A"
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A"
    }
    
    return dateObj.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "N/A"
  }
}

interface OrderDetailsModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null

  // Create type-safe component
  const TypeSafeDialogTitle = DialogTitle as any;
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order Details: {order.id}</span>
          </TypeSafeDialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Order ID</p>
                <p className="text-lg font-semibold">{order.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Order Date</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(order.orderDate)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expected Delivery</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(order.expectedDelivery)}</span>
                </div>
              </div>
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <div className="flex items-start space-x-1">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-sm">{order.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Client Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">{order.client?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{order.client?.email || "N/A"}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{order.client?.phoneNumber || "N/A"}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <div className="flex items-start space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{order.client?.address || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item, index) => (
                    <TableRow key={item?.id || index}>
                      <TableCell className="font-medium">{item?.product?.name || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{item?.product?.description || "N/A"}</TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
                      <TableCell>{formatCurrency((item?.unitPrice || (item as any)?.unit_price || 0))} DZD</TableCell>
                      <TableCell className="font-semibold">{formatCurrency((item?.total || ((item?.quantity || 0) * (item?.unitPrice || (item as any)?.unit_price || 0))))} DZD</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency((order as any).tax)} DZD</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)} DZD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
