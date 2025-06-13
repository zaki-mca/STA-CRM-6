"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type {
  CRMData,
  CRMContextType,
  Provider,
  Client,
  Product,
  Category,
  Brand,
  Invoice,
  ProfessionalDomain,
  Order,
} from "@/lib/types"

// Import API clients
import { 
  clientApi, 
  providerApi, 
  productApi, 
  categoryApi, 
  brandApi, 
  professionalDomainApi, 
  invoiceApi,
  ApiError
} from "@/lib/api"
import { toast } from "@/lib/toast"

const CRMContext = createContext<CRMContextType | undefined>(undefined)

// Initial empty data structure
const emptyData: CRMData = {
  providers: [],
  clients: [],
  categories: [],
  brands: [],
  professionalDomains: [],
  products: [],
  invoices: [],
  orders: [],
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CRMData>(emptyData)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<{
    status: number;
    message: string;
    timestamp: number;
  } | null>(null)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Common error handling function
  const handleApiError = (err: any, source: string = "API operation") => {
    console.error(`Error in ${source}:`, err);
    
    let errorMessage = "";
    
    if (err instanceof ApiError) {
      // Parse foreign key constraint errors
      if (err.message && err.message.includes("still referenced from table")) {
        const tableMatch = err.message.match(/referenced from table "([^"]+)"/);
        if (tableMatch && tableMatch[1]) {
          const referencingTable = tableMatch[1];
          errorMessage = `Cannot delete this item because it is referenced by ${referencingTable}. Please delete the associated ${referencingTable} first.`;
        } else {
          errorMessage = `Cannot delete this item because it is referenced by other records in the system.`;
        }
      } else {
        errorMessage = `${err.message}`;
      }
      
      setError(errorMessage);
      setErrorDetails({
        status: err.status,
        message: err.message,
        timestamp: Date.now()
      });
    } else {
      setError(err.message || `Failed in ${source}`);
      setErrorDetails({
        status: 0,
        message: err.message || "Unknown error",
        timestamp: Date.now()
      });
    }
  };

  // Safe data fetching with retries
  async function safeGetData<T>(
    fetchFn: () => Promise<T>,
    entityName: string,
    maxRetries: number = 2
  ): Promise<T> {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // Special handling for invoices that seem problematic
        if (entityName === 'invoices' && retries > 0) {
          console.log(`Attempting alternative approach for invoices (retry ${retries}/${maxRetries})`)
          
          // If we're retrying invoices, try the fallback simplified approach
          // This just gets basic invoice data without detailed relationships
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices?simplified=true`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch simplified invoices: ${response.status} ${response.statusText}`)
          }
          
          const result = await response.json()
          return result.data as T
        }
        
        // Regular fetch attempt
        return await fetchFn()
      } catch (err) {
        retries++
        console.error(`Error fetching ${entityName} (attempt ${retries}/${maxRetries + 1}):`, err)
        
        if (retries <= maxRetries) {
          // Exponential backoff
          const delay = 1000 * Math.pow(2, retries - 1)
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // All retries failed
          console.error(`Failed to fetch ${entityName} after ${maxRetries + 1} attempts`)
          throw err
        }
      }
    }
    
    // This should never be reached due to the throw in the catch block
    throw new Error(`Failed to fetch ${entityName} after ${maxRetries + 1} attempts`)
  }

  // Function to fetch all data
  const fetchAllData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    setErrorDetails(null)
    
    try {
      // Fetch all data in parallel
      const results = await Promise.allSettled([
        clientApi.getAll(),
        providerApi.getAll(),
        categoryApi.getAll(),
        brandApi.getAll(),
        professionalDomainApi.getAll(),
        productApi.getAll(),
        invoiceApi.getAll(),
      ]);
      
      // Process results and handle any failed requests
      const [clientsResult, providersResult, categoriesResult, brandsResult, domainsResult, productsResult, invoicesResult] = results;
      
      // Helper function to safely extract data or return empty array
      const safeGetData = (result: PromiseSettledResult<any>): any[] => {
        if (result.status === 'fulfilled') {
          return result.value?.data || [];
        } else {
          const reason = result.reason;
          // Log the error
          console.error(`Error fetching data:`, reason);
          
          // Check if it's an API error with status and message
          if (reason instanceof ApiError) {
            // Store the error details for the UI
            setErrorDetails({
              status: reason.status,
              message: reason.message,
              timestamp: Date.now()
            });
            
            // For 500 errors, display a user-friendly message
            if (reason.status >= 500) {
              setError(`Server error (${reason.status}): ${reason.message}`);
            } else {
              setError(`API error: ${reason.message}`);
            }
          } else {
            // For non-ApiError instances, still provide some information
            setError(`Error fetching data: ${reason?.message || 'Unknown error'}`);
          }
          
          // Return empty array for this specific data type
          return [];
        }
      };
      
      const clients = safeGetData(clientsResult);
      const providers = safeGetData(providersResult);
      const categories = safeGetData(categoriesResult);
      const brands = safeGetData(brandsResult);
      const domains = safeGetData(domainsResult);
      const products = safeGetData(productsResult);
      const invoices = safeGetData(invoicesResult);
      
      // Debug: Log raw invoice data from the API
      console.log("Raw invoice data from API:", invoices);
      
      try {
        // Transform client data to match the frontend structure
        const transformedClients = clients.map((client: any) => ({
          id: client.id,
          gender: client.gender || '',
          firstName: client.first_name || '',
          lastName: client.last_name || '',
          email: client.email || '',
          address: client.address || '',
          phoneNumber: client.phone || '',
          birthDate: client.birth_date ? new Date(client.birth_date) : new Date(),
          professionalDomain: client.professional_domain_name || '',
          professionalDomainCode: client.professional_domain_code || '',
          revenue: parseFloat(client.revenue) || 0,
          ccpAccount: client.ccp_account || '',
          cle: client.cle || '',
          rip: client.rip || '',
          ripCle: client.rip_cle || '',
          notes: client.notes || '',
          createdAt: new Date(client.created_at)
        }));
        
        // Transform provider data to match the frontend structure
        const transformedProviders = providers.map((provider: any) => ({
          id: provider.id,
          name: provider.name || '',
          email: provider.email || '',
          address: provider.address || '',
          phoneNumber: provider.phone || '',
          createdAt: new Date(provider.created_at)
        }));
        
        // Transform product data to match the frontend structure
        const transformedProducts = products.map((product: any) => ({
          id: product.id,
          name: product.name || '',
          description: product.description || '',
          reference: product.reference || '',
          sku: product.sku || '',
          category: {
            id: product.category_id || '',
            name: product.category_name || 'Uncategorized'
          },
          brand: {
            id: product.brand_id || '',
            name: product.brand_name || 'Unbranded'
          },
          sellPrice: parseFloat(product.sell_price) || 0,
          buyPrice: parseFloat(product.buy_price) || 0,
          quantity: parseInt(product.quantity) || 0,
          createdAt: new Date(product.created_at)
        }));
        
        // Transform invoice data to match the frontend structure
        const tempInvoices = invoices.map((invoice: any) => {
          console.log("Processing invoice:", invoice.id, "Provider ID:", invoice.provider_id);
          
          // Check if invoice is valid before processing
          if (!invoice || typeof invoice !== 'object') {
            console.error("Invalid invoice data:", invoice);
            return null;
          }
          
          try {
            return {
              id: invoice.id || '',
              invoice_number: invoice.invoice_number || `INV-${(invoice.id || '').substring(0, 8)}`,
              provider_id: invoice.provider_id || '',
              provider_name: invoice.provider_name || 'Unknown Provider',
              provider_email: invoice.provider_email || '',
              provider_phone: invoice.provider_phone || '',
              provider_address: invoice.provider_address || '',
              items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
                id: item?.id || '',
                product_id: item?.product_id || '',
                product_name: item?.product_name || 'Unknown Product',
                product_description: item?.product_description || '',
                quantity: parseInt(item?.quantity) || 0,
                unit_price: parseFloat(item?.unit_price) || 0,
                discount: parseFloat(item?.discount) || 0,
                total: parseFloat(item?.total) || 
                        (parseInt(item?.quantity || 0) * (parseFloat(item?.unit_price || 0) || 0)),
                sku: item?.sku || '',
                reference: item?.reference || '',
                category_id: item?.category_id || '',
                category_name: item?.category_name || 'Uncategorized',
                brand_id: item?.brand_id || '',
                brand_name: item?.brand_name || 'Unbranded'
              })) : [],
              subtotal: parseFloat(invoice.subtotal) || 0,
              total: parseFloat(invoice.total) || 0,
              tax_rate: parseFloat(invoice.tax_rate) || 0,
              status: invoice.status || 'draft',
              date: invoice.date || new Date().toISOString().split('T')[0],
              due_date: invoice.due_date || '',
              notes: invoice.notes || '',
              created_at: invoice.created_at || new Date().toISOString(),
              updated_at: invoice.updated_at || new Date().toISOString()
            } as Invoice;
          } catch (err) {
            console.error("Error transforming invoice:", invoice.id, err);
            return null;
          }
        });
        
        // Filter out null values and cast to Invoice[]
        const transformedInvoices: Invoice[] = tempInvoices.filter(Boolean) as Invoice[];
        
        console.log("Transformed invoices count:", transformedInvoices.length);
        
        // Transform professional domain data to include payment code
        const transformedDomains = domains.map((domain: any) => ({
          id: domain.id,
          name: domain.name || '',
          description: domain.description || '',
          paymentCode: domain.payment_code || '',
        }));

        setData({
          clients: transformedClients,
          providers: transformedProviders,
          categories: categories || [],
          brands: brands || [],
          professionalDomains: transformedDomains,
          products: transformedProducts,
          invoices: transformedInvoices,
          orders: [],
        })
      } catch (transformError) {
        console.error("Error transforming data:", transformError);
        // If transformation fails, set empty data
        setData(emptyData);
        setError("Error processing data: " + (transformError as Error).message);
      }
      
      setLastFetchTime(Date.now())
    } catch (err: any) {
      console.error("Failed to fetch CRM data:", err)
      handleApiError(err, "fetching CRM data");
      
      // Even if there's an error, set empty data rather than leaving undefined
      setData({
        clients: [],
        providers: [],
        categories: [],
        brands: [],
        professionalDomains: [],
        products: [],
        invoices: [],
        orders: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAllData()
  }, [])
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network is back online. Refreshing data...")
      setNetworkStatus('online')
      fetchAllData()
    }
    
    const handleOffline = () => {
      console.log("Network is offline")
      setNetworkStatus('offline')
    }
    
    // Handle page visibility changes (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log("Page is now visible. Checking if data refresh is needed...")
        }
        
        // If it's been more than 5 minutes since the last fetch, refresh the data
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000
        if (now - lastFetchTime > fiveMinutes) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Data is stale. Refreshing...")
          }
          fetchAllData()
        }
      }
    }
    
    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set initial network status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline')
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [lastFetchTime])
  
  // Function to manually refresh data
  const refreshData = () => {
    console.log("Manually refreshing data...")
    return fetchAllData()
  }

  const addProvider = async (providerData: Omit<Provider, "id" | "createdAt">) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbProviderData = {
        name: providerData.name,
        email: providerData.email,
        address: providerData.address,
        phone: providerData.phoneNumber, // Map phoneNumber to phone field in DB
        status: 'active' // Set default status
      };
      
      const response = await providerApi.create(dbProviderData);
      
      // Transform the response back to match frontend structure
      const newProvider = {
        ...response.data,
        phoneNumber: response.data.phone, // Map phone back to phoneNumber
        createdAt: new Date(response.data.created_at) // Convert string to Date object
      };
      
      setData((prev) => ({ ...prev, providers: [...prev.providers, newProvider] }));
      
      // Show success message
      toast.success(`${providerData.name} has been added to your providers.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newProvider;
    } catch (err: any) {
      handleApiError(err, "adding provider");
      throw err;
    }
  }

  const updateProvider = async (id: string, providerData: Partial<Provider>) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbProviderData = {
        name: providerData.name || '',
        email: providerData.email || '',
        address: providerData.address || '',
        phone: providerData.phoneNumber || '', // Map phoneNumber to phone field in DB
      };
      
      const response = await providerApi.update(id, dbProviderData);
      
      // Transform the response back to match frontend structure
      const updatedProvider = {
        ...response.data,
        phoneNumber: response.data.phone, // Map phone back to phoneNumber
        createdAt: new Date(response.data.created_at) // Convert string to Date object
      };
      
      setData((prev) => ({
        ...prev,
        providers: prev.providers.map((provider) => 
          provider.id === id ? updatedProvider : provider
        ),
      }));
      
      return updatedProvider;
    } catch (err: any) {
      handleApiError(err, "updating provider");
      throw err;
    }
  }

  const deleteProvider = async (id: string) => {
    try {
      const providerToDelete = data.providers.find(provider => provider.id === id);
      await providerApi.delete(id)
      setData((prev) => ({
        ...prev,
        providers: prev.providers.filter((provider) => provider.id !== id),
      }))
      
      // Show success message
      toast.success(`${providerToDelete?.name || 'Provider'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting provider");
      throw err
    }
  }

  const addClient = async (clientData: Omit<Client, "id" | "createdAt">) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbClientData = {
        // Use individual fields directly instead of combining
        gender: clientData.gender,
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        email: clientData.email,
        phone: clientData.phoneNumber,
        address: clientData.address,
        // Use professional_domain_id instead of professional_domain
        professional_domain_id: clientData.professionalDomain ? 
          // Try to find the domain ID by name
          data.professionalDomains.find(d => d.name === clientData.professionalDomain)?.id : null,
        // Add birth_date field
        birth_date: clientData.birthDate,
        // Add ccp_account field
        ccp_account: clientData.ccpAccount,
        // Add cle field
        cle: clientData.cle,
        // Add rip field
        rip: clientData.rip,
        // Add rip_cle field
        rip_cle: clientData.ripCle,
        // Add revenue field
        revenue: clientData.revenue || 0,
        // Add company field (can be empty)
        company: '',
        // Add status with default value
        status: 'active',
        // Keep notes field (optional)
        notes: clientData.notes || ''
      };
      
      const response = await clientApi.create(dbClientData)
      
      // Transform the response back to match frontend structure
      const newClient = {
        ...response.data,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        gender: response.data.gender,
        phoneNumber: response.data.phone,
        professionalDomain: response.data.professional_domain_name || '',
        birthDate: response.data.birth_date ? new Date(response.data.birth_date) : null,
        ccpAccount: response.data.ccp_account || '',
        cle: response.data.cle || '',
        rip: response.data.rip || '',
        ripCle: response.data.rip_cle || '',
        revenue: response.data.revenue || 0,
        createdAt: new Date(response.data.created_at)
      }
      
      setData((prev) => ({ ...prev, clients: [...prev.clients, newClient] }))
      
      // Show success message
      toast.success(`${clientData.firstName} ${clientData.lastName} has been added to your clients.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newClient
    } catch (err: any) {
      handleApiError(err, "adding client");
      throw err;
    }
  }

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbClientData = {
        // Use individual fields directly instead of combining
        gender: clientData.gender || '',
        first_name: clientData.firstName || '',
        last_name: clientData.lastName || '',
        email: clientData.email || '',
        phone: clientData.phoneNumber || '',
        address: clientData.address || '',
        // Use professional_domain_id instead of professional_domain
        professional_domain_id: clientData.professionalDomain ? 
          // Try to find the domain ID by name
          data.professionalDomains.find(d => d.name === clientData.professionalDomain)?.id : null,
        // Add birth_date field
        birth_date: clientData.birthDate,
        // Add ccp_account field
        ccp_account: clientData.ccpAccount || '',
        // Add cle field
        cle: clientData.cle || '',
        // Add rip field
        rip: clientData.rip || '',
        // Add rip_cle field
        rip_cle: clientData.ripCle || '',
        // Add revenue field
        revenue: clientData.revenue || 0,
        // Keep notes field (optional)
        notes: clientData.notes || ''
      };
      
      const response = await clientApi.update(id, dbClientData)
      
      // Transform the response back to match frontend structure
      const updatedClient = {
        ...response.data,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        gender: response.data.gender,
        phoneNumber: response.data.phone,
        professionalDomain: response.data.professional_domain_name || '',
        birthDate: response.data.birth_date ? new Date(response.data.birth_date) : null,
        ccpAccount: response.data.ccp_account || '',
        cle: response.data.cle || '',
        rip: response.data.rip || '',
        ripCle: response.data.rip_cle || '',
        revenue: response.data.revenue || 0,
        createdAt: new Date(response.data.created_at)
      };
      
      setData((prev) => ({
        ...prev,
        clients: prev.clients.map((client) => 
          client.id === id ? updatedClient : client
        ),
      }))
      return updatedClient
    } catch (err: any) {
      handleApiError(err, "updating client");
      throw err;
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const clientToDelete = data.clients.find(client => client.id === id);
      await clientApi.delete(id)
      setData((prev) => ({
        ...prev,
        clients: prev.clients.filter((client) => client.id !== id),
      }))
      
      // Show success message
      toast.success(`${clientToDelete ? `${clientToDelete.firstName} ${clientToDelete.lastName}` : 'Client'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting client");
      throw err;
    }
  }

  const addProduct = async (productData: any) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbProductData = {
        name: productData.name,
        description: productData.description || '',
        sell_price: productData.sellPrice,
        buy_price: productData.buyPrice,
        quantity: productData.quantity,
        category_id: productData.categoryId,
        brand_id: productData.brandId,
        reference: productData.reference || '',
        sku: productData.sku || '',
        image_url: productData.imageUrl || '',
      };
      
      const response = await productApi.create(dbProductData)
      
      // Transform the response back to match frontend structure
      const newProduct = {
        ...response.data,
        sellPrice: Number(response.data.sell_price || 0),
        buyPrice: Number(response.data.buy_price || 0),
        categoryId: response.data.category_id,
        brandId: response.data.brand_id,
        categoryName: response.data.category_name,
        brandName: response.data.brand_name,
        imageUrl: response.data.image_url,
        createdAt: new Date(response.data.created_at)
      }
      
      setData((prev) => ({ ...prev, products: [...prev.products, newProduct] }))
      
      // Show success message
      toast.success(`${productData.name} has been added to your products.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newProduct
    } catch (err: any) {
      handleApiError(err, "adding product");
      throw err;
    }
  }

  const updateProduct = async (id: string, productData: any) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbProductData = {
        name: productData.name,
        description: productData.description || '',
        sell_price: productData.sellPrice,
        buy_price: productData.buyPrice,
        quantity: productData.quantity,
        category_id: productData.categoryId,
        brand_id: productData.brandId,
        reference: productData.reference || '',
        sku: productData.sku || '',
        image_url: productData.imageUrl || '',
      };
      
      const response = await productApi.update(id, dbProductData)
      
      // Transform the response back to match frontend structure
      const updatedProduct = {
        ...response.data,
        sellPrice: Number(response.data.sell_price || 0),
        buyPrice: Number(response.data.buy_price || 0),
        categoryId: response.data.category_id,
        brandId: response.data.brand_id,
        categoryName: response.data.category_name,
        brandName: response.data.brand_name,
        imageUrl: response.data.image_url,
        createdAt: new Date(response.data.created_at)
      }
      
      setData((prev) => ({
        ...prev,
        products: prev.products.map((product) => 
          product.id === id ? updatedProduct : product
        ),
      }))
      return updatedProduct
    } catch (err: any) {
      handleApiError(err, "updating product");
      throw err;
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const productToDelete = data.products.find(product => product.id === id);
      await productApi.delete(id)
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((product) => product.id !== id),
      }))
      
      // Show success message
      toast.success(`${productToDelete?.name || 'Product'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting product");
      throw err;
    }
  }

  const addCategory = async (name: string) => {
    try {
      const response = await categoryApi.create({ name })
      const newCategory = response.data
      setData((prev) => ({ ...prev, categories: [...prev.categories, newCategory] }))
      
      // Show success message
      toast.success(`${name} has been added to your categories.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newCategory
    } catch (err: any) {
      handleApiError(err, "adding category");
      throw err;
    }
  }

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      // Ensure description is always a string, never null
      const apiCategoryData = {
        ...categoryData,
        description: categoryData.description ?? ''
      }
      
      const response = await categoryApi.update(id, apiCategoryData)
      const updatedCategory = response.data
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((category) =>
          category.id === id ? { ...category, ...updatedCategory } : category
        ),
      }))
      return updatedCategory
    } catch (err: any) {
      handleApiError(err, "updating category");
      throw err;
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const categoryToDelete = data.categories.find(category => category.id === id);
      await categoryApi.delete(id)
      setData((prev) => ({
        ...prev,
        categories: prev.categories.filter((category) => category.id !== id),
      }))
      
      // Show success message
      toast.success(`${categoryToDelete?.name || 'Category'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting category");
      throw err;
    }
  }

  const addBrand = async (name: string) => {
    try {
      const response = await brandApi.create({ name })
      const newBrand = response.data
      setData((prev) => ({ ...prev, brands: [...prev.brands, newBrand] }))
      
      // Show success message
      toast.success(`${name} has been added to your brands.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newBrand
    } catch (err: any) {
      handleApiError(err, "adding brand");
      throw err;
    }
  }

  const updateBrand = async (id: string, brandData: Partial<Brand>) => {
    try {
      // Ensure description is always a string, never null
      const apiBrandData = {
        ...brandData,
        description: brandData.description ?? ''
      }
      
      const response = await brandApi.update(id, apiBrandData)
      const updatedBrand = response.data
      setData((prev) => ({
        ...prev,
        brands: prev.brands.map((brand) =>
          brand.id === id ? { ...brand, ...updatedBrand } : brand
        ),
      }))
      return updatedBrand
    } catch (err: any) {
      handleApiError(err, "updating brand");
      throw err;
    }
  }

  const deleteBrand = async (id: string) => {
    try {
      const brandToDelete = data.brands.find(brand => brand.id === id);
      await brandApi.delete(id)
      setData((prev) => ({
        ...prev,
        brands: prev.brands.filter((brand) => brand.id !== id),
      }))
      
      // Show success message
      toast.success(`${brandToDelete?.name || 'Brand'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting brand");
      throw err;
    }
  }

  const addProfessionalDomain = async (domainData: Omit<ProfessionalDomain, "id">) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbDomainData = {
        name: domainData.name,
        description: domainData.description || '',
        payment_code: domainData.paymentCode || '',
      };
      
      const response = await professionalDomainApi.create(dbDomainData)
      
      // Transform the response back to match frontend structure
      const newDomain = {
        ...response.data,
        paymentCode: response.data.payment_code || '',
        createdAt: new Date(response.data.created_at)
      }
      
      setData((prev) => ({ ...prev, professionalDomains: [...prev.professionalDomains, newDomain] }))
      
      // Show success message
      toast.success(`${domainData.name} has been added to your professional domains.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return newDomain
    } catch (err: any) {
      handleApiError(err, "adding professional domain");
      throw err;
    }
  }

  const updateProfessionalDomain = async (id: string, domainData: Partial<ProfessionalDomain>) => {
    try {
      // Map the frontend field names to match database schema fields
      const dbDomainData = {
        name: domainData.name || '',
        description: domainData.description || '',
        payment_code: domainData.paymentCode || '',
      };
      
      const response = await professionalDomainApi.update(id, dbDomainData)
      
      // Transform the response back to match frontend structure
      const updatedDomain = {
        ...response.data,
        paymentCode: response.data.payment_code || '',
        createdAt: new Date(response.data.created_at)
      }
      
      setData((prev) => ({
        ...prev,
        professionalDomains: prev.professionalDomains.map((domain) => 
          domain.id === id ? updatedDomain : domain
        ),
      }))
      return updatedDomain
    } catch (err: any) {
      handleApiError(err, "updating professional domain");
      throw err;
    }
  }

  const deleteProfessionalDomain = async (id: string) => {
    try {
      const domainToDelete = data.professionalDomains.find(domain => domain.id === id);
      await professionalDomainApi.delete(id)
      setData((prev) => ({
        ...prev,
        professionalDomains: prev.professionalDomains.filter((domain) => domain.id !== id),
      }))
      
      // Show success message
      toast.success(`${domainToDelete?.name || 'Professional domain'} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting professional domain");
      throw err;
    }
  }

  const addInvoice = async (invoiceData: any) => {
    try {
      // Validate required fields
      if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error('At least one invoice item is required');
      }
      if (!invoiceData.client_id && !invoiceData.provider_id) {
        throw new Error('Either client or provider must be selected');
      }

      console.log("Sending invoice data:", JSON.stringify(invoiceData, null, 2));
      const response = await invoiceApi.create(invoiceData);
      console.log("Invoice creation response:", response);
      
      // Show success message
      toast.success(`Invoice #${response.data.invoice_number || 'New'} has been created successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
      
      await refreshData();
      return response.data;
    } catch (err) {
      console.error("Detailed invoice creation error:", err);
      if (err instanceof ApiError) {
        console.error("API Error details:", err.status, err.message);
      }
      handleApiError(err, "invoice creation");
      throw err;
    }
  };

  const updateInvoice = async (id: string, invoiceData: any) => {
    try {
      // Check for provider ID or client ID in the data
      const providerId = invoiceData.provider_id || (invoiceData.provider && invoiceData.provider.id);
      const clientId = invoiceData.client_id || (invoiceData.client && invoiceData.client.id);
      
      if (!providerId && !clientId) {
        console.error('Neither Provider ID nor Client ID is present in invoice data:', invoiceData);
        throw new Error('Either Provider ID or Client ID is required for updating an invoice');
      }
      
      const entityType = providerId ? 'provider' : 'client';
      const entityId = providerId || clientId;
      
      console.log(`Updating invoice ${id} with ${entityType} ID: ${entityId}`);
      
      // Format the due date correctly
      let formattedDueDate = null;
      if (invoiceData.due_date) {
        formattedDueDate = invoiceData.due_date;
      } else if (invoiceData.dueDate) {
        if (invoiceData.dueDate instanceof Date) {
          formattedDueDate = invoiceData.dueDate.toISOString().split('T')[0];
        } else if (typeof invoiceData.dueDate === 'string') {
          // If it's already a string, ensure it's in YYYY-MM-DD format
          const dateMatch = invoiceData.dueDate.match(/^\d{4}-\d{2}-\d{2}/);
          formattedDueDate = dateMatch ? dateMatch[0] : null;
        }
      }
      
      console.log('Formatted due date:', formattedDueDate);
      
      // Transform frontend invoice data to match backend API requirements
      const backendInvoiceData = {
        // Include either provider_id or client_id, not both
        ...(providerId ? { provider_id: providerId } : { client_id: clientId }),
        date: invoiceData.date,
        due_date: formattedDueDate,
        status: invoiceData.status || 'draft',
        notes: invoiceData.notes || '',
        tax_rate: invoiceData.tax_rate || 0,
        items: invoiceData.items.map((item: any) => ({
          // Handle different ID formats properly
          id: item.id === null || item.id === undefined || 
              (typeof item.id === 'string' && (item.id.startsWith('temp-') || !item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))) 
              ? null : item.id,
          product_id: item.product_id || (item.product && item.product.id),
          quantity: item.quantity,
          // Ensure unit price is positive
          unit_price: Math.max(0.01, item.unit_price || item.unitPrice || 0),
          discount: item.discount || 0 // Default discount
        }))
      };
      
      console.log('Backend invoice update data:', JSON.stringify(backendInvoiceData, null, 2));
      
      const response = await invoiceApi.update(id, backendInvoiceData);
      const updatedInvoice = response.data;
      
      console.log('Invoice updated:', updatedInvoice);
      
      // Transform the backend response to match frontend structure
      const transformedInvoice = {
        id: updatedInvoice.id,
        invoice_number: updatedInvoice.invoice_number || `INV-${updatedInvoice.id.substring(0, 8)}`,
        provider_id: updatedInvoice.provider_id,
        provider_name: updatedInvoice.provider_name || '',
        provider_email: updatedInvoice.provider_email || '',
        provider_phone: updatedInvoice.provider_phone || '',
        provider_address: updatedInvoice.provider_address || '',
        items: Array.isArray(updatedInvoice.items) ? updatedInvoice.items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_description: item.product_description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          total: item.total,
          sku: item.sku || '',
          reference: item.reference || '',
          category_id: item.category_id || '',
          category_name: item.category_name || 'Uncategorized',
          brand_id: item.brand_id || '',
          brand_name: item.brand_name || 'Unbranded'
        })) : invoiceData.items.map((item: any) => ({
          id: item.id || `temp-${Date.now().toString()}`,
          product_id: item.product_id || (item.product && item.product.id) || '',
          product_name: item.product_name || (item.product && item.product.name) || 'Unknown Product',
          product_description: item.product_description || (item.product && item.product.description) || '',
          quantity: item.quantity,
          unit_price: item.unit_price || item.unitPrice || 0,
          discount: item.discount || 0,
          total: item.total || (item.quantity * (item.unit_price || item.unitPrice || 0) * (1 - (item.discount || 0) / 100)),
          sku: item.sku || (item.product && item.product.sku) || '',
          reference: item.reference || (item.product && item.product.reference) || '',
          category_id: item.category_id || (item.product && item.product.category && item.product.category.id) || '',
          category_name: item.category_name || (item.product && item.product.category && item.product.category.name) || 'Uncategorized',
          brand_id: item.brand_id || (item.product && item.product.brand && item.product.brand.id) || '',
          brand_name: item.brand_name || (item.product && item.product.brand && item.product.brand.name) || 'Unbranded'
        })),
        subtotal: updatedInvoice.subtotal || invoiceData.subtotal || 0,
        total: updatedInvoice.total || invoiceData.total || 0,
        tax_rate: updatedInvoice.tax_rate || invoiceData.tax_rate || 0,
        status: updatedInvoice.status || invoiceData.status || 'draft',
        date: updatedInvoice.date || invoiceData.date || '',
        due_date: updatedInvoice.due_date || invoiceData.due_date || '',
        notes: updatedInvoice.notes || invoiceData.notes || '',
        created_at: updatedInvoice.created_at || new Date().toISOString(),
        updated_at: updatedInvoice.updated_at || new Date().toISOString()
      } as Invoice;
      
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) => (inv.id === id ? transformedInvoice : inv))
      }));
      
      return transformedInvoice;
    } catch (err: any) {
      handleApiError(err, "updating invoice");
      throw err;
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const invoiceToDelete = data.invoices.find(invoice => invoice.id === id);
      await invoiceApi.delete(id)
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.filter((invoice) => invoice.id !== id),
      }))
      
      // Show success message
      toast.success(`Invoice #${invoiceToDelete?.invoice_number || id} has been deleted successfully.`, {
        position: "top-right",
        autoClose: 3000
      });
    } catch (err: any) {
      handleApiError(err, "deleting invoice");
      throw err;
    }
  }

  const updateInvoiceStatus = async (id: string, status: "draft" | "sent" | "paid" | "overdue"): Promise<Invoice> => {
    try {
      console.log(`Updating invoice ${id} status to ${status}`);
      
      const response = await invoiceApi.updateStatus(id, { status });
      const updatedInvoice = response.data;
      
      console.log('Invoice status updated:', updatedInvoice);
      
      // Find the existing invoice to preserve all the data
      const existingInvoice = data.invoices.find(invoice => invoice.id === id);
      
      if (!existingInvoice) {
        console.error(`Invoice ${id} not found in state`);
        throw new Error(`Invoice ${id} not found in state`);
      }
      
      // Transform the backend response to match frontend structure but preserve existing data
      const transformedInvoice: Invoice = {
        ...existingInvoice,
        status: status,
        // Update any fields that might have changed in the response
        provider_id: updatedInvoice.provider_id || existingInvoice.provider_id,
        provider_name: updatedInvoice.provider_name || existingInvoice.provider_name,
        provider_email: updatedInvoice.provider_email || existingInvoice.provider_email,
        provider_phone: updatedInvoice.provider_phone || existingInvoice.provider_phone,
        provider_address: updatedInvoice.provider_address || existingInvoice.provider_address,
        updated_at: new Date().toISOString()
      };
      
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((invoice) => invoice.id === id ? transformedInvoice : invoice)
      }));
      
      return transformedInvoice;
    } catch (err: any) {
      handleApiError(err, "updating invoice status");
      throw err;
    }
  }

  // Clear error message
  const clearError = () => {
    setError(null);
    setErrorDetails(null);
  };

  return (
    <CRMContext.Provider
      value={{
        data,
        loading,
        error,
        errorDetails,
        clearError,
        networkStatus,
        lastFetchTime,
        refreshData,
        addProvider,
        updateProvider,
        deleteProvider,
        addClient,
        updateClient,
        deleteClient,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addBrand,
        updateBrand,
        deleteBrand,
        addProfessionalDomain,
        updateProfessionalDomain,
        deleteProfessionalDomain,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateInvoiceStatus,
      }}
    >
      {children}
    </CRMContext.Provider>
  )
}

export function useCRM() {
  const context = useContext(CRMContext)
  if (context === undefined) {
    throw new Error("useCRM must be used within a CRMProvider")
  }
  return context
}
