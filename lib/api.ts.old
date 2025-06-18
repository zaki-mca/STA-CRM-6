// API Client for making requests to our backend API
// This handles different environments and deployment platforms

// Determine the base URL for API calls based on environment
const getBaseUrl = () => {
  // Get site URL from environment
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  
  // If explicitly set API URL exists, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser context
  if (typeof window !== 'undefined') {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    // For deployed environments, use the same domain with /api path
    return `${window.location.origin}/api`;
  }
  
  // In server context with site URL
  if (siteUrl) {
    return `${siteUrl}/api`;
  }
  
  // Fallback for server context without site URL
  return 'http://localhost:3001';
};

// Default request options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Generic fetch function with type support
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Construct the full URL
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    // Make the request
    const response = await fetch(url, mergedOptions);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses like file downloads
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return response as unknown as T;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, options: RequestInit = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data: any, options: RequestInit = {}) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: <T = any>(endpoint: string, data: any, options: RequestInit = {}) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  patch: <T = any>(endpoint: string, data: any, options: RequestInit = {}) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: <T = any>(endpoint: string, options: RequestInit = {}) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),

  // Method for file uploads
  upload: <T = any>(endpoint: string, formData: FormData, options: RequestInit = {}) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {}, // Let the browser set the content type with boundary for multipart/form-data
    }),
};

export default api;

// API configuration is now handled by getBaseUrl() above

// Generic API error class
export class ApiError extends Error {
  status: number;
  statusText: string;
  
  constructor(message: string, status: number, statusText: string = '') {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.name = 'ApiError';
  }
}

// Helper to handle API responses
async function handleResponse(response: Response) {
  try {
    const contentType = response.headers.get('content-type');
    
    // Create a debug object with response details
    const debugInfo = {
      status: response.status,
      statusText: response.statusText,
      contentType,
      url: response.url
    };
    
    console.log('API response details:', debugInfo);
    
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      console.log('Received 204 No Content response');
      return { status: 'success', data: [] };
    }
    
    // Check for empty response
    const clone = response.clone();
    const text = await clone.text();
    if (!text || text.trim() === '') {
      console.log('Received empty response body');
      
      if (response.ok) {
        return { status: 'success', data: [] };
      } else {
        throw new ApiError(`Empty response with status ${response.status}`, response.status, response.statusText);
      }
    }
    
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
        console.log('Parsed JSON response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response text:', text || '(empty response)');
        
        // If status is 200 but empty JSON, return empty success response
        if (response.ok) {
          return { status: 'success', data: [] };
        }
        
        throw new ApiError('Failed to parse JSON response: ' + (jsonError as Error).message, response.status, response.statusText);
      }
      
      if (!response.ok) {
        console.error('API error response:', data || '(empty error response)');
        
        // Detailed validation error handling
        if (data && data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => 
            `${err.path}: ${err.message}`
          ).join('; ');
          throw new ApiError(`Validation failed: ${errorMessages}`, response.status, response.statusText);
        }
        
        // Check for specific database error types and provide clearer messages
        if (data && data.message && data.message.includes('duplicate key')) {
          throw new ApiError('A record with this information already exists. Please check for duplicates.', response.status, response.statusText);
        }
        
        if (data && data.message && data.message.includes('violates foreign key constraint')) {
          throw new ApiError('This operation references data that does not exist or has been deleted.', response.status, response.statusText);
        }
        
        if (data && data.message && data.message.includes('database')) {
          throw new ApiError('Database query error: ' + data.message, response.status, response.statusText);
        }
        
        throw new ApiError(data?.message || `API request failed with status ${response.status}`, response.status, response.statusText);
      }
      
      // Handle empty arrays properly
      if (data && data.data === null) {
        data.data = [];
      }
      
      // Ensure data has the expected structure
      if (!data.hasOwnProperty('data')) {
        data = { status: 'success', data: data };
      }
      
      return data;
    } else {
      // For non-JSON responses
      console.log('Non-JSON response:', text || '(empty response)');
      
      if (!response.ok) {
        throw new ApiError(`API request failed: ${text || response.statusText}`, response.status, response.statusText);
      }
      
      // Try to parse as JSON anyway in case content-type is incorrect
      try {
        const parsedData = JSON.parse(text);
        return parsedData;
      } catch (e) {
        // Return as plain text if it's not JSON
        return { status: 'success', data: text || [] };
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('Error processing API response:', error);
    throw new ApiError('Failed to process API response: ' + (error as Error).message, 500);
  }
}

