import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sales API
export const salesApi = {
  getAll: (params?: { brand?: string; processed?: boolean; page?: number; limit?: number; groupBy?: string }) => {
    return api.get('/sales', { params });
  },
  getById: (id: string) => {
    return api.get(`/sales/${id}`);
  },
  getByOrderCode: (docCode: string) => {
    return api.get(`/sales/order/${docCode}`);
  },
  printOrder: (docCode: string) => {
    return api.post(`/sales/order/${docCode}/print`);
  },
  printOrders: (docCodes: string[]) => {
    return api.post('/sales/orders/print', { docCodes });
  },
  getAllOrders: (params?: { brand?: string; processed?: boolean; page?: number; limit?: number }) => {
    return api.get('/sales', { params: { ...params, groupBy: 'order' } });
  },
};

// Invoices API
export const invoicesApi = {
  getAll: () => {
    return api.get('/invoices');
  },
  getById: (id: string) => {
    return api.get(`/invoices/${id}`);
  },
  create: (data: any) => {
    return api.post('/invoices', data);
  },
  update: (id: string, data: any) => {
    return api.put(`/invoices/${id}`, data);
  },
  print: (id: string) => {
    return api.post(`/invoices/${id}/print`);
  },
  downloadPdf: (id: string) => {
    return api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  },
};

// Sync API
export const syncApi = {
  syncAll: () => {
    return api.post('/sync/all');
  },
  syncBrand: (brandName: string) => {
    return api.post(`/sync/brand/${brandName}`);
  },
};

