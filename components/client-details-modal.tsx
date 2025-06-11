"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCRM } from "@/contexts/crm-context"
import { useOrders } from "@/contexts/order-context"
import type { Client } from "@/lib/types"
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, CreditCard, Calculator } from "lucide-react"

interface ClientDetailsModalProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailsModal({ client, open, onOpenChange }: ClientDetailsModalProps) {
  const { data } = useCRM()
  const { orders } = useOrders()

  // Create type-safe component
  const TypeSafeDialogTitle = DialogTitle as any;

  if (!client) return null

  // Find orders for this client
  const clientOrders = orders.filter(
    (order) => order.client.name === `${client.firstName} ${client.lastName}` || order.client.email === client.email,
  )

  const totalOrdersValue = clientOrders.reduce((sum, order) => sum + order.total, 0)
  const paidOrders = clientOrders.filter((order) => order.status === "delivered")
  const pendingOrders = clientOrders.filter((order) => order.status !== "delivered" && order.status !== "cancelled")

  const calculateAge = (birthDate: Date) => {
    if (!birthDate) return 'N/A'
    
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
      case "shipped":
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle className="flex items-center space-x-2">
            <span>
              Client Details: {client.gender} {client.firstName} {client.lastName}
            </span>
          </TypeSafeDialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg font-semibold">
                  {client.gender} {client.firstName} {client.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{client.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{client.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{calculateAge(client.birthDate) === 'N/A' ? 'N/A' : `${calculateAge(client.birthDate)} years old`}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professional Domain</p>
                <div className="flex flex-col space-y-1">
                  <Badge variant="outline">{client.professionalDomain}</Badge>
                  {client.professionalDomainCode && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-muted-foreground">Payment Code:</span>
                      <span className="font-mono text-xs bg-purple-50 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-100">
                        {client.professionalDomainCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annual Revenue</p>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-300" />
                  <span className="font-medium text-green-600 dark:text-green-300">
                    {client.revenue.toLocaleString()} DZD
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{client.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p>{client.createdAt ? client.createdAt.toLocaleDateString() : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Algeria CCP Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🇩🇿 Algeria CCP Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CCP Account Number</p>
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <span className="font-mono text-sm">{client.ccpAccount || "N/A"}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clé CCP</p>
                <div className="flex items-center space-x-1">
                  <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded font-bold dark:bg-gray-800 dark:text-gray-100">
                    {client.cle || "N/A"}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">RIP (Relevé d'Identité Postal)</p>
                <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-100">
                  {client.rip || "N/A"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">RIP Clé</p>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                  <span className="font-mono text-sm bg-orange-50 px-2 py-1 rounded font-bold dark:bg-gray-800 dark:text-gray-100">
                    {client.ripCle || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-300" />
                  <div>
                    <p className="text-2xl font-bold">{totalOrdersValue.toLocaleString()} DZD</p>
                    <p className="text-sm text-muted-foreground">Total Orders Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
                  <div>
                    <p className="text-2xl font-bold">{paidOrders.length}</p>
                    <p className="text-sm text-muted-foreground">Completed Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-orange-600 dark:text-orange-300" />
                  <div>
                    <p className="text-2xl font-bold">{pendingOrders.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders History */}
          <Card>
            <CardHeader>
              <CardTitle>Orders History</CardTitle>
            </CardHeader>
            <CardContent>
              {clientOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber || `ORD-${order.id.substring(0, 8)}`}</TableCell>
                        <TableCell>{order.orderDate ? order.orderDate.toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="font-semibold">{order.total.toLocaleString()} DZD</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{order.expectedDelivery ? order.expectedDelivery.toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No orders found for this client</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
