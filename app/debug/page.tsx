"use client"

import { useCRM } from "@/contexts/crm-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const { data, loading, error } = useCRM()

  if (loading) {
    return <div>Loading data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Data Debug Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({data.invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded overflow-auto" style={{ maxHeight: '400px' }}>
            <pre>{JSON.stringify(data.invoices, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Providers ({data.providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded overflow-auto" style={{ maxHeight: '400px' }}>
            <pre>{JSON.stringify(data.providers, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Products ({data.products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded overflow-auto" style={{ maxHeight: '400px' }}>
            <pre>{JSON.stringify(data.products.slice(0, 3), null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 