"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/searchable-select"
import { ProductForm } from "@/components/product-form"
import { ProviderForm } from "@/components/provider-form"
import type { Provider, Product, Category, Brand, InvoiceItem } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"

interface InvoiceFormProps {
  providers: Provider[]
  products: Product[]
  categories: Category[]
  brands: Brand[]
  onSubmit: (data: any) => void
  onAddProvider: (data: any) => void
  onAddProduct: (data: any) => void
  onAddCategory: (name: string) => void
  onAddBrand: (name: string) => void
  trigger: React.ReactNode
}

export function InvoiceForm({
  providers,
  products,
  categories,
  brands,
  onSubmit,
  onAddProvider,
  onAddProduct,
  onAddCategory,
  onAddBrand,
  trigger,
}: InvoiceFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    providerId: "",
    items: [] as any[],
    dueDate: "",
  })

  // Create type-safe components
  const TypeSafeDialogTrigger = DialogTrigger as any;
  const TypeSafeDialogTitle = DialogTitle as any;

  // Enhanced product options with category, brand, and description for better search
  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.name,
    price: product.sellPrice,
    category: product.category?.name || 'Uncategorized',
    brand: product.brand?.name || 'Unbranded',
    description: product.description,
  }))

  // Enhanced provider options for searchable select
  const providerOptions = providers.map((provider) => ({
    value: provider.id,
    label: provider.name,
    email: provider.email,
  }))

  const addItemToInvoice = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0 }],
    })
  }

  const removeItemFromInvoice = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = products.find((p) => p.id === value)
      if (product) {
        updatedItems[index].unitPrice = product.sellPrice
      }
    }

    setFormData({ ...formData, items: updatedItems })
  }

  const handleAddProduct = (productData: any) => {
    onAddProduct(productData)
    const newProductId = Date.now().toString()
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: newProductId,
          quantity: 1,
          unitPrice: productData.sellPrice,
        },
      ],
    })
  }

  const handleAddProvider = (providerData: any) => {
    onAddProvider(providerData)
    // Set the newly created provider as selected
    const newProviderId = Date.now().toString()
    setFormData({ ...formData, providerId: newProviderId })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const provider = providers.find((p) => p.id === formData.providerId)
    if (!provider || formData.items.length === 0) return

    const invoiceItems: InvoiceItem[] = formData.items.map((item, index) => {
      const product = products.find((p) => p.id === item.productId)!
      return {
        id: `temp-${Math.random().toString(36).substring(2, 9)}`,
        product_id: product.id,
        product_name: product.name,
        product_description: product.description || '',
        reference: product.reference || '',
        sku: product.sku || '',
        category_id: product.category?.id || '',
        category_name: product.category?.name || 'Uncategorized',
        brand_id: product.brand?.id || '',
        brand_name: product.brand?.name || 'Unbranded',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount || 0,
        total: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
      }
    })

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal

    const invoice = {
      provider_id: provider.id,
      provider_name: provider.name,
      provider_email: provider.email,
      provider_phone: provider.phoneNumber,
      provider_address: provider.address,
      items: invoiceItems,
      subtotal,
      total,
      status: "draft" as const,
      date: new Date().toISOString().split('T')[0],
      due_date: formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : null,
      tax_rate: 0, // Default tax rate
    }

    onSubmit(invoice)
    setFormData({ providerId: "", items: [], dueDate: "" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TypeSafeDialogTrigger asChild>{trigger}</TypeSafeDialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle>Create New Invoice</TypeSafeDialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <div className="flex space-x-2">
                <SearchableSelect
                  value={formData.providerId}
                  onValueChange={(value) => setFormData({ ...formData, providerId: value })}
                  options={providerOptions}
                  placeholder="Select provider"
                  searchPlaceholder="Search providers by name or email..."
                  className="flex-1"
                />
                <ProviderForm
                  onSubmit={handleAddProvider}
                  trigger={
                    <Button type="button" variant="outline">
                      Add New
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <div className="flex space-x-2">
                <Button onClick={addItemToInvoice} variant="outline" type="button">
                  Add Existing Product
                </Button>
                <ProductForm
                  categories={categories}
                  brands={brands}
                  onSubmit={handleAddProduct}
                  onAddCategory={onAddCategory}
                  onAddBrand={onAddBrand}
                  trigger={
                    <Button variant="outline" type="button">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Product
                    </Button>
                  }
                />
              </div>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <SearchableSelect
                    value={item.productId}
                    onValueChange={(value) => updateInvoiceItem(index, "productId", value)}
                    options={productOptions}
                    placeholder="Select product"
                    searchPlaceholder="Search by name, brand, or category..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateInvoiceItem(index, "quantity", Math.max(1, Number.parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateInvoiceItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={item.discount || 0}
                    onChange={(e) => updateInvoiceItem(index, "discount", Math.min(100, Math.max(0, Number.parseFloat(e.target.value) || 0)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium">
                      {((item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100)).toFixed(2)} DZD
                    </span>
                    <Button variant="outline" size="sm" onClick={() => removeItemFromInvoice(index)} type="button">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100), 0).toFixed(2)} DZD
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>
                        {formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100), 0).toFixed(2)} DZD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.providerId || formData.items.length === 0}>
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
