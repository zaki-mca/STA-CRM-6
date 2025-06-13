"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { ProfessionalDomainForm } from "@/components/professional-domain-form"
import { useCRM } from "@/contexts/crm-context"
import { Plus, Search, Edit, Trash2, Shield, Code, AlertTriangle } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProfessionalDomainsPage() {
  const { data, addProfessionalDomain, updateProfessionalDomain, deleteProfessionalDomain, bulkUploadProfessionalDomains, refreshData } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [isAdmin] = useState(true) // Simplified admin check
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const filteredDomains = data.professionalDomains.filter(
    (domain) =>
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (domain.paymentCode && domain.paymentCode.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const sortedDomains = [...filteredDomains].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedDomains.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedDomains = sortedDomains.slice(startIndex, startIndex + pageSize)

  const handleSearch = (query: string) => {
    setSearchTerm(query)
    setCurrentPage(1)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Professional Domains</h1>
        <p className="text-gray-600">Manage business sectors and payment codes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <span>All Professional Domains</span>
              {isAdmin && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin View
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <FileUpload
                apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/professional-domains/bulk-upload`}
                entityType="professional domain"
                onUploadSuccess={(newDomains) => {
                  // Enhanced success message with more details using react-toastify
                  if (newDomains.length === 0) {
                    toast.info("No new professional domains were added", {
                      position: "top-right",
                      autoClose: 5000
                    });
                  } else {
                    toast.success(
                      <div>
                        <p className="font-semibold mb-1">Successfully uploaded {newDomains.length} {newDomains.length === 1 ? 'professional domain' : 'professional domains'}</p>
                        <ul className="list-disc pl-4 mt-1 text-sm max-h-32 overflow-auto">
                          {newDomains.slice(0, 5).map((domain: { name: string, paymentCode?: string }, idx: number) => (
                            <li key={idx}>
                              {domain.name}
                              {domain.paymentCode && <span className="text-purple-600 ml-1">(Code: {domain.paymentCode})</span>}
                            </li>
                          ))}
                          {newDomains.length > 5 && <li>...and {newDomains.length - 5} more</li>}
                        </ul>
                      </div>,
                      {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      }
                    );
                  }
                  
                  // Refresh data and notify when complete with react-toastify
                  const refreshPromise = refreshData();
                  toast.promise(
                    refreshPromise,
                    {
                      pending: 'Updating professional domains list...',
                      success: 'Professional domains list refreshed successfully!',
                      error: 'Failed to refresh professional domains'
                    },
                    {
                      position: "top-right",
                      autoClose: 3000
                    }
                  );
                }}
              />
              <ProfessionalDomainForm
                onSubmit={addProfessionalDomain}
                isAdmin={isAdmin}
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Domain
                  </Button>
                }
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search domains or payment codes..."
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
                  Domain Name
                </SortableTableHeader>
                {isAdmin && (
                  <SortableTableHeader sortKey="paymentCode" currentSort={sortConfig} onSort={handleSort}>
                    Payment Code
                  </SortableTableHeader>
                )}
                <TableHead>Clients Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDomains.map((domain) => {
                const clientsCount = data.clients.filter((c) => c.professionalDomain === domain.name).length

                return (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.name}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {domain.paymentCode ? (
                          <div className="flex items-center space-x-2">
                            <Code className="h-4 w-4 text-purple-600" />
                            <span className="font-mono text-sm bg-purple-50 dark:bg-purple-900 px-2 py-1 rounded text-purple-800 dark:text-purple-100">
                              {domain.paymentCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No code</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">{clientsCount} clients</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <ProfessionalDomainForm
                          domain={domain}
                          onSubmit={(data) => updateProfessionalDomain(domain.id, data)}
                          isAdmin={isAdmin}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDomainToDelete(domain.id)}
                              disabled={clientsCount > 0}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the professional domain &quot;{domain.name}&quot;.
                                {clientsCount > 0 && (
                                  <span className="mt-2 block text-amber-600">
                                    Warning: This domain is used by {clientsCount} client(s).
                                    You must remove the domain from these clients before deleting.
                                  </span>
                                )}
                                {domain.paymentCode && clientsCount === 0 && (
                                  <span className="mt-2 block text-amber-600">
                                    Warning: This domain has a payment code ({domain.paymentCode}) associated with it.
                                  </span>
                                )}
                                {clientsCount === 0 && (
                                  <span className="block mt-2">This action cannot be undone.</span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDomainToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  if (domainToDelete) {
                                    deleteProfessionalDomain(domain.id);
                                    toast.success(`Professional domain "${domain.name}" deleted successfully`);
                                  }
                                }}
                                disabled={clientsCount > 0}
                                className={clientsCount === 0 ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            totalItems={sortedDomains.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
