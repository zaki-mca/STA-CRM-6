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

// Get the API base URL
export const API_BASE_URL = getBaseUrl();

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

// Default request options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to handle API responses
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
    console.error('Error handling response:', error);
    throw error;
  }
}

// Main API fetch function with built-in retries
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second delay between retries
  
  try {
    // Construct the full URL
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Merge default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };
    
    console.log(`API Request: ${mergedOptions.method || 'GET'} ${url}`);
    
    // Make the request
    const response = await fetch(url, mergedOptions);
    const result = await handleResponse(response);
    return result.data;
  } catch (error) {
    console.error(`API request failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
    
    // Retry on network errors or 5xx server errors (but not on 4xx client errors)
    if (
      retryCount < maxRetries && 
      (!(error instanceof ApiError) || (error.status >= 500 && error.status < 600))
    ) {
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchApi(endpoint, options, retryCount + 1);
    }
    
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