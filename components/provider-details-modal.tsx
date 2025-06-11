"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCRM } from "@/contexts/crm-context"
import type { Provider } from "@/lib/types"
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"

// Type-cast component to fix type error
const DialogTitle = RadixDialogTitle as any;

interface ProviderDetailsModalProps {
  provider: Provider | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProviderDetailsModal({ provider, open, onOpenChange }: ProviderDetailsModalProps) {
  const { data } = useCRM()

  if (!provider) return null

  const providerInvoices = data.invoices.filter((invoice) => invoice.provider_id === provider.id)
  const totalSpent = providerInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const paidInvoices = providerInvoices.filter((invoice) => invoice.status === "paid")
  const pendingInvoices = providerInvoices.filter((invoice) => invoice.status !== "paid")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "sent":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
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
            <span>Provider Details: {provider.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">{provider.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{provider.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p>{provider.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p>{provider.createdAt ? provider.createdAt.toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p>{provider.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{totalSpent.toLocaleString()} DZD</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{paidInvoices.length}</p>
                    <p className="text-sm text-gray-500">Paid Invoices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                    <p className="text-sm text-gray-500">Pending Invoices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices History</CardTitle>
            </CardHeader>
            <CardContent>
              {providerInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providerInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number || `INV-${invoice.id.substring(0, 8)}`}</TableCell>
                        <TableCell>{invoice.created_at instanceof Date ? invoice.created_at.toLocaleDateString() : typeof invoice.created_at === 'string' ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{invoice.due_date ? (typeof invoice.due_date === 'string' ? new Date(invoice.due_date).toLocaleDateString() : (invoice.due_date as Date).toLocaleDateString()) : 'N/A'}</TableCell>
                        <TableCell>{invoice.items.length} items</TableCell>
                        <TableCell className="font-semibold">{invoice.total.toLocaleString()} DZD</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(invoice.status)}
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found for this provider</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