// Generic fetch wrapper with error handling
async function fetchApi(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        console.log('Request body:', bodyObj);
      } catch {
        console.log('Request body (non-JSON or invalid):', options.body);
      }
    }
    
    // Add timestamp to avoid caching issues
    const urlWithTimestamp = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    
    const response = await fetch(urlWithTimestamp, {
      ...options,
      headers,
    });
    
    console.log(`API Response: ${response.status} ${response.statusText} from ${response.url}`);
    
    // Handle server errors immediately (500, 502, 503, 504)
    if (response.status >= 500) {
      console.error(`Server error: ${response.status} ${response.statusText}`);
      
      // Extract more detailed error information if possible
      let errorDetails = '';
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim() !== '') {
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.message || errorJson.error || errorText;
          } catch {
            errorDetails = errorText;
          }
        }
      } catch (e) {
        console.error('Failed to extract error details:', e);
      }
      
      // Create a more informative error message
      const statusText = response.statusText || 'Internal Server Error';
      const detailedMessage = errorDetails ? 
        `Server error (${response.status}): ${statusText}. Details: ${errorDetails}` : 
        `Server error (${response.status}): ${statusText}`;
      
      // Retry logic for server errors (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying request due to server error (${retryCount + 1}/2)...`);
        // Wait 1 second before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchApi(endpoint, options, retryCount + 1);
      }
      
      throw new ApiError(detailedMessage, response.status, statusText);
    }
    
    try {
      return await handleResponse(response);
    } catch (parseError) {
      console.error('Error handling response:', parseError);
      
      if (parseError instanceof ApiError) {
        throw parseError;
      }
      
      throw new ApiError('Failed to parse API response: ' + (parseError as Error).message, 
                         response.status || 500, response.statusText || '');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Check for specific error types to provide better messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error details:', error);
      
      // Retry logic for network errors (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying request due to network error (${retryCount + 1}/2)...`);
        // Wait 1 second before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchApi(endpoint, options, retryCount + 1);
      }
      
      throw new ApiError('Cannot connect to API server. Please check if the server is running.', 500);
    }
    
    if (error instanceof TypeError && error.message.includes('Cross-Origin Request Blocked')) {
      throw new ApiError('CORS error: API server rejected the request. Check CORS configuration.', 500);
    }
    
    console.error('API fetch error:', error);
    throw new ApiError('Network error or server is down: ' + (error as Error).message, 500);
  }
}

// Client API
export const clientApi = {
  getAll: () => fetchApi('/clients'),
  getById: (id: string) => fetchApi(`/clients/${id}`),
  create: (data: any) => fetchApi('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/clients/${id}`, { method: 'DELETE' }),
  getOrders: (id: string) => fetchApi(`/clients/${id}/orders`),
  getInvoices: (id: string) => fetchApi(`/clients/${id}/invoices`),
  getLogs: (id: string) => fetchApi(`/clients/${id}/logs`),
};

// Provider API
export const providerApi = {
  getAll: () => fetchApi('/providers'),
  getById: (id: string) => fetchApi(`/providers/${id}`),
  create: (data: any) => fetchApi('/providers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/providers/${id}`, { method: 'DELETE' }),
  getProducts: (id: string) => fetchApi(`/providers/${id}/products`),
  getOrders: (id: string) => fetchApi(`/providers/${id}/orders`),
};

// Product API
export const productApi = {
  getAll: () => fetchApi('/products'),
  getById: (id: string) => fetchApi(`/products/${id}`),
  create: (data: any) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  getByCategory: (categoryId: string) => fetchApi(`/products/category/${categoryId}`),
  getByBrand: (brandId: string) => fetchApi(`/products/brand/${brandId}`),
  getLowStock: () => fetchApi('/products/low-stock'),
  updateQuantity: (id: string, quantity: number) => 
    fetchApi(`/products/${id}/quantity`, { 
      method: 'PATCH', 
      body: JSON.stringify({ quantity }) 
    }),
};

// Category API
export const categoryApi = {
  getAll: async () => {
    const response = await fetchApi('/categories');
    return response;
  },
  getById: async (id: string) => {
    const response = await fetchApi(`/categories/${id}`);
    return response;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },
  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await fetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  },
  delete: async (id: string) => {
    const response = await fetchApi(`/categories/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
  bulkUpload: async (formData: FormData) => {
    // Use native fetch for FormData
    const url = `${API_BASE_URL}/categories/bulk-upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || `Failed to upload categories (${response.status})`,
        response.status,
        response.statusText
      );
    }
    
    return response.json();
  }
};

