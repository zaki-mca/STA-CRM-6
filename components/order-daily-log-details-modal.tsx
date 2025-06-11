"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderDailyLog } from "@/lib/daily-logs-types"
import { ShoppingCart, Calendar, Clock, CheckCircle, User, DollarSign, FileText, Package, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useDailyLogs } from "@/contexts/daily-logs-context"
import { toast } from "@/components/ui/use-toast"

interface OrderDailyLogDetailsModalProps {
  log: OrderDailyLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDailyLogDetailsModal({ log, open, onOpenChange }: OrderDailyLogDetailsModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentLog, setCurrentLog] = useState<OrderDailyLog | null>(null);
  const { getOrderLogById } = useDailyLogs();
  
  useEffect(() => {
    setCurrentLog(log);
  }, [log]);
  
  if (!currentLog) return null;

  // Debug logging to help diagnose order data issues
  console.log("Modal log data:", currentLog);
  console.log("Orders array:", currentLog.orders);
  
  // Check if log is in loading state (added by our handleViewDetails function)
  const isLoading = (currentLog as any).loading === true || isRefreshing;

  // Create type-safe component
  const TypeSafeDialogTitle = DialogTitle as any;

  // Safely get orders array with fallback
  const orders = Array.isArray(currentLog.orders) ? currentLog.orders : [];
  const ordersCount = orders.length;

  console.log("Processed orders count:", ordersCount);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (!getOrderLogById || !currentLog?.id) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh data. Missing ID or refresh function."
      });
      return;
    }
    
    try {
      setIsRefreshing(true);
      console.log(`Manually refreshing log details for ID: ${currentLog.id}`);
      
      const freshLog = await getOrderLogById(currentLog.id);
      if (freshLog) {
        console.log("Successfully refreshed log data:", freshLog);
        console.log("Refreshed orders count:", freshLog.orders?.length || 0);
        setCurrentLog(freshLog);
        
        toast({
          title: "Refresh successful",
          description: `Found ${freshLog.orders?.length || 0} orders in this log.`
        });
      } else {
        console.error("Failed to get fresh log data");
        toast({
          title: "Refresh failed",
          description: "Could not retrieve updated log data."
        });
      }
    } catch (err) {
      console.error("Error refreshing log details:", err);
      toast({
        title: "Refresh error",
        description: "An error occurred while refreshing data."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />
  }

  const getStatusColor = (isClosed: boolean) => {
    return isClosed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
  }

  // Format date safely
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Unknown date";
    try {
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid date";
    }
  }

  // Format datetime safely
  const formatDateTime = (date: Date | undefined) => {
    if (!date) return "Unknown time";
    try {
      return date.toLocaleString();
    } catch (e) {
      console.error("DateTime formatting error:", e);
      return "Invalid date/time";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Order Daily Log - {formatDate(currentLog.date)}</span>
          </TypeSafeDialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Log Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Log Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold">{formatDate(currentLog.date)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(currentLog.isClosed)}
                  <Badge className={getStatusColor(currentLog.isClosed)}>{currentLog.isClosed ? "Closed" : "Open"}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">{currentLog.totalOrders || 0}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {(currentLog.totalValue || 0).toLocaleString()} DZD
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{currentLog.createdBy || "Unknown"}</span>
                </div>
              </div>
              {currentLog.closedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Closed At</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDateTime(currentLog.closedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{currentLog.totalOrders || 0}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{(currentLog.totalValue || 0).toLocaleString()} DZD</p>
                    <p className="text-sm text-gray-500">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {currentLog.totalOrders > 0 ? ((currentLog.totalValue || 0) / currentLog.totalOrders).toLocaleString() : 0} DZD
                    </p>
                    <p className="text-sm text-gray-500">Average Order</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Orders Added ({isLoading ? '...' : ordersCount})</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isRefreshing || !getOrderLogById}
                className="ml-auto"
              >
                {isRefreshing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Orders
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex justify-center items-center space-x-2 py-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
                  </div>
                  <p>Loading order data...</p>
                </div>
              ) : ordersCount > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Order Total</TableHead>
                      <TableHead>Added At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, index) => (
                      <TableRow key={order.id || `order-${index}-${order.orderId}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{order.orderNumber || order.orderId || "Unknown ID"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{order.clientName || "Unknown Client"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {(order.orderTotal || 0).toLocaleString()} DZD
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatDateTime(order.addedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.notes ? (
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="text-sm">{order.notes}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No notes</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders added to this log yet</p>
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
                    <p className="text-xs text-muted-foreground">{formatDateTime(currentLog.date)}</p>
                  </div>
                </div>
                {orders.map((order, index) => (
                  <div key={order.id || `order-${index}-${order.orderId}`} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Order added: {order.orderNumber || order.orderId || "Unknown"} - {(order.orderTotal || 0).toLocaleString()} DZD
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.addedAt)}</p>
                    </div>
                  </div>
                ))}
                {currentLog.isClosed && currentLog.closedAt && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Log closed</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(currentLog.closedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
