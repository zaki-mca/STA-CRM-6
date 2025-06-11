"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import type { Invoice } from "@/lib/types"
import { FileText, Building, Calendar, DollarSign, Search, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Type-cast DialogTitle for type safety
const DialogTitle = RadixDialogTitle as any;

// Enhanced invoice type that includes backend fields
interface EnhancedInvoice {
  id: string;
  invoice_number?: string;
  invoiceNumber?: string;
  date?: string;
  due_date?: string;
  dueDate?: Date | string;
  createdAt?: Date | string;
  status: string;
  provider_id?: string;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  provider_address?: string;
  provider?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    createdAt?: Date;
  };
  items?: Array<{
    id: string | number;
    product_id?: string;
    product_name?: string;
    reference?: string;
    sku?: string;
    category_name?: string;
    brand_name?: string;
    quantity: number;
    unit_price?: number;
    unitPrice?: number;
    total?: number;
    product?: {
      id: string;
      name: string;
      description?: string;
      reference?: string;
      sku?: string;
      category?: { id: string; name: string };
      brand?: { id: string; name: string };
    };
  }>;
  subtotal?: number;
  total?: number;
  tax_rate?: number;
}

interface InvoiceDetailsModalEnhancedProps {
  invoice: EnhancedInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsModalEnhanced({ invoice, open, onOpenChange }: InvoiceDetailsModalEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")

  if (!invoice) return null

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Filter and sort items
  const filteredItems = invoice.items?.filter(
    (item) =>
      (item?.product?.name || item?.product_name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.product?.reference || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.product?.brand?.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.product?.category?.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryFilter === "all" ||
      item?.product?.category?.name === categoryFilter ||
      brandFilter === "all" ||
      item?.product?.brand?.name === brandFilter,
  ) || [];

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0

    let aValue: any
    let bValue: any

    switch (sortConfig.key) {
      case "name":
        aValue = a.product?.name || a.product_name || ""
        bValue = b.product?.name || b.product_name || ""
        break
      case "description":
        aValue = a.product?.description || ""
        bValue = b.product?.description || ""
        break
      case "category":
        aValue = a.product?.category?.name || a.category_name || ""
        bValue = b.product?.category?.name || b.category_name || ""
        break
      case "brand":
        aValue = a.product?.brand?.name || a.brand_name || ""
        bValue = b.product?.brand?.name || b.brand_name || ""
        break
      case "quantity":
        aValue = a.quantity || 0
        bValue = b.quantity || 0
        break
      case "unitPrice":
        aValue = a.unitPrice || a.unit_price || 0
        bValue = b.unitPrice || b.unit_price || 0
        break
      case "total":
        aValue = a.total || (a.quantity * (a.unitPrice || a.unit_price || 0)) || 0
        bValue = b.total || (b.quantity * (b.unitPrice || b.unit_price || 0)) || 0
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedItems.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize)

  // Get unique categories for filter
  const categories = [...new Set(invoice.items?.map(item => 
    item?.product?.category?.name || item?.category_name || "Uncategorized"
  ) || ["Uncategorized"])]

  // Get unique brands for filter
  const brands = [...new Set(invoice.items?.map(item => 
    item?.product?.brand?.name || item?.brand_name || "Unbranded"
  ) || ["Unbranded"])]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Helper function to get provider info
  const getProviderInfo = () => {
    return {
      name: invoice.provider?.name || invoice.provider_name || 'Unknown Provider',
      email: invoice.provider?.email || invoice.provider_email || 'N/A',
      phone: invoice.provider?.phoneNumber || invoice.provider_phone || 'N/A',
      address: invoice.provider?.address || invoice.provider_address || 'N/A'
    }
  }

  // Helper function to format date
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  }

  const provider = getProviderInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle {...({} as any)}>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Details: {invoice.invoice_number || invoice.invoiceNumber || invoice.id}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                <p className="text-lg font-semibold">{invoice.invoice_number || invoice.invoiceNumber || invoice.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(invoice.date || invoice.createdAt)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(invoice.due_date || invoice.dueDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Provider Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Provider Name</p>
                <p className="text-lg font-semibold">{provider.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{provider.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{provider.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{provider.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items with Enhanced Features */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" {...({} as any)}>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent {...({} as any)}>
                    <SelectItem value="all" {...({} as any)}>All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} {...({} as any)}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" {...({} as any)}>
                    <SelectValue placeholder="Filter by brand" />
                  </SelectTrigger>
                  <SelectContent {...({} as any)}>
                    <SelectItem value="all" {...({} as any)}>All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand} {...({} as any)}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHeader sortKey="name" currentSort={sortConfig} onSort={handleSort}>
                        Product
                      </SortableTableHeader>
                      <SortableTableHeader sortKey="description" currentSort={sortConfig} onSort={handleSort}>
                        Description
                      </SortableTableHeader>
                      <TableHead>Reference</TableHead>
                      <SortableTableHeader sortKey="brand" currentSort={sortConfig} onSort={handleSort}>
                        Brand
                      </SortableTableHeader>
                      <SortableTableHeader sortKey="category" currentSort={sortConfig} onSort={handleSort}>
                        Category
                      </SortableTableHeader>
                      <SortableTableHeader sortKey="quantity" currentSort={sortConfig} onSort={handleSort}>
                        Quantity
                      </SortableTableHeader>
                      <SortableTableHeader sortKey="unitPrice" currentSort={sortConfig} onSort={handleSort}>
                        Unit Price
                      </SortableTableHeader>
                      <SortableTableHeader sortKey="total" currentSort={sortConfig} onSort={handleSort}>
                        Total
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name || item.product_name || 'Unknown Product'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.product?.description || 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.product?.reference || item.reference || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.product?.brand?.name || item.brand_name || 'Unbranded'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.product?.category?.name || item.category_name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {typeof item.unitPrice === 'number'
                            ? item.unitPrice.toFixed(2)
                            : (typeof item.unit_price === 'number' 
                               ? item.unit_price.toFixed(2) 
                               : '0.00')} DZD
                        </TableCell>
                        <TableCell className="font-semibold">
                          {typeof item.total === 'number'
                            ? item.total.toFixed(2)
                            : (item.quantity * (item.unitPrice || item.unit_price || 0)).toFixed(2)}{' '}
                          DZD
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {sortedItems.length > pageSize && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={sortedItems.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Invoice Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{Number(invoice.subtotal || 0).toFixed(2)} DZD</span>
                </div>
                {invoice.tax_rate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
                    <span>
                      {(Number(invoice.subtotal || 0) * (Number(invoice.tax_rate) / 100)).toFixed(2)} DZD
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t font-medium text-lg">
                  <span>Total</span>
                  <span>{Number(invoice.total || 0).toFixed(2)} DZD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
