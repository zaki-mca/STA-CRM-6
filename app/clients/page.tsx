"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { ClientForm } from "@/components/client-form"
import { ClientDetailsModal } from "@/components/client-details-modal"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useCRM } from "@/contexts/crm-context"
import { toast } from "@/lib/toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  CreditCard,
  Calculator,
  FileText,
  Eye,
  Code,
} from "lucide-react"

export default function ClientsPage() {
  const { data, addClient, updateClient, deleteClient, addProfessionalDomain } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredClients = data.clients.filter(
    (client) =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.professionalDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ccpAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rip.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof a]

    // Handle undefined values for comparison
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return sortConfig.direction === "asc" ? -1 : 1
    if (bValue === undefined) return sortConfig.direction === "asc" ? 1 : -1

    // Compare values when both are defined
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedClients.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedClients = sortedClients.slice(startIndex, startIndex + pageSize)

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

  const handleViewDetails = (client: any) => {
    setSelectedClient(client)
    setShowDetailsModal(true)
  }

  const handleAddProfessionalDomain = (name: string) => {
    addProfessionalDomain({ name })
  }
  
  const handleDeleteClick = (clientId: string) => {
    setClientToDelete(clientId)
    setShowDeleteConfirmation(true)
  }
  
  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete)
        toast.success("Client deleted successfully", {
          position: "top-right",
          autoClose: 3000
        })
        setClientToDelete(null)
      } catch (error: any) {
        console.error("Error deleting client:", error)
        
        // Check for foreign key constraint violation
        if (error.message && error.message.includes("still referenced from table")) {
          if (error.message.includes("invoices")) {
            toast.error("Cannot delete this client because they have associated invoices. Please delete the invoices first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else if (error.message.includes("orders")) {
            toast.error("Cannot delete this client because they have associated orders. Please delete the orders first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else if (error.message.includes("client_logs")) {
            toast.error("Cannot delete this client because they have associated logs. Please delete the logs first.", {
              position: "top-right",
              autoClose: 5000
            })
          } else {
            toast.error("Cannot delete this client because they are referenced by other records in the system.", {
              position: "top-right",
              autoClose: 5000
            })
          }
        } else {
          toast.error("Failed to delete client: " + (error.message || "Unknown error"), {
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
        <h1 className="text-3xl font-bold">🇩🇿 Clients</h1>
        <p className="text-muted-foreground">Manage your customers and Algeria CCP accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Clients</CardTitle>
            <ClientForm
              professionalDomains={data.professionalDomains}
              onSubmit={addClient}
              onAddProfessionalDomain={handleAddProfessionalDomain}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
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
                <SortableTableHeader sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>
                  Name
                </SortableTableHeader>
                <SortableTableHeader sortKey="email" currentSort={sortConfig} onSort={handleSort}>
                  Email
                </SortableTableHeader>
                <SortableTableHeader sortKey="phoneNumber" currentSort={sortConfig} onSort={handleSort}>
                  Phone
                </SortableTableHeader>
                <TableHead>Age</TableHead>
                <TableHead>Professional Domain</TableHead>
                <TableHead>Domain Code</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>CCP Account</TableHead>
                <TableHead>Clé CCP</TableHead>
                <TableHead>RIP</TableHead>
                <TableHead>RIP Clé</TableHead>
                <TableHead>Address</TableHead>
                <SortableTableHeader sortKey="createdAt" currentSort={sortConfig} onSort={handleSort}>
                  Created
                </SortableTableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">{client.gender}</span>
                      <span>{`${client.firstName} ${client.lastName}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phoneNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{calculateAge(client.birthDate) === 'N/A' ? 'N/A' : `${calculateAge(client.birthDate)} years`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.professionalDomain}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.professionalDomainCode ? (
                      <div className="flex items-center space-x-1">
                        <Code className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                        <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-100">
                          {client.professionalDomainCode}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No code</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-300" />
                      <span className="font-medium text-green-600 dark:text-green-300">
                        {(client.revenue ? client.revenue.toLocaleString() : '0')} DZD
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <span className="font-mono text-sm">{client.ccpAccount || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                      <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded font-bold dark:bg-gray-800 dark:text-gray-100">
                        {client.cle || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded max-w-[140px] truncate dark:bg-gray-800 dark:text-gray-100">
                      {client.rip || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                      <span className="font-mono text-sm bg-orange-50 px-2 py-1 rounded font-bold dark:bg-gray-800 dark:text-gray-100">
                        {client.ripCle || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{client.address}</TableCell>
                  <TableCell>{client.createdAt ? client.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ClientForm
                        client={client}
                        professionalDomains={data.professionalDomains}
                        onSubmit={(data) => updateClient(client.id, data)}
                        onAddProfessionalDomain={handleAddProfessionalDomain}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(client.id)}>
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
            totalItems={sortedClients.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <ClientDetailsModal client={selectedClient} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
      
      <ConfirmationDialog
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