// Brand API
export const brandApi = {
  getAll: async () => {
    const response = await fetchApi('/brands');
    return response;
  },
  getById: async (id: string) => {
    const response = await fetchApi(`/brands/${id}`);
    return response;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await fetchApi('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },
  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await fetchApi(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  },
  delete: async (id: string) => {
    const response = await fetchApi(`/brands/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
  bulkUpload: async (formData: FormData) => {
    // Use native fetch for FormData
    const url = `${API_BASE_URL}/brands/bulk-upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || `Failed to upload brands (${response.status})`,
        response.status,
        response.statusText
      );
    }
    
    return response.json();
  }
};

// Professional Domain API
export const professionalDomainApi = {
  getAll: async () => {
    const response = await fetchApi('/professional-domains');
    return response;
  },
  getById: async (id: string) => {
    const response = await fetchApi(`/professional-domains/${id}`);
    return response;
  },
  create: async (data: any) => {
    const response = await fetchApi('/professional-domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },
  update: async (id: string, data: any) => {
    const response = await fetchApi(`/professional-domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  },
  delete: async (id: string) => {
    const response = await fetchApi(`/professional-domains/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
  bulkUpload: async (formData: FormData) => {
    // Use native fetch for FormData
    const url = `${API_BASE_URL}/professional-domains/bulk-upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || `Failed to upload professional domains (${response.status})`,
        response.status,
        response.statusText
      );
    }
    
    return response.json();
  },
  getClientsByDomain: async (id: string) => {
    const response = await fetchApi(`/professional-domains/${id}/clients`);
    return response;
  }
};

// Invoice API
export const invoiceApi = {
  getAll: () => fetchApi('/invoices'),
  getById: (id: string) => fetchApi(`/invoices/${id}`),
  create: (data: any) => fetchApi('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/invoices/${id}`, { method: 'DELETE' }),
  getByStatus: (status: string) => fetchApi(`/invoices/status/${status}`),
  updateStatus: (id: string, data: { status: string }) => 
    fetchApi(`/invoices/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
};

// Order API
export const orderApi = {
  getAll: () => fetchApi('/orders'),
  getById: (id: string) => fetchApi(`/orders/${id}`),
  create: (data: any) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/orders/${id}`, { method: 'DELETE' }),
  getByStatus: (status: string) => fetchApi(`/orders/status/${status}`),
  updateStatus: (id: string, status: string) => 
    fetchApi(`/orders/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    }),
  createInvoice: (id: string) => fetchApi(`/orders/${id}/create-invoice`, { method: 'POST' }),
  getLogs: (id: string) => fetchApi(`/orders/${id}/logs`),
};

// Client Logs API
export const clientLogApi = {
  getAll: () => fetchApi('/client-logs'),
  getById: (id: string) => fetchApi(`/client-logs/${id}`),
  create: (data: any) => fetchApi('/client-logs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/client-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/client-logs/${id}`, { method: 'DELETE' }),
  getByClient: (clientId: string) => fetchApi(`/client-logs/client/${clientId}`),
  getByDateRange: (startDate: string, endDate: string) => 
    fetchApi(`/client-logs/date-range?startDate=${startDate}&endDate=${endDate}`),
  getToday: () => fetchApi('/client-logs/today'),
};

// Order Logs API
export const orderLogApi = {
  getAll: () => fetchApi('/order-logs'),
  getById: (id: string) => fetchApi(`/order-logs/${id}`),
  create: (data: any) => fetchApi('/order-logs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/order-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/order-logs/${id}`, { method: 'DELETE' }),
  getByOrder: (orderId: string) => fetchApi(`/order-logs/order/${orderId}`),
  getByDateRange: (startDate: string, endDate: string) => 
    fetchApi(`/order-logs/date-range?start_date=${startDate}&end_date=${endDate}`),
  getToday: () => fetchApi('/order-logs/today'),
};

// Order Log Entries API
export const orderLogEntryApi = {
  getByLogId: (logId: string) => fetchApi(`/order-log-entries/log/${logId}`),
  addOrderToLog: (data: { order_log_id: string, order_id: string, notes?: string }) => 
    fetchApi('/order-log-entries', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  addMultipleOrdersToLog: (data: { 
    order_log_id: string, 
    entries: Array<{ order_id: string, notes?: string }> 
  }) => fetchApi('/order-log-entries/batch', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  removeOrderFromLog: (entryId: string) => fetchApi(`/order-log-entries/${entryId}`, { 
    method: 'DELETE' 
  })
}; 