"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { useCRM } from "@/contexts/crm-context"
import type { ClientDailyLog } from "@/lib/daily-logs-types"
import { Users, Calendar, Clock, CheckCircle, User, Mail, FileText, Search, DollarSign, Briefcase } from "lucide-react"

interface ClientDailyLogDetailsModalEnhancedProps {
  log: ClientDailyLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDailyLogDetailsModalEnhanced({
  log,
  open,
  onOpenChange,
}: ClientDailyLogDetailsModalEnhancedProps) {
  const { data } = useCRM()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "name",
    direction: "asc",
  })
  const [domainFilter, setDomainFilter] = useState("all")

  // Create type-casted components to fix TypeScript errors
  const TypeSafeDialogTitle = DialogTitle as any;
  const TypeSafeSelectTrigger = SelectTrigger as any;
  const TypeSafeSelectContent = SelectContent as any;
  const TypeSafeSelectItem = SelectItem as any;

  if (!log) return null
  
  // Debug log to see what client data is available
  console.log("Log data in modal:", log);
  console.log("Total clients from log:", log.totalClients);
  console.log("Clients array:", log.clients);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Debug the received log
  console.log("log clients in modal:", log.clients);
  console.log("log totalClients:", log.totalClients);
  
  // Get full client data for each client in the log
  // Make sure log.clients is always an array and has at least placeholders if totalClients > 0
  const clientsArray = (log.clients && log.clients.length > 0) 
    ? log.clients 
    : (log.totalClients > 0 
        ? Array.from({ length: log.totalClients }, (_, index) => ({
            id: `placeholder-${Date.now()}-${index}`, // Add index to make each key unique
            clientId: `unknown-${Date.now()}-${index}`,
            clientName: 'Unknown Client',
            clientEmail: '',
            addedAt: new Date(),
            notes: ''
          }))
        : []);
  
  const clientsWithFullData = clientsArray.map((logClient) => {
      console.log("Processing log client:", logClient);
      
      // Try to retrieve the client by ID first
      let fullClient = data.clients.find((c) => c.id === logClient.clientId);
      
      // If we couldn't find the client by ID but have a client name, try to match by name
      if (!fullClient && logClient.clientName) {
        fullClient = data.clients.find((c) => 
          `${c.firstName} ${c.lastName}`.toLowerCase() === logClient.clientName.toLowerCase()
        );
      }
      
      console.log("Found full client data:", fullClient ? "Yes" : "No", fullClient);
      
      // Extract first and last name from the client name
      let firstName = "Unknown";
      let lastName = "";
      
      if (logClient.clientName) {
        const nameParts = logClient.clientName.split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }
      
      return {
        ...logClient,
        fullData: fullClient || {
          // Provide fallback data if the full client data isn't found
          id: logClient.clientId,
          firstName: firstName,
          lastName: lastName,
          email: logClient.clientEmail || 'No email',
          phoneNumber: 'N/A',
          gender: 'N/A',
          birthDate: new Date(),
          professionalDomain: 'Unknown',
          revenue: 0
        }
      };
    });
    // Don't filter out clients even if they're not found in the system
    // This ensures all clients from the log are displayed

  console.log("Clients with full data:", clientsWithFullData);
  console.log("Original clients count:", log.clients?.length);
  console.log("Processed clients count:", clientsWithFullData.length);

  // Debug clientsWithFullData
  console.log("clientsWithFullData before filtering:", clientsWithFullData);

  // Filter clients - only filter if there's a search term or domain filter
  const filteredClients = clientsWithFullData.filter((client) => {
    // If no filters are applied, include all clients
    if (searchTerm === "" && domainFilter === "all") {
      return true;
    }
    
    const fullData = client.fullData;
    const matchesSearch = searchTerm === "" ? true :
      (fullData.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fullData.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fullData.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fullData.phoneNumber || '').includes(searchTerm);

    // Handle empty or undefined domain values
    const clientDomain = fullData.professionalDomain || '';
    const matchesDomain = domainFilter === "all" || clientDomain === domainFilter;

    return matchesSearch && matchesDomain;
  });

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortConfig) return 0

    let aValue: any
    let bValue: any

    switch (sortConfig.key) {
      case "name":
        aValue = `${a.fullData!.firstName} ${a.fullData!.lastName}`
        bValue = `${b.fullData!.firstName} ${b.fullData!.lastName}`
        break
      case "email":
        aValue = a.fullData!.email
        bValue = b.fullData!.email
        break
      case "phone":
        aValue = a.fullData!.phoneNumber
        bValue = b.fullData!.phoneNumber
        break
      case "domain":
        aValue = a.fullData!.professionalDomain
        bValue = b.fullData!.professionalDomain
        break
      case "revenue":
        aValue = a.fullData!.revenue
        bValue = b.fullData!.revenue
        break
      case "addedAt":
        aValue = a.addedAt
        bValue = b.addedAt
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedClients.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedClients = sortedClients.slice(startIndex, startIndex + pageSize)

  // Get unique domains for filter
  const domains = [...new Set(clientsWithFullData.map((client) => client.fullData!.professionalDomain))]

  // Ensure we're using the clientsWithFullData for our count
  const clients = log.clients || []
  const clientsCount = clientsWithFullData.length

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />
  }

  const getStatusColor = (isClosed: boolean) => {
    return isClosed
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  }

  const formatDate = (date: Date | undefined) => {
    return date ? date.toLocaleDateString() : "Unknown date"
  }

  const formatDateTime = (date: Date | undefined) => {
    return date ? date.toLocaleString() : "Unknown time"
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Client Daily Log - {formatDate(log.date)}</span>
          </TypeSafeDialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Log Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Log Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{formatDate(log.date)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(log.isClosed)}
                  <Badge className={getStatusColor(log.isClosed)}>{log.isClosed ? "Closed" : "Open"}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">{log.totalClients || 0}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{log.createdBy || "Unknown"}</span>
                </div>
              </div>
              {log.closedAt && (
                <div className="col-span-full">
                  <p className="text-sm font-medium text-muted-foreground">Closed At</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(log.closedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clients List with Enhanced Features */}
          <Card>
            <CardHeader>
              <CardTitle>Clients Added ({log.totalClients || clientsCount})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <TypeSafeSelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by domain" />
                  </TypeSafeSelectTrigger>
                  <TypeSafeSelectContent>
                    <TypeSafeSelectItem value="all">All Domains</TypeSafeSelectItem>
                    {domains.map((domain) => (
                      domain ? (
                        <TypeSafeSelectItem key={domain} value={domain}>
                          {domain}
                        </TypeSafeSelectItem>
                      ) : null
                    ))}
                  </TypeSafeSelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {(clientsWithFullData.length > 0) ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableTableHeader sortKey="name" currentSort={sortConfig} onSort={handleSort}>
                            Client Name
                          </SortableTableHeader>
                          <SortableTableHeader sortKey="email" currentSort={sortConfig} onSort={handleSort}>
                            Email
                          </SortableTableHeader>
                          <SortableTableHeader sortKey="phone" currentSort={sortConfig} onSort={handleSort}>
                            Phone
                          </SortableTableHeader>
                          <TableHead>Age</TableHead>
                          <SortableTableHeader sortKey="domain" currentSort={sortConfig} onSort={handleSort}>
                            Professional Domain
                          </SortableTableHeader>
                          <SortableTableHeader sortKey="revenue" currentSort={sortConfig} onSort={handleSort}>
                            Revenue
                          </SortableTableHeader>
                          <SortableTableHeader sortKey="addedAt" currentSort={sortConfig} onSort={handleSort}>
                            Added At
                          </SortableTableHeader>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedClients.map((client, index) => {
                          const fullData = client.fullData;
                          return (
                            <TableRow key={client.id || `client-${index}-${fullData.id}`}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-xs bg-muted px-2 py-1 rounded mr-2">{fullData.gender || 'N/A'}</span>
                                    <span>
                                      {fullData.firstName || ''} {fullData.lastName || ''}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>{fullData.email || 'No email'}</span>
                                </div>
                              </TableCell>
                              <TableCell>{fullData.phoneNumber || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {fullData.birthDate ? 
                                      (calculateAge(fullData.birthDate) === 'N/A' ? 'N/A' : `${calculateAge(fullData.birthDate)} years`) : 
                                      'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="outline">{fullData.professionalDomain || 'Unknown'}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">
                                    {(fullData.revenue || 0).toLocaleString()} DZD
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDateTime(client.addedAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {client.notes ? (
                                  <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span className="text-sm">{client.notes}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No notes</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

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
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No clients added to this log yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Log created</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(log.date)}</p>
                  </div>
                </div>
                {clients.map((client, index) => (
                  <div key={`client-${index}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Client added</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(client.addedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
