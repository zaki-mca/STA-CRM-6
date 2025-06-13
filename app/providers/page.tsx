"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { ProviderForm } from "@/components/provider-form"
import { ProviderDetailsModal } from "@/components/provider-details-modal"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useCRM } from "@/contexts/crm-context"
import { toast } from "@/lib/toast"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import type { Provider } from "@/lib/types"

export default function ProvidersPage() {
  const { data, addProvider, updateProvider, deleteProvider } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredProviders = data.providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof Provider]
    const bValue = b[sortConfig.key as keyof Provider]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedProviders.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedProviders = sortedProviders.slice(startIndex, startIndex + pageSize)

  const handleSearch = (query: string) => {
    setSearchTerm(query)
    setCurrentPage(1)
  }

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider)
    setShowDetailsModal(true)
  }
  
  const handleDeleteClick = (providerId: string) => {
    setProviderToDelete(providerId)
    setShowDeleteConfirmation(true)
  }
  
  const handleConfirmDelete = async () => {
    if (providerToDelete) {
      try {
        await deleteProvider(providerToDelete)
        toast.success("Provider deleted successfully", {
          position: "top-right",
          autoClose: 3000
        })
        setProviderToDelete(null)
      } catch (error: any) {
        console.error("Error deleting provider:", error)
        
        // Check for foreign key constraint violation
        if (error.message && error.message.includes("still referenced from table")) {
          if (error.message.includes("invoices")) {
            toast.error("Cannot delete this provider because it has associated invoices. Please delete the invoices first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else if (error.message.includes("products")) {
            toast.error("Cannot delete this provider because it has associated products. Please delete the products first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else {
            toast.error("Cannot delete this provider because it is referenced by other records in the system.", {
              position: "top-right",
              autoClose: 5000
            })
          }
        } else {
          toast.error("Failed to delete provider: " + (error.message || "Unknown error"), {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Providers</h1>
        <p className="text-gray-600">Manage your suppliers and vendors</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Providers</CardTitle>
            <ProviderForm
              onSubmit={addProvider}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
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
                <SortableTableHeader sortKey="email" currentSort={sortConfig} onSort={handleSort}>
                  Email
                </SortableTableHeader>
                <SortableTableHeader sortKey="phoneNumber" currentSort={sortConfig} onSort={handleSort}>
                  Phone
                </SortableTableHeader>
                <TableHead>Address</TableHead>
                <SortableTableHeader sortKey="createdAt" currentSort={sortConfig} onSort={handleSort}>
                  Created
                </SortableTableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.email}</TableCell>
                  <TableCell>{provider.phoneNumber}</TableCell>
                  <TableCell className="max-w-xs truncate">{provider.address}</TableCell>
                  <TableCell>{provider.createdAt ? provider.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(provider)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ProviderForm
                        provider={provider}
                        onSubmit={(data) => updateProvider(provider.id, data)}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(provider.id)}>
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
            totalItems={sortedProviders.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <ProviderDetailsModal provider={selectedProvider} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
      
      <ConfirmationDialog
        title="Delete Provider"
        description="Are you sure you want to delete this provider? This action cannot be undone."
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
