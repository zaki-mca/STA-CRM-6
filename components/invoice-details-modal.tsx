"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCRM } from "@/contexts/crm-context"
import type { Invoice } from "@/lib/types"
import { FileText, Building, Calendar, DollarSign, Tag } from "lucide-react"

// Type-cast DialogTitle for type safety
const DialogTitle = RadixDialogTitle as any;

interface InvoiceDetailsModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function InvoiceDetailsModal({ invoice, open, onOpenChange }: InvoiceDetailsModalProps) {
  if (!invoice) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Invoice Details: {invoice.invoice_number || invoice.id}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                <p className="text-lg font-semibold">{invoice.invoice_number || invoice.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created Date</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(invoice.due_date)}</span>
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
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Provider Name</p>
                <p className="text-lg font-semibold">{invoice.provider_name || 'Unknown Provider'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{invoice.provider_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p>{invoice.provider_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p>{invoice.provider_address || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Reference/SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(invoice.items) ? invoice.items : []).map((item, index) => (
                    <TableRow key={item?.id || index}>
                      <TableCell className="font-medium">
                        {item?.product_name || "Unknown Product"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span>{item?.sku || item?.reference || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item?.product_description || "N/A"}
                      </TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
                      <TableCell>
                        {((item?.unit_price || 0)).toFixed(2)} DZD
                      </TableCell>
                      <TableCell>
                        {item?.discount ? `${item?.discount}%` : '0%'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {(item?.total || 
                          ((item?.quantity || 0) * (item?.unit_price || 0) * 
                          (1 - (item?.discount || 0) / 100))).toFixed(2)} DZD
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!Array.isArray(invoice.items) || invoice.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                        No items found for this invoice
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Financial Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{typeof invoice.subtotal === 'number' ? invoice.subtotal.toFixed(2) : '0.00'} DZD</span>
                </div>
                {invoice.tax_rate !== undefined && invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_rate}%):</span>
                    <span>{((invoice.subtotal || 0) * ((invoice.tax_rate || 0) / 100)).toFixed(2)} DZD</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>{typeof invoice.total === 'number' ? invoice.total.toFixed(2) : '0.00'} DZD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
