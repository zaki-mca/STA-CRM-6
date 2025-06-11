"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as RadixLabel } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle, DialogTrigger as RadixDialogTrigger } from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/searchable-select"
import type { Product, Category, Brand } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"

// Type-cast components to fix type errors
const DialogTrigger = RadixDialogTrigger as any;
const DialogTitle = RadixDialogTitle as any;
const Label = RadixLabel as any;

interface ProductFormProps {
  product?: Product
  categories: Category[]
  brands: Brand[]
  onSubmit: (data: any) => void
  onAddCategory: (name: string) => void
  onAddBrand: (name: string) => void
  trigger: React.ReactNode
}

export function ProductForm({
  product,
  categories,
  brands,
  onSubmit,
  onAddCategory,
  onAddBrand,
  trigger,
}: ProductFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    reference: product?.reference || "",
    categoryId: product?.category?.id || "",
    brandId: product?.brand?.id || "",
    sellPrice: product?.sellPrice || 0,
    buyPrice: product?.buyPrice || 0,
    quantity: product?.quantity || 0,
  })
  const [newCategory, setNewCategory] = useState("")
  const [newBrand, setNewBrand] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewBrand, setShowNewBrand] = useState(false)

  // Prepare options for searchable selects
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }))

  const brandOptions = brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }))

  useEffect(() => {
    // Only auto-fill if all three fields have values
    if (formData.categoryId && formData.brandId && formData.description) {
      const selectedCategory = categories.find((c) => c.id === formData.categoryId)
      const selectedBrand = brands.find((b) => b.id === formData.brandId)

      if (selectedCategory && selectedBrand) {
        // Create a shortened description (first 30 characters)
        const shortDesc =
          formData.description.length > 30 ? formData.description.substring(0, 30) + "..." : formData.description

        // Auto-fill the name field
        setFormData((prev) => ({
          ...prev,
          name: `${selectedCategory.name} ${selectedBrand.name} ${shortDesc}`,
        }))
      }
    }
  }, [formData.categoryId, formData.brandId, formData.description, categories, brands])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setOpen(false)
    if (!product) {
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        brandId: "",
        sellPrice: 0,
        buyPrice: 0,
        quantity: 0,
        reference: "",
      })
    }
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim())
      setNewCategory("")
      setShowNewCategory(false)
    }
  }

  const handleAddBrand = () => {
    if (newBrand.trim()) {
      onAddBrand(newBrand.trim())
      setNewBrand("")
      setShowNewBrand(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Product reference code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            {!showNewCategory ? (
              <div className="flex space-x-2">
                <SearchableSelect
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  options={categoryOptions}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowNewCategory(true)}>
                  Add New
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button type="button" onClick={handleAddCategory}>
                  Add
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewCategory(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            {!showNewBrand ? (
              <div className="flex space-x-2">
                <SearchableSelect
                  value={formData.brandId}
                  onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                  options={brandOptions}
                  placeholder="Select brand"
                  searchPlaceholder="Search brands..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowNewBrand(true)}>
                  Add New
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input placeholder="New brand name" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
                <Button type="button" onClick={handleAddBrand}>
                  Add
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewBrand(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price</Label>
              <Input
                id="buyPrice"
                type="number"
                step="0.01"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: Number.parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: Number.parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{product ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
