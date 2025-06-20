// API Client implementations for the CRM system
import { api, ApiError } from './api';

// Client API
export const clientApi = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Provider API
export const providerApi = {
  getAll: () => api.get('/providers'),
  getById: (id: string) => api.get(`/providers/${id}`),
  create: (data: any) => api.post('/providers', data),
  update: (id: string, data: any) => api.put(`/providers/${id}`, data),
  delete: (id: string) => api.delete(`/providers/${id}`),
};

// Product API
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Category API
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  bulkUpload: (formData: FormData) => api.upload('/categories/bulk-upload', formData),
};

// Brand API
export const brandApi = {
  getAll: () => api.get('/brands'),
  getById: (id: string) => api.get(`/brands/${id}`),
  create: (data: any) => api.post('/brands', data),
  update: (id: string, data: any) => api.put(`/brands/${id}`, data),
  delete: (id: string) => api.delete(`/brands/${id}`),
  bulkUpload: (formData: FormData) => api.upload('/brands/bulk-upload', formData),
};

// Professional Domain API
export const professionalDomainApi = {
  getAll: () => api.get('/professional-domains'),
  getById: (id: string) => api.get(`/professional-domains/${id}`),
  create: (data: any) => api.post('/professional-domains', data),
  update: (id: string, data: any) => api.put(`/professional-domains/${id}`, data),
  delete: (id: string) => api.delete(`/professional-domains/${id}`),
  bulkUpload: (formData: FormData) => api.upload('/professional-domains/bulk-upload', formData),
};

// Invoice API
export const invoiceApi = {
  getAll: () => api.get('/invoices'),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
};

// Order API
export const orderApi = {
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};

// Client Logs API
export const clientLogApi = {
  getAll: () => api.get('/client-logs'),
  getById: (id: string) => api.get(`/client-logs/${id}`),
  create: (data: any) => api.post('/client-logs', data),
  update: (id: string, data: any) => api.put(`/client-logs/${id}`, data),
  delete: (id: string) => api.delete(`/client-logs/${id}`),
  getByClientId: (clientId: string) => api.get(`/client-logs/client/${clientId}`),
  closeLog: (id: string) => api.patch(`/client-logs/${id}/close`, {}),
};

// Order Logs API
export const orderLogApi = {
  getAll: () => api.get('/order-logs'),
  getById: (id: string) => api.get(`/order-logs/${id}`),
  create: (data: any) => api.post('/order-logs', data),
  update: (id: string, data: any) => api.put(`/order-logs/${id}`, data),
  delete: (id: string) => api.delete(`/order-logs/${id}`),
  getByOrderId: (orderId: string) => api.get(`/order-logs/order/${orderId}`),
  closeLog: (id: string) => api.patch(`/order-logs/${id}/close`, {}),
};

// Order Log Entries API
export const orderLogEntryApi = {
  getAll: () => api.get('/order-log-entries'),
  getById: (id: string) => api.get(`/order-log-entries/${id}`),
  create: (data: any) => api.post('/order-log-entries', data),
  update: (id: string, data: any) => api.put(`/order-log-entries/${id}`, data),
  delete: (id: string) => api.delete(`/order-log-entries/${id}`),
  getByLogId: (logId: string) => api.get(`/order-log-entries/log/${logId}`),
};

// Re-export the ApiError for convenience
export { ApiError }; 