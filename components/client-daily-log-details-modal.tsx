"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClientDailyLog } from "@/lib/daily-logs-types"
import { Users, Calendar, Clock, CheckCircle, User, Mail, FileText } from "lucide-react"

interface ClientDailyLogDetailsModalProps {
  log: ClientDailyLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDailyLogDetailsModal({ log, open, onOpenChange }: ClientDailyLogDetailsModalProps) {
  if (!log) return null

  // Create type-safe component
  const TypeSafeDialogTitle = DialogTitle as any;

  // Safely get clients array with fallback
  const clients = log.clients || []
  const clientsCount = clients.length

  const getStatusIcon = (isClosed: boolean) => {
    return isClosed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />
  }

  const getStatusColor = (isClosed: boolean) => {
    return isClosed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <TypeSafeDialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Client Daily Log - {log.date.toLocaleDateString()}</span>
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
                  <span className="text-lg font-semibold">{log.date.toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(log.isClosed)}
                  <Badge className={getStatusColor(log.isClosed)}>{log.isClosed ? "Closed" : "Open"}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">{log.totalClients || 0}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{log.createdBy || "Unknown"}</span>
                </div>
              </div>
              {log.closedAt && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Closed At</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{log.closedAt.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle>Clients Added ({clientsCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {clientsCount > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Added At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{client.clientName || "Unknown Client"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{client.clientEmail || "No email"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{client.addedAt ? client.addedAt.toLocaleString() : "Unknown time"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.notes ? (
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="text-sm">{client.notes}</span>
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
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                    <p className="text-xs text-muted-foreground">{log.date.toLocaleString()}</p>
                  </div>
                </div>
                {clients.map((client, index) => (
                  <div key={client.id || index} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client added: {client.clientName || "Unknown Client"}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.addedAt ? client.addedAt.toLocaleString() : "Unknown time"}
                      </p>
                    </div>
                  </div>
                ))}
                {log.isClosed && log.closedAt && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Log closed</p>
                      <p className="text-xs text-muted-foreground">{log.closedAt.toLocaleString()}</p>
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
