"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { ProductForm } from "@/components/product-form"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useCRM } from "@/contexts/crm-context"
import { toast } from "@/lib/toast"
import { Plus, Search, Edit, Trash2, AlertTriangle, Eye } from "lucide-react"

export default function ProductsPage() {
  const { data, addProduct, updateProduct, deleteProduct, addCategory, addBrand } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredProducts = data.products.filter(
    (product) =>
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedProducts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + pageSize)

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product)
    setShowDetailsModal(true)
  }
  
  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setShowDeleteConfirmation(true)
  }
  
  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete)
        toast.success("Product deleted successfully", {
          position: "top-right",
          autoClose: 3000
        })
        setProductToDelete(null)
      } catch (error: any) {
        console.error("Error deleting product:", error)
        
        // Check for foreign key constraint violation
        if (error.message && error.message.includes("still referenced from table")) {
          if (error.message.includes("invoice_items")) {
            toast.error("Cannot delete this product because it appears in one or more invoices. Please remove it from invoices first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else if (error.message.includes("order_items")) {
            toast.error("Cannot delete this product because it appears in one or more orders. Please remove it from orders first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else {
            toast.error("Cannot delete this product because it is referenced by other records in the system.", {
              position: "top-right",
              autoClose: 5000
            })
          }
        } else {
          toast.error("Failed to delete product: " + (error.message || "Unknown error"), {
            position: "top-right",
            autoClose: 5000
          })
        }
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-gray-600">Manage your inventory and stock levels</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Products</CardTitle>
            <ProductForm
              categories={data.categories}
              brands={data.brands}
              onSubmit={addProduct}
              onAddCategory={addCategory}
              onAddBrand={addBrand}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
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
                <SortableTableHeader sortKey="name" currentSort={sortConfig} onSort={handleSort}>
                  Name
                </SortableTableHeader>
                <SortableTableHeader sortKey="reference" currentSort={sortConfig} onSort={handleSort}>
                  Reference
                </SortableTableHeader>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <SortableTableHeader sortKey="buyPrice" currentSort={sortConfig} onSort={handleSort}>
                  Buy Price
                </SortableTableHeader>
                <SortableTableHeader sortKey="sellPrice" currentSort={sortConfig} onSort={handleSort}>
                  Sell Price
                </SortableTableHeader>
                <SortableTableHeader sortKey="quantity" currentSort={sortConfig} onSort={handleSort}>
                  Stock
                </SortableTableHeader>
                <TableHead>Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => {
                const buyPrice = typeof product.buyPrice === 'number' ? product.buyPrice : Number(product.buyPrice) || 0;
                const sellPrice = typeof product.sellPrice === 'number' ? product.sellPrice : Number(product.sellPrice) || 0;
                const margin = buyPrice > 0 
                  ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(1)
                  : '0.0';
                const isLowStock = (product.quantity || 0) < 10;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.reference}</TableCell>
                    <TableCell className="max-w-xs truncate" title={product.description}>
                      {product.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category?.name || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell>{product.brand?.name || 'Unbranded'}</TableCell>
                    <TableCell>{buyPrice.toFixed(2)} DZD</TableCell>
                    <TableCell>{sellPrice.toFixed(2)} DZD</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={isLowStock ? "text-red-600 font-medium" : ""}>{product.quantity || 0}</span>
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={Number.parseFloat(margin) > 20 ? "text-green-600" : "text-orange-600"}>
                        {margin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <ProductForm
                          product={product}
                          categories={data.categories}
                          brands={data.brands}
                          onSubmit={(data) => updateProduct(product.id, data)}
                          onAddCategory={addCategory}
                          onAddBrand={addBrand}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedProducts.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <ProductDetailsModal product={selectedProduct} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
      
      <ConfirmationDialog
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
