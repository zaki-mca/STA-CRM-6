"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { SearchableSelect } from "@/components/searchable-select"
import { ClientForm } from "@/components/client-form"
import { ClientDailyLogDetailsModalEnhanced } from "@/components/client-daily-log-details-modal-enhanced"
import { useCRM } from "@/contexts/crm-context"
import { useDailyLogs } from "@/contexts/daily-logs-context"
import {
  Plus,
  Search,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Eye,
  Lock,
  Send,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
} from "lucide-react"
import { toast } from "@/lib/toast"

export default function ClientDailyLogsPage() {
  const { data, addClient, addProfessionalDomain } = useCRM()
  const { clientLogs: initialClientLogs, createClientDailyLog, addClientToLog, closeClientDailyLog, getLogById } = useDailyLogs()
  const [clientLogs, setClientLogs] = useState(initialClientLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [showCreateLogForm, setShowCreateLogForm] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [newClientData, setNewClientData] = useState({
    clientId: "",
    notes: "",
  })

  // For the create log form data table
  const [logSearchTerm, setLogSearchTerm] = useState("")
  const [logCurrentPage, setLogCurrentPage] = useState(1)
  const [logPageSize, setLogPageSize] = useState(5)
  const [logSortConfig, setLogSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [domainFilter, setDomainFilter] = useState("All Domains")
  const [addedClients, setAddedClients] = useState<any[]>([])
  const [isUpdatingLog, setIsUpdatingLog] = useState(false)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const handleLogSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (logSortConfig && logSortConfig.key === key && logSortConfig.direction === "asc") {
      direction = "desc"
    }
    setLogSortConfig({ key, direction })
  }
  
  // Keep local state in sync with context when initialClientLogs changes
  useEffect(() => {
    setClientLogs(initialClientLogs);
  }, [initialClientLogs]);

  const filteredLogs = clientLogs.filter(
    (log) =>
      (log.date?.toLocaleDateString() || '').includes(searchTerm.toLowerCase()) ||
      log.totalClients?.toString().includes(searchTerm),
  )

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof a]

    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedLogs.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize)

  const clientOptions = data.clients.map((client) => ({
    value: client.id,
    label: `${client.gender} ${client.firstName} ${client.lastName}`,
    email: client.email,
    domain: client.professionalDomain,
  }))

  // Filter and sort clients for the data table in create log form
  const filteredClients = addedClients.filter((client) => {
    const fullClient = data.clients.find((c) => c.id === client.clientId)
    if (!fullClient) return false

    const matchesSearch =
      fullClient.firstName.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      fullClient.lastName.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      fullClient.email.toLowerCase().includes(logSearchTerm.toLowerCase())

    const matchesDomain = domainFilter === "All Domains" || fullClient.professionalDomain === domainFilter

    return matchesSearch && matchesDomain
  })

  const sortedAddedClients = [...filteredClients].sort((a, b) => {
    if (!logSortConfig) return 0

    const aClient = data.clients.find((c) => c.id === a.clientId)
    const bClient = data.clients.find((c) => c.id === b.clientId)

    if (!aClient || !bClient) return 0

    let aValue: any
    let bValue: any

    switch (logSortConfig.key) {
      case "name":
        aValue = `${aClient.firstName} ${aClient.lastName}`
        bValue = `${bClient.firstName} ${bClient.lastName}`
        break
      case "email":
        aValue = aClient.email
        bValue = bClient.email
        break
      case "domain":
        aValue = aClient.professionalDomain
        bValue = bClient.professionalDomain
        break
      case "revenue":
        aValue = aClient.revenue
        bValue = bClient.revenue
        break
      case "addedAt":
        aValue = a.addedAt
        bValue = b.addedAt
        break
      default:
        return 0
    }

    if (aValue < bValue) return logSortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return logSortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const logTotalPages = Math.ceil(sortedAddedClients.length / logPageSize)
  const logStartIndex = (logCurrentPage - 1) * logPageSize
  const logPaginatedClients = sortedAddedClients.slice(logStartIndex, logStartIndex + logPageSize)

  // Get unique domains for filter
  const domains = [...new Set(data.clients.map((client) => client.professionalDomain))]

  const addClientToCurrentLog = () => {
    if (newClientData.clientId) {
      const client = data.clients.find((c) => c.id === newClientData.clientId)
      if (client) {
        const newAddedClient = {
          id: Date.now().toString(),
          clientId: newClientData.clientId,
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email,
          addedAt: new Date(),
          notes: newClientData.notes,
          isOriginal: false, // Mark as new client
        }
        setAddedClients([...addedClients, newAddedClient])
        setNewClientData({ clientId: "", notes: "" })
        toast.success("Client added successfully. You can continue adding more clients.", {
          position: "top-right",
          autoClose: 3000
        })
      }
    }
  }

  const removeClientFromLog = (clientId: string) => {
    setAddedClients(addedClients.filter((c) => c.id !== clientId))
  }

  const handleCreateClient = async (clientData: any) => {
    const newClient = await addClient(clientData)

    // Add the new client to the current log
    const newAddedClient = {
      id: Date.now().toString(),
      clientId: newClient.id,
      clientName: `${clientData.firstName} ${clientData.lastName}`,
      clientEmail: clientData.email,
      addedAt: new Date(),
      notes: "New client created",
      isOriginal: false, // Mark as new client
    }
    setAddedClients([...addedClients, newAddedClient])

    toast.success("The new client has been created and added to today's log.", {
      position: "top-right",
      autoClose: 3000
    })
  }

  const submitDailyLog = async () => {
    if (addedClients.length === 0) {
      toast.warning("Please add at least one client before submitting.")
      return
    }

    // Don't allow updates to closed logs (double-check in case the log was closed while the form was open)
    if (isUpdatingLog && selectedLog && selectedLog.isClosed) {
      toast.warning("Closed logs cannot be updated.")
      return
    }

    try {
      const today = new Date()
      let newLogId: string
      let processedClients = 0

      if (isUpdatingLog && selectedLog) {
        newLogId = selectedLog.id
        // Only add clients that weren't already in the original log
        const originalClientIds = (selectedLog.clients || []).map((c: any) => c.clientId)
        const newClients = addedClients.filter((client) => !originalClientIds.includes(client.clientId))

        for (const client of newClients) {
          try {
            await addClientToLog(newLogId, client.clientId, client.notes || "")
            processedClients++
          } catch (err) {
            console.error(`Failed to add client ${client.clientId} to log:`, err)
            // Continue with other clients even if one fails
          }
        }
      } else {
        try {
          // Use the first client's ID when creating the log
          const firstClient = addedClients[0]
          newLogId = await createClientDailyLog(today, firstClient.clientId)
          processedClients++
          
          // Skip the first client in the loop as it was already added when creating the log
          for (let i = 1; i < addedClients.length; i++) {
            const client = addedClients[i]
            try {
              await addClientToLog(newLogId, client.clientId, client.notes || "")
              processedClients++
            } catch (err) {
              console.error(`Failed to add client ${client.clientId} to log:`, err)
              // Continue with other clients even if one fails
            }
          }
        } catch (err) {
          console.error("Failed to create daily log:", err)
          toast.error("There was an error creating the daily log. Please try again.")
          return // Stop execution if we can't even create the log
        }
      }

      setAddedClients([])
      setShowCreateLogForm(false)
      setIsUpdatingLog(false)
      setSelectedLog(null)
      
      // Show success message with accurate count
      toast.success(`${isUpdatingLog ? "Daily log updated" : "Daily log created"} successfully. ${processedClients} out of ${addedClients.length} clients ${isUpdatingLog ? "updated" : "added"}.`)
      
      // Close the form dialog without refreshing the page
      setShowCreateLogForm(false);
      
      // Refresh the logs data without refreshing the page
      if (getLogById && newLogId) {
        // Get the fresh log data
        getLogById(newLogId)
          .then(freshLog => {
            if (freshLog) {
            // If updating, replace the log in the list
            if (isUpdatingLog) {
              const updatedLogs = [...clientLogs];
              const indexToUpdate = updatedLogs.findIndex(log => log.id === newLogId);
              if (indexToUpdate !== -1) {
                updatedLogs[indexToUpdate] = freshLog;
                setClientLogs(updatedLogs);
              }
            } 
            // If creating, add the new log to the list
            else {
              setClientLogs([freshLog, ...clientLogs]);
            }
          }
          })
          .catch(err => {
            console.error("Failed to refresh log data:", err);
          });
      }
    } catch (err) {
      console.error("Failed to submit daily log:", err)
      toast.error("There was an error submitting the log. Please try again.")
    }
  }

  const handleViewDetails = async (log: any) => {
    try {
      // Try to fetch fresh log data by ID to ensure we have the latest and most complete data
      setSelectedLog(log) // Set initial log data to show loading state
      setShowDetailsModal(true)
      console.log("Fetching detailed log data for ID:", log.id);
      
      // If there's a refresh function in the daily logs context, use it to get fresh data
      if (getLogById) {
        try {
          const freshLog = await getLogById(log.id);
          console.log("Fetched fresh log data:", freshLog);
          if (freshLog) {
            setSelectedLog(freshLog);
            console.log("Updated log with fresh data");
            return;
          }
        } catch (err) {
          console.log("Error fetching fresh log data:", err);
          // Continue with existing data if fetch fails
        }
      }
      
      // Fallback to using the existing log data if we couldn't fetch fresh data
      // Make sure the log has clients property populated
      // Ensure the clients array is properly populated based on totalClients if needed
      let clientsArray = log.clients || [];
      
      console.log("Original log clients:", clientsArray);
      console.log("Log total clients:", log.totalClients);
      
      // If there's a mismatch between totalClients and clients array length
      // create placeholder clients to match the count
      if (clientsArray.length === 0 && log.totalClients > 0) {
        console.log("Creating placeholder clients to match totalClients count");
        clientsArray = Array.from({ length: log.totalClients }, (_, index) => ({
          id: `view-placeholder-${log.id}-${index}`,
          clientId: `unknown-client-${index}`,
          clientName: 'Unknown Client',
          clientEmail: '',
          addedAt: new Date(),
          notes: 'Details not fully loaded'
        }));
      }
      
      const logWithClients = {
        ...log,
        clients: clientsArray,
      }
      
      setSelectedLog(logWithClients)
      console.log("Log being sent to modal:", logWithClients)
    } catch (err) {
      console.error("Error preparing log details:", err);
      // Use the original log as fallback
      setSelectedLog(log)
      setShowDetailsModal(true)
    }
  }

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />
  }

  const getStatusColor = (isClosed: boolean) => {
    return isClosed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
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

  const handleUpdateLog = (log: any) => {
    // Don't allow updates to closed logs
    if (log.isClosed) {
      toast.warning("Closed logs cannot be updated.")
      return
    }
    
    setSelectedLog(log)
    setShowCreateLogForm(true)
    setIsUpdatingLog(true)

    // Load existing clients from the log into the addedClients state
    const existingClients = (log.clients || [])
      .map((logClient: any) => {
        const fullClient = data.clients.find((c) => c.id === logClient.clientId)
        if (fullClient) {
          return {
            id: logClient.id || Date.now().toString() + Math.random(), // Use existing ID or generate new one
            clientId: fullClient.id,
            clientName: `${fullClient.firstName} ${fullClient.lastName}`,
            clientEmail: fullClient.email,
            addedAt: logClient.addedAt || new Date(),
            notes: logClient.notes || "",
            isOriginal: true, // Mark as original client
          }
        }
        return null
      })
      .filter(Boolean)

    setAddedClients(existingClients)
  }

  // Wrapper for addProfessionalDomain to match the expected signature in ClientForm
  const handleAddProfessionalDomain = (name: string) => {
    addProfessionalDomain({ name })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Client Daily Logs</h1>
        <p className="text-gray-600">Track daily client registrations and activities</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Logs</CardTitle>
            <Dialog open={showCreateLogForm} onOpenChange={setShowCreateLogForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {isUpdatingLog ? "Update Log" : "Create Today's Log"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isUpdatingLog
                      ? `Update Client Daily Log - ${selectedLog?.date.toLocaleDateString()}`
                      : `Create Client Daily Log - ${new Date().toLocaleDateString()}`}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Add Client Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Client to Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Select Existing Client</h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select Client</Label>
                              <SearchableSelect
                                value={newClientData.clientId}
                                onValueChange={(value) => setNewClientData({ ...newClientData, clientId: value })}
                                options={clientOptions}
                                placeholder="Select client"
                                searchPlaceholder="Search clients..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add any notes about this client..."
                                value={newClientData.notes}
                                onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <Button
                              onClick={addClientToCurrentLog}
                              disabled={!newClientData.clientId}
                              className="w-full"
                            >
                              Add Client to Log
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Create New Client</h3>
                          <ClientForm
                            professionalDomains={data.professionalDomains}
                            onSubmit={handleCreateClient}
                            onAddProfessionalDomain={handleAddProfessionalDomain}
                            trigger={<Button className="w-full">Create Client</Button>}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Added Clients Data Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Added Clients ({addedClients.length})</CardTitle>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center space-x-2 flex-1">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search clients..."
                            value={logSearchTerm}
                            onChange={(e) => setLogSearchTerm(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                        <Select value={domainFilter} onValueChange={setDomainFilter}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by domain" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Domains">All Domains</SelectItem>
                            {domains.map((domain) => (
                              <SelectItem key={domain} value={domain || "unknown"}>
                                {domain || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {addedClients.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <SortableTableHeader
                                    sortKey="name"
                                    currentSort={logSortConfig}
                                    onSort={handleLogSort}
                                  >
                                    Name
                                  </SortableTableHeader>
                                  <SortableTableHeader
                                    sortKey="email"
                                    currentSort={logSortConfig}
                                    onSort={handleLogSort}
                                  >
                                    Email
                                  </SortableTableHeader>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Age</TableHead>
                                  <SortableTableHeader
                                    sortKey="domain"
                                    currentSort={logSortConfig}
                                    onSort={handleLogSort}
                                  >
                                    Domain
                                  </SortableTableHeader>
                                  <SortableTableHeader
                                    sortKey="revenue"
                                    currentSort={logSortConfig}
                                    onSort={handleLogSort}
                                  >
                                    Revenue
                                  </SortableTableHeader>
                                  <SortableTableHeader
                                    sortKey="addedAt"
                                    currentSort={logSortConfig}
                                    onSort={handleLogSort}
                                  >
                                    Added At
                                  </SortableTableHeader>
                                  <TableHead>Notes</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {logPaginatedClients.map((addedClient, index) => {
                                  const fullClient = data.clients.find((c) => c.id === addedClient.clientId)
                                  if (!fullClient) return null

                                  return (
                                    <TableRow key={addedClient.id || `client-row-${index}-${fullClient.id}`}>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs bg-muted px-2 py-1 rounded">
                                            {fullClient.gender}
                                          </span>
                                          <span>
                                            {fullClient.firstName} {fullClient.lastName}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <span>{fullClient.email}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span>{fullClient.phoneNumber}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <span>{calculateAge(fullClient.birthDate) === 'N/A' ? 'N/A' : `${calculateAge(fullClient.birthDate)} years`}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-2">
                                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                                          <Badge variant="outline">{fullClient.professionalDomain}</Badge>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <DollarSign className="h-4 w-4 text-green-600" />
                                          <span className="font-medium text-green-600">
                                            {fullClient.revenue.toLocaleString()} DZD
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">{addedClient.addedAt.toLocaleTimeString()}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm">{addedClient.notes || "No notes"}</span>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeClientFromLog(addedClient.id)}
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          <Pagination
                            currentPage={logCurrentPage}
                            totalPages={logTotalPages}
                            pageSize={logPageSize}
                            totalItems={sortedAddedClients.length}
                            onPageChange={setLogCurrentPage}
                            onPageSizeChange={(size) => {
                              setLogPageSize(size)
                              setLogCurrentPage(1)
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

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateLogForm(false)
                        setIsUpdatingLog(false)
                        setSelectedLog(null)
                        setAddedClients([])
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitDailyLog} disabled={addedClients.length === 0}>
                      <Send className="mr-2 h-4 w-4" />
                      {isUpdatingLog ? "Update Daily Log" : `Submit Daily Log (${addedClients.length} clients)`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
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
                <SortableTableHeader sortKey="date" currentSort={sortConfig} onSort={handleSort}>
                  Date
                </SortableTableHeader>
                <SortableTableHeader sortKey="totalClients" currentSort={sortConfig} onSort={handleSort}>
                  Total Clients
                </SortableTableHeader>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log, index) => (
                <TableRow key={log.id || `log-row-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{log.date?.toLocaleDateString() || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{log.totalClients}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.isClosed)}
                      <Badge className={getStatusColor(log.isClosed)}>{log.isClosed ? "Closed" : "Open"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{log.createdBy}</TableCell>
                  <TableCell>{log.closedAt ? log.closedAt.toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!log.isClosed && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleUpdateLog(log)}>
                            Update
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Lock className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Close Client Daily Log</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to close this client daily log for {log.date?.toLocaleDateString()}?
                                  <span className="block mt-2">This action cannot be undone and the log cannot be reopened or modified after closing.</span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => closeClientDailyLog(log.id)}>Close Log</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
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
            totalItems={sortedLogs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <ClientDailyLogDetailsModalEnhanced
        log={selectedLog}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  )
}
