"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { ProductForm } from "@/components/product-form"
import { ProviderForm } from "@/components/provider-form"
import { SearchableSelect } from "@/components/searchable-select"
import { InvoiceDetailsModalEnhanced } from "@/components/invoice-details-modal-enhanced"
import { useCRM } from "@/contexts/crm-context"
import type { InvoiceItem } from "@/lib/types"
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { InvoiceForm } from "@/components/invoice-form"
import { FileText, Filter, Download, Printer, Calendar, Check, X, AlertTriangle, MoreVertical } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function InvoicesPage() {
  const {
    data,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addProduct,
    addCategory,
    addBrand,
    addProvider,
    updateInvoiceStatus,
  } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    providerId: "",
    items: [] as any[],
    dueDate: "",
  })
  const [isEdit, setIsEdit] = useState(false) // Declare the isEdit variable

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const transformInvoice = (invoice: any) => {
    if (!invoice || typeof invoice !== 'object') {
      console.error("Invalid invoice data:", invoice);
      return null;
    }
    
    try {
      console.log("Raw invoice data:", invoice.invoice_number, "Items:", invoice.items ? invoice.items.length : 0);
      
      // Return invoice data in the format expected by our updated types
      return {
        id: invoice.id || '',
        invoice_number: invoice.invoice_number || `INV-${(invoice.id || '').substring(0, 8)}`,
        provider_id: invoice.provider_id || '',
        provider_name: invoice.provider_name || 'Default Provider',
        provider_email: invoice.provider_email || '',
        provider_phone: invoice.provider_phone || '',
        provider_address: invoice.provider_address || '',
        items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
          id: item.id || '',
          product_id: item.product_id || '',
          product_name: item.product_name || '',
          product_description: item.product_description || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          discount: item.discount || 0,
          total: item.total || (item.quantity * item.unit_price),
          sku: item.sku || '',
          reference: item.reference || '',
          category_id: item.category_id || '',
          category_name: item.category_name || '',
          brand_id: item.brand_id || '',
          brand_name: item.brand_name || ''
        })) : [],
        subtotal: invoice.subtotal || 0,
        total: invoice.total || 0,
        status: invoice.status || 'draft',
        tax_rate: invoice.tax_rate || 0,
        date: invoice.date || '',
        due_date: invoice.due_date || '',
        notes: invoice.notes || '',
        created_at: invoice.created_at || new Date().toISOString(),
        updated_at: invoice.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error("Error transforming invoice:", error);
      return null;
    }
  };

  const filteredInvoices = (data.invoices || [])
    .map(transformInvoice)
    .filter(Boolean) // Filter out null values
    .filter(
      (invoice) =>
        invoice &&
        ((invoice.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.provider_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig || !a || !b) return 0

    let aValue: any = a[sortConfig.key as keyof typeof a]
    let bValue: any = b[sortConfig.key as keyof typeof b]

    // Handle nested properties like 'provider.name'
    if (sortConfig.key.includes('.')) {
      const keys = sortConfig.key.split('.')
      aValue = keys.reduce((obj: any, key) => obj && obj[key], a)
      bValue = keys.reduce((obj: any, key) => obj && obj[key], b)
    }

    // Handle undefined or null values
    if (aValue === undefined || aValue === null) aValue = ''
    if (bValue === undefined || bValue === null) bValue = ''

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedInvoices.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedInvoices = sortedInvoices.slice(startIndex, startIndex + pageSize)

  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice)
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

  // Enhanced provider options for searchable select
  const providerOptions = data.providers.map((provider) => ({
    value: provider.id,
    label: provider.name,
    email: provider.email,
  }))

  const addItemToInvoice = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0 }],
    })
  }

  const removeItemFromInvoice = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
    })
  }

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = data.products.find((p) => p.id === value)
      if (product) {
        updatedItems[index].unitPrice = product.sellPrice
      }
    }

    setNewInvoice({ ...newInvoice, items: updatedItems })
  }

  const handleAddProduct = (productData: any) => {
    addProduct(productData)
    const newProductId = Date.now().toString()
    setNewInvoice({
      ...newInvoice,
      items: [
        ...newInvoice.items,
        {
          productId: newProductId,
          quantity: 1,
          unitPrice: productData.sellPrice,
        },
      ],
    })
  }

  const handleAddProvider = (providerData: any) => {
    addProvider(providerData)
    // Set the newly created provider as selected
    const newProviderId = Date.now().toString()
    setNewInvoice({ ...newInvoice, providerId: newProviderId })
  }

  const createInvoice = () => {
    const provider = data.providers.find((p) => p.id === newInvoice.providerId)
    if (!provider) {
      console.error("No provider selected. Provider ID:", newInvoice.providerId);
      console.log("Available providers:", data.providers);
      alert("Please select a provider");
      return;
    }
    
    if (newInvoice.items.length === 0) {
      console.error("No items added to invoice");
      alert("Please add at least one item to the invoice");
      return;
    }

    console.log("Creating invoice with provider:", provider);
    
    const invoiceItems: InvoiceItem[] = newInvoice.items.map((item, index) => {
      const product = data.products.find((p) => p.id === item.productId)
      if (!product) {
        console.error(`Product not found for ID ${item.productId}`);
        return null;
      }
      
      return {
        id: `temp-${index}`,
        product_id: product.id,
        product_name: product.name,
        product_description: product.description || '',
        category_id: product.category?.id || '',
        category_name: product.category?.name || 'Uncategorized',
        brand_id: product.brand?.id || '',
        brand_name: product.brand?.name || 'Unbranded',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: 0,
        total: item.quantity * item.unitPrice,
        sku: product.sku || '',
        reference: product.reference || ''
      }
    }).filter(Boolean) as InvoiceItem[];
    
    if (invoiceItems.length === 0) {
      console.error("No valid items found after product lookup");
      alert("Error with product data. Please try again.");
      return;
    }

    console.log("Invoice items:", invoiceItems);
    
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal // Remove tax calculation

    // Create the invoice object in the format that addInvoice expects
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
      due_date: newInvoice.dueDate ? new Date(newInvoice.dueDate).toISOString().split('T')[0] : undefined,
      notes: '',
      tax_rate: 0
    } as any; // Cast to any to bypass type checking

    console.log("Final invoice object to be sent to server:", invoice);
    
    try {
      if (editingInvoice && isEdit) {
        console.log("Updating existing invoice", editingInvoice.id);
        updateInvoice(editingInvoice.id, invoice)
          .then(() => {
            console.log("Invoice updated successfully");
            setNewInvoice({ providerId: "", items: [], dueDate: "" });
            setShowCreateForm(false);
            setIsEdit(false);
          })
          .catch(error => {
            console.error("Error updating invoice:", error);
            alert(`Failed to update invoice: ${error.message}`);
          });
      } else {
        console.log("Creating new invoice");
        addInvoice(invoice)
          .then(() => {
            console.log("Invoice created successfully");
            setNewInvoice({ providerId: "", items: [], dueDate: "" });
            setShowCreateForm(false);
            setIsEdit(false);
          })
          .catch(error => {
            console.error("Error creating invoice:", error);
            alert(`Failed to create invoice: ${error.message}`);
          });
      }
    } catch (error) {
      console.error("Error in invoice operation:", error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const InvoiceForm = ({ isEditForm = false }: { isEditForm?: boolean }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <div className="flex space-x-2">
            <SearchableSelect
              value={newInvoice.providerId}
              onValueChange={(value) => setNewInvoice({ ...newInvoice, providerId: value })}
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
            value={newInvoice.dueDate}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Invoice Items</h3>
          <div className="flex space-x-2">
            <Button onClick={addItemToInvoice} variant="outline">
              Add Existing Product
            </Button>
            <ProductForm
              categories={data.categories}
              brands={data.brands}
              onSubmit={handleAddProduct}
              onAddCategory={addCategory}
              onAddBrand={addBrand}
              trigger={
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              }
            />
          </div>
        </div>

        {newInvoice.items.map((item, index) => (
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

        {newInvoice.items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-end space-y-2">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {newInvoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100), 0).toFixed(2)} DZD
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {newInvoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100), 0).toFixed(2)} DZD
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
            if (isEditForm) {
              setShowEditForm(false)
              setEditingInvoice(null)
            } else {
              setShowCreateForm(false)
            }
            setNewInvoice({ providerId: "", items: [], dueDate: "" })
            setIsEdit(false) // Reset isEdit state after creating or updating invoice
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (isEditForm) {
              const provider = data.providers.find((p) => p.id === newInvoice.providerId)
              if (!provider || newInvoice.items.length === 0) return

              const invoiceItems: InvoiceItem[] = newInvoice.items.map((item, index) => {
                const product = data.products.find((p) => p.id === item.productId)!
                return {
                  id: `temp-${index}`,
                  product_id: product.id,
                  product_name: product.name,
                  product_description: product.description || '',
                  category_id: product.category?.id || '',
                  category_name: product.category?.name || 'Uncategorized',
                  brand_id: product.brand?.id || '',
                  brand_name: product.brand?.name || 'Unbranded',
                  quantity: item.quantity,
                  unit_price: Math.max(0.01, item.unitPrice),
                  discount: 0,
                  total: item.quantity * Math.max(0.01, item.unitPrice),
                  sku: product.sku || '',
                  reference: product.reference || ''
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
                due_date: newInvoice.dueDate ? new Date(newInvoice.dueDate).toISOString().split('T')[0] : undefined,
                notes: editingInvoice.notes || '',
                tax_rate: editingInvoice.tax_rate || 0
              };

              updateInvoice(editingInvoice.id, invoice)
              setNewInvoice({ providerId: "", items: [], dueDate: "" })
              setShowEditForm(false)
              setEditingInvoice(null)
            } else {
              createInvoice()
            }
          }}
          disabled={!newInvoice.providerId || newInvoice.items.length === 0}
        >
          {isEditForm ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        <p className="text-gray-600">Manage your billing and invoices</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Invoices</CardTitle>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild {...({} as any)}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle {...({} as any)}>Create New Invoice</DialogTitle>
                </DialogHeader>
                <InvoiceForm />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
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
                <SortableTableHeader sortKey="invoice_number" currentSort={sortConfig} onSort={handleSort}>
                  Invoice #
                </SortableTableHeader>
                <SortableTableHeader sortKey="provider_name" currentSort={sortConfig} onSort={handleSort}>
                  Provider
                </SortableTableHeader>
                <TableHead>Items</TableHead>
                <SortableTableHeader sortKey="total" currentSort={sortConfig} onSort={handleSort}>
                  Total
                </SortableTableHeader>
                <TableHead>Status</TableHead>
                <SortableTableHeader sortKey="created_at" currentSort={sortConfig} onSort={handleSort}>
                  Created
                </SortableTableHeader>
                <SortableTableHeader sortKey="due_date" currentSort={sortConfig} onSort={handleSort}>
                  Due Date
                </SortableTableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => invoice && (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number || invoice.id}</TableCell>
                  <TableCell>{invoice.provider_name || 'Default Provider'}</TableCell>
                  <TableCell>{invoice.items?.length || 0} items</TableCell>
                  <TableCell>
                    {typeof invoice.total === 'number' 
                      ? invoice.total.toFixed(2) 
                      : Number(invoice.total || 0).toFixed(2)} DZD
                  </TableCell>
                  <TableCell>
                    <Select
                      value={invoice.status}
                      onValueChange={(value: any) => updateInvoiceStatus(invoice.id, value)}
                    >
                      <SelectTrigger className="w-32" {...({} as any)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent {...({} as any)}>
                        <SelectItem value="draft" {...({} as any)}>Draft</SelectItem>
                        <SelectItem value="sent" {...({} as any)}>Sent</SelectItem>
                        <SelectItem value="paid" {...({} as any)}>Paid</SelectItem>
                        <SelectItem value="overdue" {...({} as any)}>Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {invoice.created_at 
                      ? typeof invoice.created_at === 'string'
                        ? new Date(invoice.created_at).toLocaleDateString()
                        : invoice.created_at instanceof Date
                          ? invoice.created_at.toLocaleDateString()
                          : 'Unknown'
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {invoice.due_date
                      ? typeof invoice.due_date === 'string'
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : invoice.due_date instanceof Date
                          ? invoice.due_date.toLocaleDateString()
                          : 'N/A'
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInvoice(invoice)
                          setNewInvoice({
                            providerId: invoice.provider_id || "",
                            items: invoice.items?.map((item: InvoiceItem) => ({
                              productId: item.product_id || "",
                              quantity: item.quantity || 0,
                              unitPrice: item.unit_price || 0,
                            })) || [],
                            dueDate: invoice.due_date ? 
                              (typeof invoice.due_date === 'string' ? 
                                invoice.due_date.split("T")[0] : 
                                invoice.due_date instanceof Date ? 
                                  invoice.due_date.toISOString().split("T")[0] : "") : "",
                          })
                          setShowEditForm(true)
                          setIsEdit(true) // Set isEdit state when editing an invoice
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteInvoice(invoice.id)}>
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
            totalItems={sortedInvoices.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <InvoiceDetailsModalEnhanced
        invoice={selectedInvoice}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle {...({} as any)}>Edit Invoice: {editingInvoice?.invoice_number || editingInvoice?.id}</DialogTitle>
          </DialogHeader>
          <InvoiceForm isEditForm={true} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
