"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { SortableTableHeader } from "@/components/sortable-table-header"
import { SearchableSelect } from "@/components/searchable-select"
import { OrderForm } from "@/components/order-form"
import { OrderDailyLogDetailsModal } from "@/components/order-daily-log-details-modal"
import { useOrders } from "@/contexts/order-context"
import { useDailyLogs } from "@/contexts/daily-logs-context"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Calendar,
  ShoppingCart,
  Clock,
  CheckCircle,
  Eye,
  Package,
  Lock,
  DollarSign,
  Send,
  User,
  Mail,
  Edit,
  RefreshCw,
} from "lucide-react"
import * as React from "react"

export default function OrderDailyLogsPage() {
  const { orders, addOrder } = useOrders()
  const { 
    orderLogs: initialOrderLogs, 
    createOrderDailyLog, 
    addOrderToLog, 
    closeOrderDailyLog, 
    getOrderLogById, 
    refreshOrderLogs,
    addMultipleOrdersToLog 
  } = useDailyLogs()
  const [orderLogs, setOrderLogs] = useState(initialOrderLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [showCreateLogForm, setShowCreateLogForm] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [newOrderData, setNewOrderData] = useState({
    orderId: "",
    notes: "",
  })

  // For the create log form data table
  const [logSearchTerm, setLogSearchTerm] = useState("")
  const [logCurrentPage, setLogCurrentPage] = useState(1)
  const [logPageSize, setLogPageSize] = useState(5)
  const [logSortConfig, setLogSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [addedOrders, setAddedOrders] = useState<any[]>([])
  const [isUpdatingLog, setIsUpdatingLog] = useState(false)
  const [logToUpdate, setLogToUpdate] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

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
  
  // Keep local state in sync with context when initialOrderLogs changes
  useEffect(() => {
    setOrderLogs(initialOrderLogs);
    
    // For debugging purposes, log the current logs
    console.log("Order logs updated from context:", initialOrderLogs);
  }, [initialOrderLogs]);
  
  // Initial load and periodic refresh
  useEffect(() => {
    // This helps ensure we have fresh data at component mount
    const refreshAllLogs = async () => {
      try {
        // If we have no logs yet or they might need refreshing
        if ((initialOrderLogs.length === 0 || initialOrderLogs.some(log => !log.orders || log.orders.length === 0)) && refreshOrderLogs) {
          console.log("Component mounted, refreshing logs with refreshOrderLogs");
          setIsRefreshing(true);
          const refreshedLogs = await refreshOrderLogs();
          if (refreshedLogs && refreshedLogs.length > 0) {
            setOrderLogs(refreshedLogs);
            console.log("Successfully refreshed logs:", refreshedLogs);
          } else {
            console.warn("No logs returned from refreshOrderLogs");
          }
          setIsRefreshing(false);
        } else if (initialOrderLogs.length === 0) {
          console.warn("No logs available and refreshOrderLogs is not defined");
        }
      } catch (err) {
        console.error("Failed to refresh all logs:", err);
        setIsRefreshing(false);
      }
    };
    
    refreshAllLogs();
  }, []); // Only run on mount

  const filteredLogs = orderLogs.filter(
    (log) =>
      (log.date ? log.date.toLocaleDateString() : '').includes(searchTerm.toLowerCase()) ||
      (log.totalOrders !== undefined ? log.totalOrders.toString() : '').includes(searchTerm) ||
      (log.totalValue !== undefined ? log.totalValue.toString() : '').includes(searchTerm),
  )

  const sortedLogs = [...filteredLogs].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedLogs.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize)

  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: `${order.orderNumber || order.id} - ${order.client.name}`,
    email: order.client.email,
    total: order.total,
  }))

  // Filter and sort orders for the data table in create log form
  const filteredOrders = addedOrders.filter((addedOrder) => {
    const fullOrder = orders.find((o) => o.id === addedOrder.orderId)
    if (!fullOrder) return false

    const matchesSearch =
      fullOrder.id.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      fullOrder.client.name.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      fullOrder.client.email.toLowerCase().includes(logSearchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || fullOrder.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sortedAddedOrders = [...filteredOrders].sort((a, b) => {
    if (!logSortConfig) return 0

    const aOrder = orders.find((o) => o.id === a.orderId)
    const bOrder = orders.find((o) => o.id === b.orderId)

    if (!aOrder || !bOrder) return 0

    let aValue: any
    let bValue: any

    switch (logSortConfig.key) {
      case "id":
        aValue = aOrder.id
        bValue = bOrder.id
        break
      case "client":
        aValue = aOrder.client.name
        bValue = bOrder.client.name
        break
      case "total":
        aValue = aOrder.total
        bValue = bOrder.total
        break
      case "status":
        aValue = aOrder.status
        bValue = bOrder.status
        break
      case "addedAt":
        aValue = a.addedAt
        bValue = b.addedAt
        break
      default:
        return 0
    }

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    if (aValue < bValue) return logSortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return logSortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const logTotalPages = Math.ceil(sortedAddedOrders.length / logPageSize)
  const logStartIndex = (logCurrentPage - 1) * logPageSize
  const logPaginatedOrders = sortedAddedOrders.slice(logStartIndex, logStartIndex + logPageSize)

  // Get unique statuses for filter
  const statuses = [...new Set(orders.map((order) => order.status))]

  const addOrderToCurrentLog = () => {
    if (newOrderData.orderId) {
      const order = orders.find((o) => o.id === newOrderData.orderId)
      if (order) {
        // Ensure orderId is a string
        const orderIdString = String(newOrderData.orderId);
        
        const newAddedOrder = {
          id: Date.now().toString(),
          orderId: orderIdString, // Use the string version
          clientName: order.client.name,
          orderTotal: order.total,
          addedAt: new Date(),
          notes: newOrderData.notes,
          isOriginal: false, // Mark as new order
        }
        setAddedOrders([...addedOrders, newAddedOrder])
        setNewOrderData({ orderId: "", notes: "" })
        toast({
          title: "Order added successfully",
          description: "You can continue adding more orders.",
          duration: 3000,
        })
      }
    }
  }

  const removeOrderFromLog = (orderId: string) => {
    setAddedOrders(addedOrders.filter((o) => o.id !== orderId))
  }

  const handleCreateOrder = async (orderData: any) => {
    const newOrderId = await addOrder(orderData)
    
    // Ensure the newOrderId is a string
    const orderIdString = String(newOrderId || `ORD-${Date.now()}`);

    // Add the new order directly to the added orders list
    const newAddedOrder = {
      id: Date.now().toString(),
      orderId: orderIdString, // Use the string version
      clientName: orderData.client.name,
      orderTotal: orderData.total,
      addedAt: new Date(),
      notes: "",
      isOriginal: false, // Mark as new order
    }
    setAddedOrders([...addedOrders, newAddedOrder])

    toast({
      title: "Order created and added successfully",
      description: "The new order has been added to your system and to this log.",
      duration: 3000,
    })
  }

  const submitDailyLog = async () => {
    if (addedOrders.length === 0) {
      toast({
        title: "No orders added",
        description: "Please add at least one order before submitting.",
        duration: 3000,
      })
      return
    }

    // Show loading toast
    toast({
      title: "Processing orders...",
      description: `Adding ${addedOrders.length} orders to the daily log.`,
      duration: 5000,
    })

    setIsSubmitting(true)
    const today = new Date()
    let newLogId: string

    try {
      if (isUpdatingLog && logToUpdate) {
        newLogId = logToUpdate.id
        // Only add orders that weren't already in the original log
        const originalOrderIds = (logToUpdate.orders || []).map((o: any) => o.orderId)
        const newOrders = addedOrders.filter((order) => !originalOrderIds.includes(order.orderId))

        if (newOrders.length > 0) {
          console.log(`Adding ${newOrders.length} new orders to existing log ${newLogId}`)
          
          // Extract order IDs and notes for batch processing
          const orderIds = newOrders.map(order => String(order.orderId))
          const orderNotes = newOrders.map(order => order.notes || '')
          
          // Use the batch function if available
          if (addMultipleOrdersToLog) {
            console.log('Using batch order addition')
            await addMultipleOrdersToLog(newLogId, orderIds, orderNotes)
          } else {
            console.log('Batch function not available, adding orders one by one')
            // Add orders one by one with a significant delay between them
            for (let i = 0; i < newOrders.length; i++) {
              const order = newOrders[i]
              // Ensure orderId is a string when passed to addOrderToLog
              const orderIdString = String(order.orderId);
              
              console.log(`Adding order ${i+1} of ${newOrders.length}: ${orderIdString}`)
              
              try {
                // Add a larger delay between API calls to prevent race conditions
                if (i > 0) {
                  console.log(`Waiting 800ms before adding next order...`)
                  await new Promise(r => setTimeout(r, 800));
                }
                
                await addOrderToLog(newLogId, orderIdString, order.notes)
                console.log(`Successfully added order ${i+1} to log`)
              } catch (err) {
                console.error(`Failed to add order ${i+1} to log:`, err)
                toast({
                  title: `Error adding order ${i+1}`,
                  description: "There was an issue adding this order. Please try again.",
                  duration: 5000,
                })
                // Continue with next order even if this one failed
              }
            }
          }
        } else {
          console.log('No new orders to add to existing log')
        }
      } else {
        // Get the first order ID to use when creating the log
        const firstOrder = addedOrders[0]
        if (!firstOrder || !firstOrder.orderId) {
          toast({
            title: "Invalid order data",
            description: "Could not create log with the selected orders. Please try again.",
            duration: 3000,
          })
          return
        }
        
        // Ensure firstOrder.orderId is a string when passed to createOrderDailyLog
        const firstOrderIdString = String(firstOrder.orderId);
        
        console.log(`Creating new order log with first order ID: ${firstOrderIdString}`)
        
        // Pass the first order ID when creating the log
        newLogId = await createOrderDailyLog(today, firstOrderIdString)
        
        // Only add additional orders if there are more than one
        if (addedOrders.length > 1) {
          console.log(`New log created with ID: ${newLogId}. Adding ${addedOrders.length - 1} additional orders...`)
          
          // Extract order IDs and notes for batch processing (skip the first order which was already added)
          const orderIds = addedOrders.slice(1).map(order => String(order.orderId))
          const orderNotes = addedOrders.slice(1).map(order => order.notes || '')
          
          // Use the batch function if available
          if (addMultipleOrdersToLog) {
            console.log('Using batch order addition for remaining orders')
            await addMultipleOrdersToLog(newLogId, orderIds, orderNotes)
          } else {
            console.log('Batch function not available, adding orders one by one')
            // Add orders one by one with a delay between them to prevent race conditions
            for (let i = 1; i < addedOrders.length; i++) {
              const order = addedOrders[i];
              // Ensure orderId is a string when passed to addOrderToLog
              const orderIdString = String(order.orderId);
              
              console.log(`Adding order ${i} of ${addedOrders.length - 1}: ${orderIdString}`);
              
              try {
                // Add a larger delay between API calls to prevent race conditions
                console.log(`Waiting 800ms before adding next order...`)
                await new Promise(r => setTimeout(r, 800));
                
                await addOrderToLog(newLogId, orderIdString, order.notes);
                console.log(`Successfully added order ${i} to log`);
              } catch (err) {
                console.error(`Failed to add order ${i} to log:`, err);
                toast({
                  title: `Error adding order ${i}`,
                  description: "There was an issue adding this order. Please try again.",
                  duration: 5000,
                })
                // Continue with next order even if this one failed
              }
            }
          }
        } else {
          console.log('Only one order in log, no additional orders to add')
        }
      }

      setAddedOrders([])
      setShowCreateLogForm(false)
      setIsUpdatingLog(false)
      setLogToUpdate(null)
      toast({
        title: isUpdatingLog ? "Daily log updated successfully" : "Daily log created successfully",
        description: `${isUpdatingLog ? "Updated" : "Added"} ${addedOrders.length} orders to ${isUpdatingLog ? "the" : "today's"} log.`,
        duration: 3000,
      })
      
      // Close the form dialog without refreshing the page
      setShowCreateLogForm(false);
      
      // Refresh the logs data without refreshing the page
      try {
        if (getOrderLogById && newLogId) {
          console.log(`Fetching fresh log data for newly created log ID: ${newLogId}`);
          
          // Show a loading state while we fetch data
          toast({
            title: "Refreshing data...",
            description: "Getting the latest order log data.",
            duration: 2000,
          });
          
          // Get the fresh log data
          const freshLog = await getOrderLogById(newLogId);
          
          if (freshLog) {
            console.log("Retrieved fresh log data:", freshLog);
            console.log("Orders in fresh log:", freshLog.orders);
            
            // If updating, replace the log in the list
            if (isUpdatingLog) {
              const updatedLogs = [...orderLogs];
              const indexToUpdate = updatedLogs.findIndex(log => log.id === newLogId);
              if (indexToUpdate !== -1) {
                updatedLogs[indexToUpdate] = freshLog;
                setOrderLogs(updatedLogs);
              } else {
                // If not found, add it to the beginning
                setOrderLogs([freshLog, ...orderLogs]);
              }
            } 
            // If creating, add the new log to the list
            else {
              setOrderLogs([freshLog, ...orderLogs]);
            }
          } else {
            console.error("Failed to get fresh log data");
            
            // If refreshOrderLogs is available, try a full refresh
            if (refreshOrderLogs) {
              const allFreshLogs = await refreshOrderLogs();
              if (allFreshLogs && allFreshLogs.length > 0) {
                console.log("Refreshed all logs after failure to get single log");
              }
            }
          }
        } else if (refreshOrderLogs) {
          // If getOrderLogById is not available, try using refreshOrderLogs
          console.log("getOrderLogById not available, using refreshOrderLogs");
          await refreshOrderLogs();
        }
      } catch (err) {
        console.error("Error refreshing log data:", err);
        
        // Try to do a full refresh as fallback
        if (refreshOrderLogs) {
          try {
            await refreshOrderLogs();
          } catch (refreshErr) {
            console.error("Full refresh also failed:", refreshErr);
          }
        }
      }
    } catch (err) {
      console.error("Error submitting daily log:", err);
      toast({
        title: "Submission failed",
        description: "An error occurred while submitting the daily log. Please try again later.",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (log: any) => {
    // Show loading state
    setSelectedLog({ ...log, loading: true })
    setShowDetailsModal(true)
    
    // Fetch fresh data from the API if getOrderLogById is available
    if (getOrderLogById) {
      console.log("Fetching fresh log data for details view:", log.id)
      getOrderLogById(log.id)
        .then((freshLog) => {
          if (freshLog) {
            console.log("Retrieved fresh log data:", freshLog)
            setSelectedLog(freshLog)
          } else {
            console.error("Failed to get fresh log data, using local state")
            setSelectedLog(log) // Fallback to local state
          }
        })
        .catch((err) => {
          console.error("Error fetching fresh log data:", err)
          setSelectedLog(log) // Fallback to local state
        })
    } else {
      console.warn("getOrderLogById function not available")
    }
  }

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />
  }

  const getStatusColor = (isClosed: boolean) => {
    return isClosed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleUpdateLog = (log: any) => {
    setLogToUpdate(log)
    setIsUpdatingLog(true)
    setShowCreateLogForm(true)

    // Load existing orders from the log into the addedOrders state
    const existingOrders = (log.orders || [])
      .map((logOrder: any) => {
        const fullOrder = orders.find((o) => o.id === logOrder.orderId)
        if (fullOrder) {
          return {
            id: logOrder.id || Date.now().toString() + Math.random(), // Use existing ID or generate new one
            orderId: fullOrder.id,
            clientName: fullOrder.client.name,
            orderTotal: fullOrder.total,
            addedAt: logOrder.addedAt || new Date(),
            notes: logOrder.notes || "",
            isOriginal: true, // Mark as original order
          }
        }
        return null
      })
      .filter(Boolean)

    setAddedOrders(existingOrders)
  }

  const handleCancelUpdate = () => {
    setIsUpdatingLog(false)
    setLogToUpdate(null)
    setAddedOrders([])
    setShowCreateLogForm(false)
  }

  // Add a manual refresh function that users can trigger
  const handleRefreshLogs = async () => {
    if (!refreshOrderLogs) {
      console.error("refreshOrderLogs function is not available");
      toast({
        title: "Refresh failed",
        description: "Unable to refresh logs due to missing functionality."
      });
      return;
    }

    try {
      setIsRefreshing(true);
      const freshLogs = await refreshOrderLogs();
      if (freshLogs && freshLogs.length > 0) {
        setOrderLogs(freshLogs);
        toast({
          title: "Refresh successful",
          description: `Successfully refreshed ${freshLogs.length} logs.`
        });
      } else {
        toast({
          title: "No logs found",
          description: "No logs were returned from the server."
        });
      }
    } catch (err) {
      console.error("Error refreshing logs:", err);
      toast({
        title: "Refresh failed",
        description: "An error occurred while refreshing logs. See console for details."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle closing a log
  const handleCloseLog = async (logId: string) => {
    try {
      // Show loading toast
      toast({
        title: "Closing log...",
        description: "Please wait while we close the log.",
        duration: 3000,
      });
      
      // Close the log
      const closedLog = await closeOrderDailyLog(logId);
      
      // Update the log in the UI immediately
      const updatedLogs = orderLogs.map(log => 
        log.id === logId ? { ...log, isClosed: true, closedAt: new Date() } : log
      );
      setOrderLogs(updatedLogs);
      
      // Show success message
      toast({
        title: "Success",
        description: "Log closed successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error closing log:", error);
      toast({
        title: "Error",
        description: "Failed to close log",
        duration: 5000,
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Order Daily Logs</h1>
        <p className="text-gray-600">Track daily order processing and sales activities</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Logs</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshLogs} 
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
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
                        ? `Update Order Daily Log - ${logToUpdate?.date.toLocaleDateString()}`
                        : `Create Order Daily Log - ${new Date().toLocaleDateString()}`}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Add Order Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Order to Log</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Select Existing Order</h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Select Order</Label>
                                <SearchableSelect
                                  value={newOrderData.orderId}
                                  onValueChange={(value) => setNewOrderData({ ...newOrderData, orderId: value })}
                                  options={orderOptions}
                                  placeholder="Select order"
                                  searchPlaceholder="Search orders..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="notes" {...({} as any)}>Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add any notes about this order..."
                                  value={newOrderData.notes}
                                  onChange={(e) => setNewOrderData({ ...newOrderData, notes: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <Button onClick={addOrderToCurrentLog} disabled={!newOrderData.orderId} className="w-full">
                                Add Order to Log
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Create New Order</h3>
                            <OrderForm
                              onSubmit={handleCreateOrder}
                              trigger={
                                <Button className="w-full">
                                  <Package className="mr-2 h-4 w-4" />
                                  Create New Order
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Added Orders Data Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Added Orders ({addedOrders.length})</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex items-center space-x-2 flex-1">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search orders..."
                              value={logSearchTerm}
                              onChange={(e) => setLogSearchTerm(e.target.value)}
                              className="max-w-sm"
                            />
                          </div>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]" {...({} as any)}>
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent {...({} as any)}>
                              <SelectItem value="all" {...({} as any)}>All Statuses</SelectItem>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status} {...({} as any)}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {addedOrders.length > 0 ? (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <SortableTableHeader sortKey="id" currentSort={logSortConfig} onSort={handleLogSort}>
                                      Order Number
                                    </SortableTableHeader>
                                    <SortableTableHeader
                                      sortKey="client"
                                      currentSort={logSortConfig}
                                      onSort={handleLogSort}
                                    >
                                      Client
                                    </SortableTableHeader>
                                    <TableHead>Items</TableHead>
                                    <SortableTableHeader
                                      sortKey="total"
                                      currentSort={logSortConfig}
                                      onSort={handleLogSort}
                                    >
                                      Total
                                    </SortableTableHeader>
                                    <SortableTableHeader
                                      sortKey="status"
                                      currentSort={logSortConfig}
                                      onSort={handleLogSort}
                                    >
                                      Status
                                    </SortableTableHeader>
                                    <TableHead>Expected Delivery</TableHead>
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
                                  {logPaginatedOrders.map((addedOrder) => {
                                    const fullOrder = orders.find((o) => o.id === addedOrder.orderId)
                                    if (!fullOrder) return null

                                    return (
                                      <TableRow key={addedOrder.id}>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center space-x-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span>{fullOrder.orderNumber || fullOrder.id}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                              <div className="font-medium">{fullOrder.client.name}</div>
                                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                <span>{fullOrder.client.email}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>{fullOrder.items.length} items</TableCell>
                                        <TableCell>
                                          <div className="flex items-center space-x-1">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="font-semibold text-green-600">
                                              {fullOrder.total ? fullOrder.total.toLocaleString() : '0'} DZD
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge className={getOrderStatusColor(fullOrder.status)}>
                                            {fullOrder.status ? (fullOrder.status.charAt(0).toUpperCase() + fullOrder.status.slice(1)) : 'Unknown'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center space-x-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                              {fullOrder.expectedDelivery ? fullOrder.expectedDelivery.toLocaleDateString() : 'No date'}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center space-x-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{addedOrder.addedAt ? addedOrder.addedAt.toLocaleTimeString() : 'No time'}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-sm">{addedOrder.notes || "No notes"}</span>
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeOrderFromLog(addedOrder.id)}
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
                              totalItems={sortedAddedOrders.length}
                              onPageChange={setLogCurrentPage}
                              onPageSizeChange={(size) => {
                                setLogPageSize(size)
                                setLogCurrentPage(1)
                              }}
                            />
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>No orders added to this log yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={isUpdatingLog ? handleCancelUpdate : () => setShowCreateLogForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={submitDailyLog} disabled={addedOrders.length === 0}>
                        <Send className="mr-2 h-4 w-4" />
                        {isUpdatingLog ? "Update Daily Log" : "Submit Daily Log"} ({addedOrders.length} orders)
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader sortKey="date" currentSort={sortConfig} onSort={handleSort}>
                  Date
                </SortableTableHeader>
                <SortableTableHeader sortKey="totalOrders" currentSort={sortConfig} onSort={handleSort}>
                  Total Orders
                </SortableTableHeader>
                <SortableTableHeader sortKey="totalValue" currentSort={sortConfig} onSort={handleSort}>
                  Total Value
                </SortableTableHeader>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{log.date ? log.date.toLocaleDateString() : 'No date'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{log.totalOrders}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {log.totalValue ? log.totalValue.toLocaleString() : '0'} DZD
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.isClosed)}
                      <Badge className={getStatusColor(log.isClosed)}>{log.isClosed ? "Closed" : "Open"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{log.createdBy || 'System'}</TableCell>
                  <TableCell>{log.closedAt ? log.closedAt.toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!log.isClosed ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleUpdateLog(log)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCloseLog(log.id)}>
                            <Lock className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
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

      <OrderDailyLogDetailsModal log={selectedLog} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
    </div>
  )
}
