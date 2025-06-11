"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductForm } from "@/components/product-form"
import { ClientForm } from "@/components/client-form"
import { ProviderForm } from "@/components/provider-form"
import { Package, Users, Truck, FileText, DollarSign, TrendingUp } from "lucide-react"
import { useCRM } from "@/contexts/crm-context"
import { Button } from "@/components/ui/button"
import { InvoiceForm } from "@/components/invoice-form"

export default function Dashboard() {
  const { data, addProduct, addClient, addProvider, addCategory, addBrand, addProfessionalDomain, addInvoice } =
    useCRM()

  // Wrapper function to convert string to the expected object format
  const handleAddProfessionalDomain = (name: string) => {
    addProfessionalDomain({ name })
  }

  const stats = {
    totalProducts: data.products.length,
    totalClients: data.clients.length,
    totalProviders: data.providers.length,
    totalInvoices: data.invoices.length,
    totalRevenue: 125430,
    lowStockItems: data.products.filter((p) => p.quantity < 10).length,
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600">Welcome to your CRM system overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.lowStockItems} items low in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders}</div>
            <p className="text-xs text-muted-foreground">Active partnerships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} DZD</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15.2%</div>
            <p className="text-xs text-muted-foreground">Year over year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New client added: Tech Solutions Inc.</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice #INV-001 sent to ABC Corp</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock alert: Laptop Batteries</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Add Product</p>
                    <p className="text-xs text-muted-foreground">Create new product</p>
                  </div>
                </div>
                <ProductForm
                  categories={data.categories}
                  brands={data.brands}
                  onSubmit={(productData) => {
                    addProduct(productData)
                  }}
                  onAddCategory={addCategory}
                  onAddBrand={addBrand}
                  trigger={<Button className="w-full">Create Product</Button>}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Add Client</p>
                    <p className="text-xs text-muted-foreground">Register new client</p>
                  </div>
                </div>
                <ClientForm
                  professionalDomains={data.professionalDomains}
                  onSubmit={(clientData) => {
                    addClient(clientData)
                  }}
                  onAddProfessionalDomain={handleAddProfessionalDomain}
                  trigger={<Button className="w-full">Create Client</Button>}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-medium">Create Invoice</p>
                    <p className="text-xs text-muted-foreground">Generate new invoice</p>
                  </div>
                </div>
                <InvoiceForm
                  providers={data.providers}
                  products={data.products}
                  categories={data.categories}
                  brands={data.brands}
                  onSubmit={(invoiceData) => {
                    addInvoice(invoiceData)
                  }}
                  onAddProvider={addProvider}
                  onAddProduct={addProduct}
                  onAddCategory={addCategory}
                  onAddBrand={addBrand}
                  trigger={<Button className="w-full">Create Invoice</Button>}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Truck className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium">Add Provider</p>
                    <p className="text-xs text-muted-foreground">Register new provider</p>
                  </div>
                </div>
                <ProviderForm
                  onSubmit={(providerData) => {
                    addProvider(providerData)
                  }}
                  trigger={<Button className="w-full">Create Provider</Button>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
