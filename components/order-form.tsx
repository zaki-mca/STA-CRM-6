"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchableSelect } from "@/components/searchable-select"
import { useCRM } from "@/contexts/crm-context"
import { Plus, Minus, Package, User, Mail, Phone, MapPin } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface OrderFormProps {
  onSubmit: (orderData: any) => void
  trigger: React.ReactNode
}

export function OrderForm({ onSubmit, trigger }: OrderFormProps) {
  const { data } = useCRM()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    clientId: "",
    items: [] as any[],
    notes: "",
    expectedDelivery: "",
    shippingAddress: "",
    status: "pending",
  })

  // Create type-safe components
  const TypeSafeDialogTrigger = DialogTrigger as any;
  const TypeSafeDialogTitle = DialogTitle as any;
  const TypeSafeSelectTrigger = SelectTrigger as any;
  const TypeSafeSelectContent = SelectContent as any;
  const TypeSafeSelectItem = SelectItem as any;

  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  })

  const clientOptions = data.clients.map((client) => ({
    value: client.id,
    label: `${client.gender} ${client.firstName} ${client.lastName}`,
    email: client.email,
    phone: client.phoneNumber,
  }))

  const productOptions = data.products.map((product) => ({
    value: product.id,
    label: product.name,
    price: product.sellPrice,
    reference: product.reference,
  }))

  const selectedClient = data.clients.find((c) => c.id === formData.clientId)
  const selectedProduct = data.products.find((p) => p.id === newItem.productId)

  const addItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      const product = data.products.find((p) => p.id === newItem.productId)
      if (product) {
        const item = {
          id: Date.now().toString(),
          product,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice || product.sellPrice,
          total: (newItem.unitPrice || product.sellPrice) * newItem.quantity,
        }
        setFormData({
          ...formData,
          items: [...formData.items, item],
        })
        setNewItem({ productId: "", quantity: 1, unitPrice: 0 })
      }
    }
  }

  const removeItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    })
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === itemId ? { ...item, quantity, total: item.unitPrice * quantity } : item,
      ),
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId) {
      toast({
        title: "Client required",
        description: "Please select a client for this order.",
      })
      return
    }

    if (formData.items.length === 0) {
      toast({
        title: "Items required",
        description: "Please add at least one item to the order.",
      })
      return
    }

    const client = data.clients.find((c) => c.id === formData.clientId)
    if (!client) return

    const orderData = {
      id: `ORD-${Date.now()}`,
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        phone: client.phoneNumber,
        address: client.address,
      },
      items: formData.items,
      subtotal: calculateTotal(),
      total: calculateTotal(), // You can add tax/shipping calculations here
      status: formData.status,
      notes: formData.notes,
      shippingAddress: formData.shippingAddress || client.address,
      expectedDelivery: formData.expectedDelivery
        ? new Date(formData.expectedDelivery)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      createdAt: new Date(),
    }

    onSubmit(orderData)

    // Reset form
    setFormData({
      clientId: "",
      items: [],
      notes: "",
      expectedDelivery: "",
      shippingAddress: "",
      status: "pending",
    })
    setNewItem({ productId: "", quantity: 1, unitPrice: 0 })
    setOpen(false)

    toast({
      title: "Order created successfully",
      description: "The order has been created and added to the system.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TypeSafeDialogTrigger asChild>{trigger}</TypeSafeDialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle>Create New Order</TypeSafeDialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Client Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Client</Label>
                <SearchableSelect
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  options={clientOptions}
                  placeholder="Select client"
                  searchPlaceholder="Search clients..."
                />
              </div>

              {selectedClient && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Order Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <SearchableSelect
                    value={newItem.productId}
                    onValueChange={(value) => {
                      const product = data.products.find((p) => p.id === value)
                      setNewItem({
                        ...newItem,
                        productId: value,
                        unitPrice: product?.sellPrice || 0,
                      })
                    }}
                    options={productOptions}
                    placeholder="Select product"
                    searchPlaceholder="Search products..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price (DZD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button type="button" onClick={addItem} disabled={!newItem.productId} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-muted rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span>Reference: {selectedProduct.reference}</span>
                    <span>Available: {selectedProduct.quantity} units</span>
                  </div>
                </div>
              )}

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-muted-foreground">{item.product.reference}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{item.unitPrice.toLocaleString()} DZD</TableCell>
                          <TableCell className="font-medium">{item.total.toLocaleString()} DZD</TableCell>
                          <TableCell>
                            <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-muted">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">{calculateTotal().toLocaleString()} DZD</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <TypeSafeSelectTrigger>
                      <SelectValue />
                    </TypeSafeSelectTrigger>
                    <TypeSafeSelectContent>
                      <TypeSafeSelectItem value="pending">Pending</TypeSafeSelectItem>
                      <TypeSafeSelectItem value="processing">Processing</TypeSafeSelectItem>
                      <TypeSafeSelectItem value="shipped">Shipped</TypeSafeSelectItem>
                      <TypeSafeSelectItem value="delivered">Delivered</TypeSafeSelectItem>
                      <TypeSafeSelectItem value="cancelled">Cancelled</TypeSafeSelectItem>
                    </TypeSafeSelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shipping Address (Optional)</Label>
                <Textarea
                  placeholder="Leave empty to use client's address"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes about this order..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.clientId || formData.items.length === 0}>
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
